import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Voter, VoterMessage } from '@/types/campaign';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Send, Smartphone, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ConversationWindowProps {
    voter: Voter | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ConversationWindow({ voter, isOpen, onClose }: ConversationWindowProps) {
    const [messages, setMessages] = useState<VoterMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && voter) {
            fetchHistory();
            const interval = setInterval(fetchHistory, 10000); // Poll every 10s
            return () => clearInterval(interval);
        }
    }, [isOpen, voter]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchHistory = async () => {
        if (!voter) return;
        try {
            const data = await api.getMessageHistory(voter.id);
            setMessages(data);
        } catch (error) {
            console.error('Failed to fetch history', error);
        }
    };

    const handleSend = async (channel: 'sms' | 'whatsapp') => {
        if (!voter || !newMessage.trim()) return;

        setIsSending(true);
        try {
            await api.sendMessage({
                voter_id: voter.id,
                channel,
                content: newMessage,
            });
            setNewMessage('');
            fetchHistory();
        } catch (error: any) {
            toast.error(error.message || 'Failed to send');
        } finally {
            setIsSending(false);
        }
    };

    if (!voter) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-[450px] flex flex-col h-full p-0">
                <SheetHeader className="p-6 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {voter.name[0]}
                        </div>
                        <div>
                            <p className="text-lg">{voter.name}</p>
                            <p className="text-sm text-muted-foreground">{voter.phoneNumber}</p>
                        </div>
                    </SheetTitle>
                </SheetHeader>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-950/20"
                >
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <Clock className="h-12 w-12 mb-2 opacity-20" />
                            <p>No message history yet</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.direction === 'outbound'
                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                            : 'bg-card text-card-foreground rounded-tl-none border'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                    <div className={`text-[10px] mt-1 flex items-center gap-1 opacity-70 ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                                        }`}>
                                        {msg.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} • {format(new Date(msg.created_at), 'p')}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 border-t bg-background">
                    <div className="flex flex-col gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            onKeyDown={(e) => e.key === 'Enter' && handleSend('sms')}
                            className="rounded-full"
                        />
                        <div className="flex gap-2">
                            <Button
                                onClick={() => handleSend('sms')}
                                disabled={isSending || !newMessage.trim()}
                                className="flex-1 rounded-full gap-2"
                                variant="outline"
                            >
                                <Smartphone className="h-4 w-4" />
                                Send SMS
                            </Button>
                            <Button
                                onClick={() => handleSend('whatsapp')}
                                disabled={isSending || !newMessage.trim()}
                                className="flex-1 rounded-full gap-2"
                            >
                                <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white font-bold share">W</div>
                                WhatsApp
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
