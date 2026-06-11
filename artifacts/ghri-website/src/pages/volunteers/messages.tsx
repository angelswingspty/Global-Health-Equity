import React, { useState, useRef, useEffect } from "react";
import { useVolAuth } from "@/contexts/VolunteerAuthContext";
import { VolSidebar } from "@/components/volunteer/VolSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetVolMessages, useSendVolMessage, useGetVolDirectory } from "@workspace/api-client-react";
import { MessageSquare, Send, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VolMessages() {
  const { token, user } = useVolAuth();
  const authHeaders = { request: { headers: { Authorization: `Bearer ${token}` } } };
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [extraContactIds, setExtraContactIds] = useState<number[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, refetch } = useGetVolMessages(authHeaders);
  const { data: directory } = useGetVolDirectory(authHeaders);
  const send = useSendVolMessage({ ...authHeaders, mutation: { onSuccess: () => { refetch(); setContent(""); } } });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, selectedId]);

  const initialsFor = (name: string, fallback?: string | null) => fallback ?? name.slice(0, 2).toUpperCase();

  // Directory: every contact the current user is allowed to message (name resolution source)
  const directoryMap = new Map<number, { id: number; name: string; initials: string; role: string }>();
  directory?.forEach(d => {
    directoryMap.set(d.id, { id: d.id, name: d.name, initials: initialsFor(d.name, d.avatarInitials), role: d.role });
  });

  // Conversation list = people you've messaged + any contacts started via "New message"
  const contactMap = new Map<number, { id: number; name: string; initials: string }>();
  const addContact = (id: number) => {
    if (id === user?.id || contactMap.has(id)) return;
    const dir = directoryMap.get(id);
    contactMap.set(id, dir ? { id, name: dir.name, initials: dir.initials } : { id, name: `User ${id}`, initials: "?" });
  };
  messages?.forEach(m => {
    const otherId = m.senderId === user?.id ? m.recipientId : m.senderId;
    addContact(otherId);
  });
  extraContactIds.forEach(addContact);
  const contacts = Array.from(contactMap.values());

  // People available to start a NEW conversation (in directory, not already in the list)
  const pickerContacts = (directory ?? [])
    .filter(d => d.id !== user?.id && !contactMap.has(d.id))
    .filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
    .map(d => ({ id: d.id, name: d.name, initials: initialsFor(d.name, d.avatarInitials), role: d.role }));

  const startConversation = (id: number) => {
    setExtraContactIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    setSelectedId(id);
    setShowPicker(false);
    setSearch("");
  };

  const thread = messages?.filter(m =>
    (m.senderId === user?.id && m.recipientId === selectedId) ||
    (m.recipientId === user?.id && m.senderId === selectedId)
  ) ?? [];

  const lastMessages = new Map<number, typeof messages extends (infer T)[] | undefined ? T : never>();
  messages?.forEach(m => {
    const otherId = m.senderId === user?.id ? m.recipientId : m.senderId;
    if (!lastMessages.has(otherId)) lastMessages.set(otherId, m);
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedId) return;
    send.mutate({ data: { recipientId: selectedId, content: content.trim() } });
  };

  const selectedContact = selectedId ? contactMap.get(selectedId) : null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VolSidebar />
      <main className="flex-1 flex overflow-hidden relative">
        {/* Contact list */}
        <div className="w-64 bg-white border-r flex flex-col">
          <div className="px-4 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-[#003F5C]">Messages</h2>
            <Button
              size="sm"
              onClick={() => setShowPicker(true)}
              className="h-8 gap-1.5 bg-[#0093D5] hover:bg-[#007ab8] text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No conversations yet.<br />Tap <span className="font-medium text-[#0093D5]">New</span> to start one.
              </div>
            )}
            {contacts.map(contact => {
              const last = lastMessages.get(contact.id);
              return (
                <button
                  key={contact.id}
                  onClick={() => setSelectedId(contact.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b",
                    selectedId === contact.id ? "bg-[#0093D5]/5 border-l-2 border-l-[#0093D5]" : ""
                  )}
                >
                  <div className="w-9 h-9 rounded-full bg-[#003F5C] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {contact.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#003F5C] truncate">{contact.name}</p>
                    {last && (
                      <p className="text-xs text-muted-foreground truncate">
                        {last.senderId === user?.id ? "You: " : ""}{last.content}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
              <p className="font-medium text-[#003F5C]">Select a conversation</p>
              <p className="text-sm text-muted-foreground mt-1">Choose a contact from the left, or start a new conversation</p>
              <Button
                onClick={() => setShowPicker(true)}
                className="mt-4 gap-1.5 bg-[#0093D5] hover:bg-[#007ab8]"
              >
                <Plus className="w-4 h-4" /> New message
              </Button>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 bg-white border-b flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#003F5C] flex items-center justify-center text-white text-xs font-bold">
                  {selectedContact?.initials ?? "?"}
                </div>
                <p className="font-semibold text-[#003F5C]">{selectedContact?.name ?? "Unknown"}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {thread.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">No messages yet. Say hello!</p>
                  </div>
                )}
                {thread.map(msg => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                        isMe ? "bg-[#0093D5] text-white rounded-tr-sm" : "bg-white text-[#003F5C] rounded-tl-sm shadow-sm border"
                      )}>
                        <p>{msg.content}</p>
                        <p className={cn("text-[10px] mt-1", isMe ? "text-white/60" : "text-muted-foreground")}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSend} className="px-6 py-4 bg-white border-t flex gap-3">
                <Input
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1"
                />
                <Button type="submit" className="bg-[#0093D5] hover:bg-[#007ab8]" disabled={send.isPending || !content.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          )}
        </div>

        {/* New message contact picker */}
        {showPicker && (
          <div
            className="absolute inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24"
            onClick={() => { setShowPicker(false); setSearch(""); }}
          >
            <div
              className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h3 className="font-semibold text-[#003F5C]">New message</h3>
                <button onClick={() => { setShowPicker(false); setSearch(""); }} className="text-muted-foreground hover:text-[#003F5C]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search contacts…"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {pickerContacts.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {search ? "No matching contacts" : "No contacts available"}
                  </div>
                )}
                {pickerContacts.map(c => (
                  <button
                    key={c.id}
                    onClick={() => startConversation(c.id)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left border-b last:border-b-0"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#003F5C] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {c.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#003F5C] truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{c.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
