import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Song, Track, Note, ChatMessage } from '@/types';

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
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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

    // Set up event listeners
    if (onPresenceUpdate) {
      socket.on('presence-update', onPresenceUpdate);
    }

    if (onSongUpdate) {
      socket.on('song-updated', onSongUpdate);
    }

    if (onTrackCreated) {
      socket.on('track-created', onTrackCreated);
    }

    if (onTrackUpdated) {
      socket.on('track-updated', ({ trackId, updates }: { trackId: string; updates: Partial<Track> }) => {
        onTrackUpdated(trackId, updates);
      });
    }

    if (onTrackDeleted) {
      socket.on('track-deleted', onTrackDeleted);
    }

    if (onNoteCreated) {
      socket.on('note-created', ({ trackId, note }: { trackId: string; note: Note }) => {
        onNoteCreated(trackId, note);
      });
    }

    if (onNoteDeleted) {
      socket.on('note-deleted', ({ trackId, noteId }: { trackId: string; noteId: string }) => {
        onNoteDeleted(trackId, noteId);
      });
    }

    if (onChatMessage) {
      socket.on('chat-message', onChatMessage);
    }

    // Cleanup on unmount
    return () => {
      socket.emit('leave-song', { songId });
      socket.disconnect();
    };
  }, [songId, user?.id]); // Re-run if songId or user changes

  // Helper functions to emit events
  const emitSongUpdate = (updates: Partial<Song>) => {
    socketRef.current?.emit('song-update', { songId, updates });
  };

  const emitTrackCreated = (track: Track) => {
    socketRef.current?.emit('track-created', { songId, track });
  };

  const emitTrackUpdate = (trackId: string, updates: Partial<Track>) => {
    socketRef.current?.emit('track-update', { songId, trackId, updates });
  };

  const emitTrackDeleted = (trackId: string) => {
    socketRef.current?.emit('track-deleted', { songId, trackId });
  };

  const emitNoteCreated = (trackId: string, note: Note) => {
    socketRef.current?.emit('note-created', { songId, trackId, note });
  };

  const emitNoteDeleted = (trackId: string, noteId: string) => {
    socketRef.current?.emit('note-deleted', { songId, trackId, noteId });
  };

  const emitChatMessage = (message: ChatMessage) => {
    socketRef.current?.emit('chat-message', { songId, message });
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
  };
}
