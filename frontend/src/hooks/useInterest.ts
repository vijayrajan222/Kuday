import { useState, useCallback, useEffect } from 'react';
import { interestService } from '@/services/interestService';
import type { InterestDetail, SendInterestPayload } from '@/types/interest.types';
import { toast } from '@/hooks/useToast';

export function useInterest(userId?: string) {
  const [sentInterests, setSentInterests] = useState<InterestDetail[]>([]);
  const [receivedInterests, setReceivedInterests] = useState<InterestDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchInterests = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [sent, received] = await Promise.all([
        interestService.getSentInterests(userId),
        interestService.getReceivedInterests(userId),
      ]);
      setSentInterests(sent);
      setReceivedInterests(received);
    } catch (err: unknown) {
      console.error('Failed to load interests', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchInterests();
    }
  }, [userId, fetchInterests]);

  const sendInterest = useCallback(
    async (payload: SendInterestPayload, recipientName: string) => {
      try {
        setProcessingId(payload.targetId);
        await interestService.sendInterest(payload);
        toast.success(`Interest request sent to ${recipientName}!`);
        await fetchInterests();
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        toast.error(error.response?.data?.message || 'Failed to send interest request');
      } finally {
        setProcessingId(null);
      }
    },
    [fetchInterests]
  );

  const acceptInterest = useCallback(
    async (interestId: string) => {
      if (!userId) return;
      try {
        setProcessingId(interestId);
        await interestService.updateStatus(interestId, userId, 'accepted');
        toast.success('Interest request accepted! You are now connected 🎉');
        await fetchInterests();
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        toast.error(error.response?.data?.message || 'Failed to accept interest');
      } finally {
        setProcessingId(null);
      }
    },
    [userId, fetchInterests]
  );

  const declineInterest = useCallback(
    async (interestId: string) => {
      if (!userId) return;
      try {
        setProcessingId(interestId);
        await interestService.updateStatus(interestId, userId, 'declined');
        toast.success('Interest request declined.');
        await fetchInterests();
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        toast.error(error.response?.data?.message || 'Failed to decline interest');
      } finally {
        setProcessingId(null);
      }
    },
    [userId, fetchInterests]
  );

  /**
   * Resolves the mutual connection status for a target card and the other user.
   * Priority:
   * 1. 'accepted': Either user has accepted any interest between them.
   * 2. 'pending': Current user sent an interest request that is still pending.
   * 3. 'received_pending': Other user sent an interest request to current user that is pending.
   * 4. 'declined': Request was declined.
   * 5. null: No connection request.
   */
  const getInterestStatus = useCallback(
    (targetId: string, otherUserId?: string) => {
      // 1. Check if these two users are already connected (accepted in either direction)
      if (otherUserId) {
        const isConnected =
          sentInterests.some(
            (i) => (i.receiverId === otherUserId || i.senderId === otherUserId) && i.status === 'accepted'
          ) ||
          receivedInterests.some(
            (i) => (i.senderId === otherUserId || i.receiverId === otherUserId) && i.status === 'accepted'
          );

        if (isConnected) return 'accepted';
      }

      // 2. Check if the specific target was accepted
      const isTargetAccepted =
        sentInterests.some((i) => i.targetId === targetId && i.status === 'accepted') ||
        receivedInterests.some((i) => i.targetId === targetId && i.status === 'accepted');

      if (isTargetAccepted) return 'accepted';

      // 3. Check if current user sent a pending request
      const sentPending = sentInterests.find(
        (i) =>
          (i.targetId === targetId || (otherUserId && i.receiverId === otherUserId)) &&
          i.status === 'pending'
      );
      if (sentPending) return 'pending';

      // 4. Check if current user received a pending request from this user
      const receivedPending = receivedInterests.find(
        (i) =>
          (i.targetId === targetId || (otherUserId && i.senderId === otherUserId)) &&
          i.status === 'pending'
      );
      if (receivedPending) return 'received_pending';

      // 5. Check if declined
      const sentDeclined = sentInterests.find(
        (i) =>
          (i.targetId === targetId || (otherUserId && i.receiverId === otherUserId)) &&
          i.status === 'declined'
      );
      if (sentDeclined) return 'declined';

      return null;
    },
    [sentInterests, receivedInterests]
  );

  return {
    sentInterests,
    receivedInterests,
    loading,
    processingId,
    sendInterest,
    acceptInterest,
    declineInterest,
    getInterestStatus,
    refreshInterests: fetchInterests,
  };
}
