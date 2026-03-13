import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Voter } from '@/types/campaign';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { MessageSquare, Send, Smartphone } from 'lucide-react';

interface MessageModalProps {
    voter?: Voter;
    voterIds?: string[];
    isOpen: boolean;
    onClose: () => void;
}

const TEMPLATES = [
    { name: 'vote_reminder', label: 'Vote Reminder', content: 'Hello {{name}}, this is a reminder to come out and vote on election day! Every vote counts.' },
    { name: 'event_invite', label: 'Event Invitation', content: 'Hi {{name}}, you are cordially invited to our community town hall this Saturday at 2 PM. Hope to see you there!' },
    { name: 'registration_help', label: 'Registration Help', content: 'Hello {{name}}, do you need any assistance with voter registration or finding your polling station?' },
];

export function MessageModal({ voter, voterIds, isOpen, onClose }: MessageModalProps) {
    const [channel, setChannel] = useState<'sms' | 'whatsapp'>('sms');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
    const [messageContent, setMessageContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleTemplateChange = (value: string) => {
        setSelectedTemplate(value);
        if (value === 'custom') {
            setMessageContent('');
        } else {
            const template = TEMPLATES.find(t => t.name === value);
            if (template) {
                const name = voter?.name || 'Voter';
                setMessageContent(template.content.replace('{{name}}', name));
            }
        }
    };

    const handleSend = async () => {
        if (!messageContent.trim()) {
            toast.error('Message content cannot be empty');
            return;
        }

        setIsSending(true);
        try {
            await api.sendMessage({
                voter_id: voter?.id,
                voter_ids: voterIds,
                channel,
                content: messageContent,
                template_name: selectedTemplate !== 'custom' && channel === 'whatsapp' ? selectedTemplate : undefined
            });
            toast.success('Message sent successfully');
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const isBulk = !!voterIds && voterIds.length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        {isBulk ? `Send Bulk Message (${voterIds.length} voters)` : `Message ${voter?.name}`}
                    </DialogTitle>
                    <DialogDescription>
                        Choose a channel and template to send a message.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>Select Channel</Label>
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant={channel === 'sms' ? 'default' : 'outline'}
                                className="flex-1 gap-2"
                                onClick={() => setChannel('sms')}
                            >
                                <Smartphone className="h-4 w-4" />
                                SMS
                            </Button>
                            <Button
                                type="button"
                                variant={channel === 'whatsapp' ? 'default' : 'outline'}
                                className="flex-1 gap-2"
                                onClick={() => setChannel('whatsapp')}
                            >
                                <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white font-bold">W</div>
                                WhatsApp
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Template</Label>
                        <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="custom">Custom Message</SelectItem>
                                {TEMPLATES.map((t) => (
                                    <SelectItem key={t.name} value={t.name}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Message Content</Label>
                        <Textarea
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            placeholder="Type your message here..."
                            rows={4}
                            disabled={selectedTemplate !== 'custom' && channel === 'whatsapp'}
                        />
                        {channel === 'whatsapp' && selectedTemplate !== 'custom' && (
                            <p className="text-[10px] text-muted-foreground">
                                WhatsApp templates are pre-approved and cannot be edited.
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isSending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSend} disabled={isSending || !messageContent.trim()}>
                        {isSending ? 'Sending...' : 'Send Message'}
                        <Send className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
