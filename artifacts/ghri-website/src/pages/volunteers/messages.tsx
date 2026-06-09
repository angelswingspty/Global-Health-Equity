import React, { useState, useRef, useEffect } from "react";
import { useVolAuth } from "@/contexts/VolunteerAuthContext";
import { VolSidebar } from "@/components/volunteer/VolSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetVolMessages, useSendVolMessage, useGetVolCoordinators } from "@workspace/api-client-react";
import { MessageSquare, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VolMessages() {
  const { token, user } = useVolAuth();
  const authHeaders = { request: { headers: { Authorization: `Bearer ${token}` } } };
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, refetch } = useGetVolMessages(authHeaders);
  const { data: coordinators } = useGetVolCoordinators(authHeaders);
  const send = useSendVolMessage({ mutation: { onSuccess: () => { refetch(); setContent(""); } } });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, selectedId]);

  // Build contact list from messages + coordinators
  const contactMap = new Map<number, { id: number; name: string; initials: string }>();
  coordinators?.forEach(c => {
    if (c.id !== user?.id) contactMap.set(c.id, { id: c.id, name: c.name, initials: c.avatarInitials ?? c.name.slice(0, 2).toUpperCase() });
  });
  messages?.forEach(m => {
    const otherId = m.senderId === user?.id ? m.recipientId : m.senderId;
    if (otherId !== user?.id && !contactMap.has(otherId)) {
      contactMap.set(otherId, { id: otherId, name: `User ${otherId}`, initials: "?" });
    }
  });
  const contacts = Array.from(contactMap.values());

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
      <main className="flex-1 flex overflow-hidden">
        {/* Contact list */}
        <div className="w-64 bg-white border-r flex flex-col">
          <div className="px-4 py-4 border-b">
            <h2 className="font-semibold text-[#003F5C]">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">No contacts yet</div>
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
              <p className="text-sm text-muted-foreground mt-1">Choose a contact from the left to start messaging</p>
              {contacts.length === 0 && (
                <p className="text-xs text-muted-foreground mt-4 max-w-xs">
                  Coordinators will appear here automatically. Reach out to your coordinator for any questions.
                </p>
              )}
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
      </main>
    </div>
  );
}
