import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Song, Track, Note, ChatMessage, SongContributor } from '@/types';

interface UseSocketOptions {
  songId: string;
  user: User | null;
  onPresenceUpdate?: (users: User[]) => void;
  onSongUpdate?: (updates: Partial<Song>) => void;
  onTrackCreated?: (track: Track) => void;
  onTrackUpdated?: (trackId: string, updates: Partial<Track>) => void;
  onTrackDeleted?: (trackId: string) => void;
  onNoteCreated?: (trackId: string, note: Note) => void;
  onNoteDeleted?: (trackId: string, noteId: string) => void;
  onChatMessage?: (message: ChatMessage) => void;
  onContributorAdded?: (contributor: SongContributor) => void;
}

export function useSocket(options: UseSocketOptions) {
  const {
    songId,
    user,
    onPresenceUpdate,
    onSongUpdate,
    onTrackCreated,
    onTrackUpdated,
    onTrackDeleted,
    onNoteCreated,
    onNoteDeleted,
    onChatMessage,
    onContributorAdded,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Store latest callbacks in refs so event listeners always call the current version
  const callbacksRef = useRef({
    onPresenceUpdate,
    onSongUpdate,
    onTrackCreated,
    onTrackUpdated,
    onTrackDeleted,
    onNoteCreated,
    onNoteDeleted,
    onChatMessage,
    onContributorAdded,
  });

  // Update refs with latest callbacks on every render (no useEffect needed)
  callbacksRef.current = {
    onPresenceUpdate,
    onSongUpdate,
    onTrackCreated,
    onTrackUpdated,
    onTrackDeleted,
    onNoteCreated,
    onNoteDeleted,
    onChatMessage,
    onContributorAdded,
  };

  useEffect(() => {
    if (!user || !songId) return;

    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      socket.emit('join-song', { songId, user });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Set up event listeners using refs so they always call the latest callbacks
    socket.on('presence-update', (users) => {
      callbacksRef.current.onPresenceUpdate?.(users);
    });

    socket.on('song-updated', (updates) => {
      callbacksRef.current.onSongUpdate?.(updates);
    });

    socket.on('track-created', (track) => {
      callbacksRef.current.onTrackCreated?.(track);
    });

    socket.on('track-updated', ({ trackId, updates }: { trackId: string; updates: Partial<Track> }) => {
      callbacksRef.current.onTrackUpdated?.(trackId, updates);
    });

    socket.on('track-deleted', (trackId) => {
      callbacksRef.current.onTrackDeleted?.(trackId);
    });

    socket.on('note-created', ({ trackId, note }: { trackId: string; note: Note }) => {
      console.log('[useSocket] Received note-created', { trackId, noteId: note.id });
      callbacksRef.current.onNoteCreated?.(trackId, note);
    });

    socket.on('note-deleted', ({ trackId, noteId }: { trackId: string; noteId: string }) => {
      callbacksRef.current.onNoteDeleted?.(trackId, noteId);
    });

    socket.on('chat-message', (message) => {
      console.log('[useSocket] Received chat-message', message);
      callbacksRef.current.onChatMessage?.(message);
    });

    socket.on('contributor-added', (contributor) => {
      console.log('[useSocket] Received contributor-added', contributor);
      callbacksRef.current.onContributorAdded?.(contributor);
    });

    // Cleanup on unmount
    return () => {
      socket.emit('leave-song', { songId });
      socket.disconnect();
    };
  }, [songId, user?.id]); // Only reconnect if songId or user.id changes

  // Helper functions to emit events
  const emitSongUpdate = (updates: Partial<Song>) => {
    socketRef.current?.emit('song-update', { songId, updates });
    // Local update handled by caller
  };

  const emitTrackCreated = (track: Track) => {
    console.log('[useSocket] Emitting track-created', { songId, trackId: track.id });
    socketRef.current?.emit('track-created', { songId, track });
    // Update locally since server uses socket.to() which excludes sender
    if (onTrackCreated) {
      onTrackCreated(track);
    }
  };

  const emitTrackUpdate = (trackId: string, updates: Partial<Track>) => {
    console.log('[useSocket] Emitting track-update', { songId, trackId });
    socketRef.current?.emit('track-update', { songId, trackId, updates });
    // Update locally since server uses socket.to() which excludes sender
    if (onTrackUpdated) {
      onTrackUpdated(trackId, updates);
    }
  };

  const emitTrackDeleted = (trackId: string) => {
    console.log('[useSocket] Emitting track-deleted', { songId, trackId });
    socketRef.current?.emit('track-deleted', { songId, trackId });
    // Update locally since server uses socket.to() which excludes sender
    if (onTrackDeleted) {
      onTrackDeleted(trackId);
    }
  };

  const emitNoteCreated = (trackId: string, note: Note) => {
    console.log('[useSocket] Emitting note-created', { songId, trackId, noteId: note.id });
    socketRef.current?.emit('note-created', { songId, trackId, note });
    // Update locally since server uses socket.to() which excludes sender
    if (onNoteCreated) {
      onNoteCreated(trackId, note);
    }
  };

  const emitNoteDeleted = (trackId: string, noteId: string) => {
    console.log('[useSocket] Emitting note-deleted', { songId, trackId, noteId });
    socketRef.current?.emit('note-deleted', { songId, trackId, noteId });
    // Update locally since server uses socket.to() which excludes sender
    if (onNoteDeleted) {
      onNoteDeleted(trackId, noteId);
    }
  };

  const emitChatMessage = (message: ChatMessage) => {
    console.log('[useSocket] Emitting chat-message', { songId, messageId: message.id });
    socketRef.current?.emit('chat-message', { songId, message });
    // Don't update locally - let the server broadcast handle it for everyone
  };

  const emitContributorAdded = (contributor: SongContributor) => {
    console.log('[useSocket] Emitting contributor-added', { songId, contributorId: contributor.id });
    socketRef.current?.emit('contributor-added', { songId, contributor });
  };

  return {
    isConnected,
    emitSongUpdate,
    emitTrackCreated,
    emitTrackUpdate,
    emitTrackDeleted,
    emitNoteCreated,
    emitNoteDeleted,
    emitChatMessage,
    emitContributorAdded,
  };
}
