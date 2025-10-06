import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, Mail, MessageSquare, Check, X, Clock } from 'lucide-react';
import { contactAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ContactRevealRequest {
  _id: string;
  requesterId: {
    _id: string;
    username: string;
    profile: {
      displayName?: string;
      avatar?: string;
      privateContact?: string;
    };
  };
  recipientId: {
    _id: string;
    username: string;
    profile: {
      displayName?: string;
      avatar?: string;
      privateContact?: string;
    };
  };
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  respondedAt?: string;
}

interface ContactRevealProps {
  request: ContactRevealRequest;
  type: 'incoming' | 'outgoing' | 'revealed';
}

export default function ContactReveal({ request, type }: ContactRevealProps) {
  const [message, setMessage] = useState('');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const queryClient = useQueryClient();

  const respondMutation = useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: 'accepted' | 'rejected' }) =>
      contactAPI.respondToRequest?.(requestId, status) || Promise.resolve(),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['contact-requests'] });
      queryClient.invalidateQueries({ queryKey: ['revealed-contacts'] });
      toast.success(status === 'accepted' ? 'Contact information shared!' : 'Request declined');
    },
    onError: () => {
      toast.error('Failed to respond to request');
    }
  });

  const requestMutation = useMutation({
    mutationFn: ({ userId, message }: { userId: string; message?: string }) =>
      contactAPI.requestReveal?.(userId, message) || Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sent-contact-requests'] });
      setShowRequestDialog(false);
      setMessage('');
      toast.success('Contact reveal request sent!');
    },
    onError: () => {
      toast.error('Failed to send contact reveal request');
    }
  });

  const handleAccept = () => {
    respondMutation.mutate({ requestId: request._id, status: 'accepted' });
  };

  const handleReject = () => {
    respondMutation.mutate({ requestId: request._id, status: 'rejected' });
  };

  const handleSendRequest = () => {
    const userId = type === 'incoming' ? request.requesterId._id : request.recipientId._id;
    requestMutation.mutate({ userId, message: message.trim() || undefined });
  };

  const otherUser = type === 'incoming' ? request.requesterId : request.recipientId;
  const displayName = otherUser.profile.displayName || otherUser.username;
  const timeAgo = formatDistanceToNow(new Date(request.createdAt), { addSuffix: true });

  const getContactInfo = (contact?: string) => {
    if (!contact) return null;
    
    // Simple email detection
    if (contact.includes('@')) {
      return { type: 'email', value: contact, icon: Mail };
    }
    
    // Simple phone detection (contains digits and common phone characters)
    if (/[\d\-\+\(\)\s]+/.test(contact)) {
      return { type: 'phone', value: contact, icon: Phone };
    }
    
    return { type: 'other', value: contact, icon: MessageSquare };
  };

  const contactInfo = type === 'revealed' ? getContactInfo(otherUser.profile.privateContact) : null;

  return (
    <div className="bg-card rounded-lg border p-4 space-y-3">
      <div className="flex items-start space-x-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={otherUser.profile.avatar} />
          <AvatarFallback>
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{displayName}</h3>
              <p className="text-sm text-muted-foreground">
                @{otherUser.username}
              </p>
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{timeAgo}</span>
            </div>
          </div>

          {request.message && (
            <div className="mt-2 p-2 bg-muted rounded text-sm">
              <p className="italic">"{request.message}"</p>
            </div>
          )}

          {type === 'revealed' && contactInfo && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2">
                <contactInfo.icon className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Contact Information Revealed
                </span>
              </div>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                {contactInfo.value}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        {type === 'incoming' && request.status === 'pending' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              disabled={respondMutation.isPending}
            >
              <X className="w-4 h-4 mr-2" />
              Decline
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={respondMutation.isPending}
            >
              <Check className="w-4 h-4 mr-2" />
              Share Contact
            </Button>
          </>
        )}

        {type === 'outgoing' && request.status === 'pending' && (
          <div className="flex items-center text-yellow-600 text-sm">
            <Clock className="w-4 h-4 mr-1" />
            Waiting for response
          </div>
        )}

        {request.status === 'accepted' && (
          <div className="flex items-center text-green-600 text-sm">
            <Check className="w-4 h-4 mr-1" />
            Contact Shared
          </div>
        )}

        {request.status === 'rejected' && (
          <div className="flex items-center text-red-600 text-sm">
            <X className="w-4 h-4 mr-1" />
            Request Declined
          </div>
        )}

        {type === 'revealed' && contactInfo && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (contactInfo.type === 'email') {
                window.open(`mailto:${contactInfo.value}`);
              } else if (contactInfo.type === 'phone') {
                window.open(`tel:${contactInfo.value}`);
              } else {
                navigator.clipboard.writeText(contactInfo.value);
                toast.success('Contact info copied to clipboard');
              }
            }}
          >
            <contactInfo.icon className="w-4 h-4 mr-2" />
            Contact
          </Button>
        )}
      </div>

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Phone className="w-4 h-4 mr-2" />
            Request Contact Info
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Contact Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send a request to {displayName} to share their contact information with you.
            </p>
            <Textarea
              placeholder="Add a message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowRequestDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendRequest}
                disabled={requestMutation.isPending}
              >
                {requestMutation.isPending ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}