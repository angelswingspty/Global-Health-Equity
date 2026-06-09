import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { MessageSquare, Send } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProtectedTelehealthRoute } from "@/components/telehealth/ProtectedTelehealthRoute";
import { useTelehealthAuth } from "@/contexts/TelehealthAuthContext";
import { useGetMessages, useGetProviders, useSendMessage, getGetMessagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield } from "lucide-react";

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});

export default function PatientMessages() {
  const { user, token } = useTelehealthAuth();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);

  const { data: messages } = useGetMessages(
    selectedProviderId ? { withUserId: selectedProviderId } : undefined,
    {
      query: { enabled: !!token, queryKey: ["getMessages", selectedProviderId] },
      request: { headers: { Authorization: `Bearer ${token}` } }
    }
  );

  const { data: providers } = useGetProviders({
    query: { enabled: !!token, queryKey: ["getProviders"] },
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const sendMutation = useSendMessage({
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: "" },
  });

  const onSubmit = (values: z.infer<typeof messageSchema>) => {
    if (!selectedProviderId) return;
    
    sendMutation.mutate(
      { data: { recipientId: selectedProviderId, content: values.content } },
      {
        onSuccess: () => {
          form.reset();
          queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey(selectedProviderId ? { withUserId: selectedProviderId } : undefined) });
        }
      }
    );
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Set default provider if none selected
  useEffect(() => {
    if (!selectedProviderId && providers && providers.length > 0) {
      setSelectedProviderId(providers[0].id);
    }
  }, [providers, selectedProviderId]);

  return (
    <ProtectedTelehealthRoute allowedRoles={["patient"]}>
      <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
            <MessageSquare className="w-8 h-8 mr-3 text-primary" />
            Secure Messages
          </h1>
          <p className="text-slate-500 mt-1 flex items-center">
            <Shield className="w-4 h-4 text-green-600 mr-2" />
            End-to-end encrypted messaging with your healthcare providers.
          </p>
        </div>

        <Card className="flex-1 flex flex-col md:flex-row overflow-hidden shadow-sm border-slate-200">
          {/* Provider List (Sidebar) */}
          <div className="w-full md:w-64 lg:w-80 border-b md:border-b-0 md:border-r bg-slate-50 flex flex-col">
            <div className="p-4 border-b bg-white">
              <h3 className="font-semibold text-slate-900 mb-2">Conversations</h3>
              <div className="md:hidden">
                <Select value={selectedProviderId?.toString()} onValueChange={(v) => setSelectedProviderId(Number(v))}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers?.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        Dr. {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <ScrollArea className="flex-1 hidden md:block">
              {providers?.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProviderId(p.id)}
                  className={`w-full text-left p-4 border-b hover:bg-slate-100 transition-colors ${
                    selectedProviderId === p.id ? 'bg-blue-50 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                      {p.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold text-slate-900 truncate">Dr. {p.name}</p>
                      <p className="text-xs text-slate-500 truncate">{p.specialty || "Provider"}</p>
                    </div>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-white min-h-[400px]">
            {selectedProviderId ? (
              <>
                <div className="p-4 border-b flex items-center gap-3 bg-white">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                    {providers?.find(p => p.id === selectedProviderId)?.name.charAt(0) || "D"}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Dr. {providers?.find(p => p.id === selectedProviderId)?.name}</h3>
                    <p className="text-xs text-slate-500">Usually replies within 24 hours</p>
                  </div>
                </div>

                <div 
                  className="flex-1 overflow-y-auto p-4 space-y-6"
                  ref={scrollRef}
                >
                  {messages?.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 flex-col">
                      <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                      <p>No messages yet. Send a message to start the conversation.</p>
                    </div>
                  ) : (
                    messages?.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div 
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                              isMe 
                                ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                                : 'bg-slate-100 text-slate-900 rounded-tl-sm'
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
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                placeholder="Type your secure message..." 
                                className="bg-white rounded-full px-4"
                                autoComplete="off"
                                {...field} 
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        className="rounded-full shrink-0"
                        disabled={sendMutation.isPending || !form.watch("content").trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </Form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                Select a provider to start messaging
              </div>
            )}
          </div>
        </Card>
      </div>
    </ProtectedTelehealthRoute>
  );
}