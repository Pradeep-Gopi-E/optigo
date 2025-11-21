import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    inviteCode: string;
    tripTitle: string;
}

export default function ShareTripModal({ isOpen, onClose, inviteCode, tripTitle }: ShareTripModalProps) {
    const [copied, setCopied] = useState(false);

    // Generate the full invite link
    // In production, this would use the actual domain
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const inviteLink = `${origin}/trips/join/${inviteCode}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            toast.success('Invite link copied to clipboard!');

            // Reset copied state after 2 seconds
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (err) {
            toast.error('Failed to copy link');
            console.error('Failed to copy:', err);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Share Trip
                    </DialogTitle>
                    <DialogDescription>
                        Invite friends to join <strong>{tripTitle}</strong>. Anyone with this link can join the trip.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="invite-link">Invite Link</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="invite-link"
                                value={inviteLink}
                                readOnly
                                className="flex-1 font-mono text-sm"
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={handleCopy}
                                className={copied ? "text-green-600 border-green-600" : ""}
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                        <p>
                            Friends who join can vote on dates, destinations, and add their preferences.
                        </p>
                    </div>
                </div>

                <DialogFooter className="sm:justify-end">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
