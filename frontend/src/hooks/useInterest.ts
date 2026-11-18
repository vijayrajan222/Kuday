import { useState, useCallback, useEffect } from 'react';
import { interestService } from '@/services/interestService';
import type { InterestDetail, SendInterestPayload } from '@/types/interest.types';
import { toast } from '@/hooks/useToast';

// Module-level cache to share interest state across pages and prevent duplicate network calls
const cachedSentInterests: Record<string, InterestDetail[]> = {};
const cachedReceivedInterests: Record<string, InterestDetail[]> = {};
const lastInterestFetchTime: Record<string, number> = {};
const inFlightInterestPromise: Record<
  string,
  Promise<{ sent: InterestDetail[]; received: InterestDetail[] }> | undefined
> = {};

const INTEREST_CACHE_TTL_MS = 8000; // 8 seconds memory cache across page transitions

export function clearInterestCache(userId?: string) {
  if (userId) {
    delete cachedSentInterests[userId];
    delete cachedReceivedInterests[userId];
    delete lastInterestFetchTime[userId];
    delete inFlightInterestPromise[userId];
  } else {
    for (const key of Object.keys(cachedSentInterests)) delete cachedSentInterests[key];
    for (const key of Object.keys(cachedReceivedInterests)) delete cachedReceivedInterests[key];
    for (const key of Object.keys(lastInterestFetchTime)) delete lastInterestFetchTime[key];
    for (const key of Object.keys(inFlightInterestPromise)) delete inFlightInterestPromise[key];
  }
}

export function useInterest(userId?: string) {
  const [sentInterests, setSentInterests] = useState<InterestDetail[]>(() => {
    return userId && cachedSentInterests[userId] ? cachedSentInterests[userId] : [];
  });
  const [receivedInterests, setReceivedInterests] = useState<InterestDetail[]>(() => {
    return userId && cachedReceivedInterests[userId] ? cachedReceivedInterests[userId] : [];
  });
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchInterests = useCallback(async (force = false) => {
    if (!userId) return;

    const now = Date.now();
    const lastFetch = lastInterestFetchTime[userId] || 0;
    const isCacheFresh = now - lastFetch < INTEREST_CACHE_TTL_MS;

    // Use cached data immediately if fresh and not forced
    if (!force && isCacheFresh && cachedSentInterests[userId] && cachedReceivedInterests[userId]) {
      setSentInterests(cachedSentInterests[userId]);
      setReceivedInterests(cachedReceivedInterests[userId]);
      return;
    }

    // Reuse in-flight request if already in progress for this user
    if (inFlightInterestPromise[userId]) {
      try {
        const { sent, received } = await inFlightInterestPromise[userId]!;
        setSentInterests(sent);
        setReceivedInterests(received);
      } catch {
        // Handled by original request
      }
      return;
    }

    setLoading(true);
    const fetchPromise = Promise.all([
      interestService.getSentInterests(userId),
      interestService.getReceivedInterests(userId),
    ])
      .then(([sent, received]) => {
        cachedSentInterests[userId] = sent;
        cachedReceivedInterests[userId] = received;
        lastInterestFetchTime[userId] = Date.now();
        return { sent, received };
      })
      .finally(() => {
        delete inFlightInterestPromise[userId];
      });

    inFlightInterestPromise[userId] = fetchPromise;

    try {
      const { sent, received } = await fetchPromise;
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
      if (cachedSentInterests[userId] && cachedReceivedInterests[userId]) {
        setSentInterests(cachedSentInterests[userId]);
        setReceivedInterests(cachedReceivedInterests[userId]);
      }
      fetchInterests();
    }
  }, [userId, fetchInterests]);

  const sendInterest = useCallback(
    async (payload: SendInterestPayload, recipientName: string) => {
      try {
        setProcessingId(payload.targetId);
        await interestService.sendInterest(payload);
        toast.success(`Interest request sent to ${recipientName}!`);
        await fetchInterests(true);
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
        toast.success('Interest request accepted! You are now connected');
        await fetchInterests(true);
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
        await fetchInterests(true);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        toast.error(error.response?.data?.message || 'Failed to decline interest');
      } finally {
        setProcessingId(null);
      }
    },
    [userId, fetchInterests]
  );

  const cancelInterest = useCallback(
    async (interestId: string) => {
      if (!userId) return;
      try {
        setProcessingId(interestId);
        await interestService.updateStatus(interestId, userId, 'cancelled');
        toast.success('Connection request cancelled.');
        await fetchInterests(true);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        toast.error(error.response?.data?.message || 'Failed to cancel request');
      } finally {
        setProcessingId(null);
      }
    },
    [userId, fetchInterests]
  );

  const unmatch = useCallback(
    async (interestId: string, partnerName?: string) => {
      if (!userId) return;
      try {
        setProcessingId(interestId);
        await interestService.updateStatus(interestId, userId, 'unmatched');
        toast.success(partnerName ? `Unmatched with ${partnerName}` : 'Connection removed');
        await fetchInterests(true);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        toast.error(error.response?.data?.message || 'Failed to unmatch');
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
    cancelInterest,
    unmatch,
    getInterestStatus,
    refreshInterests: fetchInterests,
  };
}
