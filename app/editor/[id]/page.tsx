'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { Song, User, Track, Note, ChatMessage } from '@/types';
import { SongHeader } from '@/components/editor/SongHeader';
import { TrackList } from '@/components/editor/TrackList';
import { ChatPanel } from '@/components/editor/ChatPanel';
import { PlaybackControls } from '@/components/editor/PlaybackControls';
import { PresenceIndicator } from '@/components/editor/PresenceIndicator';
import { Contributors } from '@/components/editor/Contributors';
import { useSocket } from '@/lib/useSocket';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [presentUsers, setPresentUsers] = useState<User[]>([]);

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      const storedUser = localStorage.getItem('composer-user');
      if (storedUser) {
        useUserStore.getState().setUser(JSON.parse(storedUser));
      } else {
        router.push('/');
        return;
      }
    }

    fetchSong();
  }, [user, router, params.id]);

  const fetchSong = async () => {
    try {
      const response = await fetch(`/api/songs/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch song');
      const data = await response.json();
      setSong(data);
    } catch (error) {
      console.error('Error fetching song:', error);
      alert('Failed to load song');
      router.push('/songs');
    } finally {
      setLoading(false);
    }
  };

  // WebSocket integration for real-time collaboration
  const socket = useSocket({
    songId: params.id as string,
    user,
    onPresenceUpdate: (users) => setPresentUsers(users),
    onSongUpdate: (updates) => {
      if (song) {
        setSong({ ...song, ...updates });
      }
    },
    onTrackCreated: (track) => {
      if (song) {
        setSong({ ...song, tracks: [...song.tracks, track] });
      }
    },
    onTrackUpdated: (trackId, updates) => {
      if (song) {
        const updatedTracks = song.tracks.map((t) =>
          t.id === trackId ? { ...t, ...updates } : t
        );
        setSong({ ...song, tracks: updatedTracks });
      }
    },
    onTrackDeleted: (trackId) => {
      if (song) {
        setSong({ ...song, tracks: song.tracks.filter((t) => t.id !== trackId) });
      }
    },
    onNoteCreated: (trackId, note) => {
      if (song) {
        const updatedTracks = song.tracks.map((t) =>
          t.id === trackId ? { ...t, notes: [...t.notes, note] } : t
        );
        setSong({ ...song, tracks: updatedTracks });
      }
    },
    onNoteDeleted: (trackId, noteId) => {
      if (song) {
        const updatedTracks = song.tracks.map((t) =>
          t.id === trackId ? { ...t, notes: t.notes.filter((n) => n.id !== noteId) } : t
        );
        setSong({ ...song, tracks: updatedTracks });
      }
    },
    onChatMessage: (message) => {
      if (song) {
        setSong({ ...song, chatMessages: [...(song.chatMessages || []), message] });
      }
    },
    onContributorAdded: (contributor) => {
      if (song && !song.contributors?.find(c => c.userId === contributor.userId)) {
        setSong({ ...song, contributors: [...(song.contributors || []), contributor] });
      }
    },
  });

  const updateSong = (updates: Partial<Song>) => {
    if (song) {
      setSong({ ...song, ...updates });
      socket.emitSongUpdate(updates);
    }
  };

  const handleContributorAdded = (contributor: any) => {
    if (song && !song.contributors?.find(c => c.userId === contributor.userId)) {
      setSong({
        ...song,
        contributors: [...(song.contributors || []), contributor],
      });
      socket.emitContributorAdded(contributor);
    }
  };

  if (loading || !song) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading song...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header with song metadata controls and presence */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between px-4 py-2">
          <SongHeader song={song} onUpdate={updateSong} onContributorAdded={handleContributorAdded} />
          <PresenceIndicator users={presentUsers} />
        </div>
      </div>

      {/* Playback controls */}
      <PlaybackControls song={song} />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track editor area */}
        <div className="flex-1 overflow-auto">
          <TrackList song={song} onUpdate={updateSong} socket={socket} />
        </div>

        {/* Chat panel */}
        <ChatPanel songId={song.id} socket={socket} messages={song.chatMessages || []} />
      </div>

      {/* Contributors list at the bottom */}
      <Contributors contributors={song.contributors || []} />
    </div>
  );
}
