import { useState, useEffect, useRef, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { toast } from '@/hooks/useToast';
import type { CallType } from '@/types/chat.types';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected';

export interface IncomingCallData {
  callId: string;
  callerId: string;
  callerName?: string;
  callType: CallType;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useCall(socket: Socket | null, currentUserId?: string) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [callType, setCallType] = useState<CallType>('video');
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otherUserIdRef = useRef<string | null>(null);
  const activeCallIdRef = useRef<string | null>(null);

  // Keep refs in sync
  useEffect(() => {
    otherUserIdRef.current = otherUserId;
  }, [otherUserId]);

  useEffect(() => {
    activeCallIdRef.current = activeCallId;
  }, [activeCallId]);

  // Cleanup helper
  const cleanupCall = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    pendingCandidatesRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setActiveCallId(null);
    setOtherUserId(null);
    setIncomingCall(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
  }, []);

  // Timer for duration when connected
  useEffect(() => {
    if (callState === 'connected') {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Create PeerConnection
  const createPeerConnection = useCallback((targetUserId: string, currentCallId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc:signal', {
          callId: currentCallId,
          to: targetUserId,
          signal: {
            type: 'candidate',
            candidate: event.candidate.toJSON(),
          },
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        // Handled via socket call:ended or disconnect
      }
    };

    return pc;
  }, [socket]);

  // Acquire media stream
  const getMedia = useCallback(async (type: CallType): Promise<MediaStream | null> => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      toast.error('Unable to access camera/microphone. Please check browser permissions.');
      return null;
    }
  }, []);

  // 1. Start outgoing call
  const startCall = useCallback(async (receiverId: string, type: CallType = 'video'): Promise<{ success: boolean; error?: string }> => {
    if (!socket || !currentUserId) return { success: false, error: 'Socket not connected' };
    if (callState !== 'idle') {
      toast.error('You are already on a call or ringing');
      return { success: false, error: 'Already on a call' };
    }

    setCallType(type);
    setOtherUserId(receiverId);
    setCallState('calling');

    return new Promise((resolve) => {
      socket.emit(
        'call:invite',
        { receiverId, callType: type },
        async (res: { success: boolean; callId?: string; error?: string }) => {
          if (!res || !res.success || !res.callId) {
            const err = res?.error || 'Unable to place call';
            toast.error(err);
            cleanupCall();
            resolve({ success: false, error: err });
            return;
          }
          setActiveCallId(res.callId);
          resolve({ success: true });
        }
      );
    });
  }, [socket, currentUserId, callState, cleanupCall]);

  // 2. Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!socket || !incomingCall) return;

    const stream = await getMedia(incomingCall.callType);
    if (!stream) {
      declineCall();
      return;
    }

    const pc = createPeerConnection(incomingCall.callerId, incomingCall.callId);
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    setCallType(incomingCall.callType);
    setOtherUserId(incomingCall.callerId);
    setActiveCallId(incomingCall.callId);
    setCallState('connected');
    setIncomingCall(null);

    socket.emit('call:accept', { callId: incomingCall.callId });
  }, [socket, incomingCall, getMedia, createPeerConnection]);

  // 3. Decline incoming call
  const declineCall = useCallback(() => {
    if (!socket || !incomingCall) return;
    socket.emit('call:decline', { callId: incomingCall.callId });
    setIncomingCall(null);
    setCallState('idle');
  }, [socket, incomingCall]);

  // 4. End active or ringing call
  const endCall = useCallback(() => {
    if (!socket) {
      cleanupCall();
      return;
    }

    const callId = activeCallId || incomingCall?.callId;
    if (callId) {
      socket.emit('call:end', { callId });
    }
    cleanupCall();
  }, [socket, activeCallId, incomingCall, cleanupCall]);

  // 5. Toggle Audio Mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // 6. Toggle Video Off
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Incoming call
    const handleIncoming = (data: IncomingCallData) => {
      if (callState !== 'idle') {
        // Already busy
        socket.emit('call:decline', { callId: data.callId });
        return;
      }
      setIncomingCall(data);
      setCallType(data.callType);
      setActiveCallId(data.callId);
      setOtherUserId(data.callerId);
      setCallState('ringing');
    };

    // Call accepted by remote party (caller side handler)
    const handleAccepted = async (data: { callId: string; answeredAt: string }) => {
      if (callState === 'calling' && otherUserIdRef.current) {
        const stream = await getMedia(callType);
        if (!stream) {
          endCall();
          return;
        }

        const pc = createPeerConnection(otherUserIdRef.current, data.callId);
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Create WebRTC Offer
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc:signal', {
            callId: data.callId,
            to: otherUserIdRef.current,
            signal: offer,
          });
          setCallState('connected');
        } catch (err) {
          console.error('Error creating WebRTC offer:', err);
          endCall();
        }
      }
    };

    // Call ended by remote party or timeout
    const handleEnded = (data: { callId: string; reason?: string }) => {
      if (data.reason === 'declined') {
        toast.info('Call was declined');
      } else if (data.reason === 'missed') {
        toast.info('Call was not answered');
      } else if (data.reason === 'busy') {
        toast.info('User is busy on another call');
      }
      cleanupCall();
    };

    // WebRTC Signaling (relay offer, answer, ice-candidate)
    const handleSignal = async (data: {
      from: string;
      callId?: string;
      signal: RTCSessionDescriptionInit | { type: 'candidate'; candidate: RTCIceCandidateInit };
    }) => {
      const pc = pcRef.current;
      const signal = data.signal;

      if (!signal) return;

      if ('type' in signal && signal.type === 'offer') {
        // Receiver receives offer
        let currentPc = pc;
        if (!currentPc) {
          const stream = localStreamRef.current || (await getMedia(callType));
          currentPc = createPeerConnection(data.from, data.callId || activeCallIdRef.current || '');
          if (stream) {
            stream.getTracks().forEach((track) => currentPc?.addTrack(track, stream));
          }
        }

        try {
          await currentPc.setRemoteDescription(new RTCSessionDescription(signal as RTCSessionDescriptionInit));

          // Drain queued candidates
          while (pendingCandidatesRef.current.length > 0) {
            const cand = pendingCandidatesRef.current.shift();
            if (cand) await currentPc.addIceCandidate(new RTCIceCandidate(cand));
          }

          const answer = await currentPc.createAnswer();
          await currentPc.setLocalDescription(answer);

          socket.emit('webrtc:signal', {
            callId: data.callId || activeCallIdRef.current,
            to: data.from,
            signal: answer,
          });
          setCallState('connected');
        } catch (err) {
          console.error('Error handling offer signal:', err);
        }
      } else if ('type' in signal && signal.type === 'answer') {
        // Caller receives answer
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signal as RTCSessionDescriptionInit));
            while (pendingCandidatesRef.current.length > 0) {
              const cand = pendingCandidatesRef.current.shift();
              if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
          } catch (err) {
            console.error('Error setting remote answer:', err);
          }
        }
      } else if ('type' in signal && signal.type === 'candidate') {
        // ICE candidate received
        const cand = (signal as { type: 'candidate'; candidate: RTCIceCandidateInit }).candidate;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (err) {
            console.error('Error adding ICE candidate:', err);
          }
        } else {
          pendingCandidatesRef.current.push(cand);
        }
      }
    };

    const handleCallError = (data: { message?: string; error?: string }) => {
      const msg = data?.message || data?.error || 'Call failed';
      toast.error(msg);
      cleanupCall();
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:accepted', handleAccepted);
    socket.on('call:ended', handleEnded);
    socket.on('call:error', handleCallError);
    socket.on('webrtc:signal', handleSignal);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:accepted', handleAccepted);
      socket.off('call:ended', handleEnded);
      socket.off('call:error', handleCallError);
      socket.off('webrtc:signal', handleSignal);
    };
  }, [socket, callState, callType, getMedia, createPeerConnection, cleanupCall, endCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  return {
    callState,
    activeCallId,
    otherUserId,
    callType,
    incomingCall,
    callDuration,
    isMuted,
    isVideoOff,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
}
