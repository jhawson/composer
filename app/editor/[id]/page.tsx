'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { Song } from '@/types';
import { SongHeader } from '@/components/editor/SongHeader';
import { TrackList } from '@/components/editor/TrackList';
import { ChatPanel } from '@/components/editor/ChatPanel';
import { PlaybackControls } from '@/components/editor/PlaybackControls';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);

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

  const updateSong = (updates: Partial<Song>) => {
    if (song) {
      setSong({ ...song, ...updates });
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
      {/* Header with song metadata controls */}
      <SongHeader song={song} onUpdate={updateSong} />

      {/* Playback controls */}
      <PlaybackControls song={song} />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track editor area */}
        <div className="flex-1 overflow-auto">
          <TrackList song={song} onUpdate={updateSong} />
        </div>

        {/* Chat panel */}
        <ChatPanel songId={song.id} />
      </div>
    </div>
  );
}
