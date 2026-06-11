import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { MessageSquare, Send, Plus, Search, X, Shield, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProtectedTelehealthRoute } from "@/components/telehealth/ProtectedTelehealthRoute";
import { useTelehealthAuth } from "@/contexts/TelehealthAuthContext";
import { useGetMessages, useGetPatients, useSendMessage } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function ProviderMessages() {
  const { user, token } = useTelehealthAuth();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const authHeaders = { request: { headers: { Authorization: `Bearer ${token}` } } };

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [extraContactIds, setExtraContactIds] = useState<number[]>([]);

  const { data: messages } = useGetMessages(undefined, {
    query: { enabled: !!token, queryKey: ["getMessages", user?.id] },
    ...authHeaders,
  });

  const { data: patients } = useGetPatients({
    query: { enabled: !!token, queryKey: ["getPatients", user?.id] },
    ...authHeaders,
  });

  const sendMutation = useSendMessage(authHeaders);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, selectedId]);

  // Directory: every patient the provider is allowed to message
  const directoryMap = new Map<number, { id: number; name: string }>();
  patients?.forEach((p) => directoryMap.set(p.id, { id: p.id, name: p.name }));

  // Conversation list = patients you've messaged + any started via "New message"
  const contactMap = new Map<number, { id: number; name: string }>();
  const addContact = (id: number) => {
    if (id === user?.id || contactMap.has(id)) return;
    const dir = directoryMap.get(id);
    contactMap.set(id, dir ?? { id, name: `User ${id}` });
  };
  messages?.forEach((m) => addContact(m.senderId === user?.id ? m.recipientId : m.senderId));
  extraContactIds.forEach(addContact);
  const contacts = Array.from(contactMap.values());

  // Patients available to start a NEW conversation (not already in the list)
  const pickerContacts = (patients ?? [])
    .filter((p) => p.id !== user?.id && !contactMap.has(p.id))
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const startConversation = (id: number) => {
    setExtraContactIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setSelectedId(id);
    setShowPicker(false);
    setSearch("");
  };

  const thread = (messages ?? [])
    .filter(
      (m) =>
        (m.senderId === user?.id && m.recipientId === selectedId) ||
        (m.recipientId === user?.id && m.senderId === selectedId)
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const lastMessages = new Map<number, (typeof thread)[number]>();
  messages
    ?.slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .forEach((m) => {
      const otherId = m.senderId === user?.id ? m.recipientId : m.senderId;
      if (!lastMessages.has(otherId)) lastMessages.set(otherId, m);
    });

  const selectedContact = selectedId ? contactMap.get(selectedId) : null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedId) return;
    sendMutation.mutate(
      { data: { recipientId: selectedId, content: content.trim() } },
      {
        onSuccess: () => {
          setContent("");
          queryClient.invalidateQueries({ queryKey: ["getMessages", user?.id] });
        },
      }
    );
  };

  return (
    <ProtectedTelehealthRoute allowedRoles={["provider"]}>
      <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
            <MessageSquare className="w-8 h-8 mr-3 text-secondary" />
            Patient Messages
          </h1>
          <p className="text-slate-500 mt-1 flex items-center">
            <Shield className="w-4 h-4 text-green-600 mr-2" />
            End-to-end encrypted messaging with your patients.
          </p>
        </div>

        <Card className="flex-1 flex flex-col md:flex-row overflow-hidden shadow-sm border-slate-200 relative">
          {/* Conversation List (Sidebar) */}
          <div className="w-full md:w-64 lg:w-80 border-b md:border-b-0 md:border-r bg-slate-50 flex flex-col">
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Conversations</h3>
              <Button size="sm" className="h-8 gap-1.5 text-xs bg-secondary hover:bg-secondary/90" onClick={() => setShowPicker(true)}>
                <Plus className="w-3.5 h-3.5" /> New
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {contacts.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  No conversations yet.
                  <br />
                  Tap <span className="font-medium text-secondary">New</span> to message a patient.
                </div>
              ) : (
                contacts.map((c) => {
                  const last = lastMessages.get(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        "w-full text-left p-4 border-b hover:bg-slate-100 transition-colors",
                        selectedId === c.id ? "bg-secondary/5 border-l-4 border-l-secondary" : ""
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden flex-1">
                          <p className="font-semibold text-slate-900 truncate">{c.name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {last ? `${last.senderId === user?.id ? "You: " : ""}${last.content}` : "Patient"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-white min-h-[400px]">
            {selectedId ? (
              <>
                <div className="p-4 border-b flex items-center gap-3 bg-white">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-secondary font-bold">
                    {selectedContact?.name.charAt(0) || "P"}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{selectedContact?.name}</h3>
                    <p className="text-xs text-green-600 font-medium">Active Patient</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                  {thread.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 flex-col">
                      <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                      <p>No messages yet. Send a message to start the conversation.</p>
                    </div>
                  ) : (
                    thread.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                              isMe ? "bg-secondary text-white rounded-tr-sm" : "bg-slate-100 text-slate-900 rounded-tl-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 mx-1">
                            {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-4 border-t bg-slate-50">
                  <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Type your secure message..."
                      className="bg-white rounded-full px-4 border-slate-300 flex-1"
                      autoComplete="off"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="rounded-full shrink-0 bg-secondary hover:bg-secondary/90"
                      disabled={sendMutation.isPending || !content.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                <Users className="w-16 h-16 text-slate-200" />
                <p>Select a conversation or start a new one</p>
                <Button className="gap-1.5 bg-secondary hover:bg-secondary/90" onClick={() => setShowPicker(true)}>
                  <Plus className="w-4 h-4" /> New message
                </Button>
              </div>
            )}
          </div>

          {/* New message contact picker */}
          {showPicker && (
            <div
              className="absolute inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24"
              onClick={() => {
                setShowPicker(false);
                setSearch("");
              }}
            >
              <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b">
                  <h3 className="font-semibold text-slate-900">New message</h3>
                  <button
                    onClick={() => {
                      setShowPicker(false);
                      setSearch("");
                    }}
                    className="text-slate-400 hover:text-slate-900"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search patients..."
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {pickerContacts.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">
                      {search ? "No matching patients" : "No patients available"}
                    </div>
                  ) : (
                    pickerContacts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => startConversation(p.id)}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left border-b last:border-b-0"
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                          <p className="text-xs text-slate-500">Patient</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </ProtectedTelehealthRoute>
  );
}
