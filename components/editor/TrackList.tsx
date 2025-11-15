'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Song, Track, INSTRUMENT_TYPES } from '@/types';
import { TrackEditor } from './TrackEditor';
import { Plus } from 'lucide-react';

interface TrackListProps {
  song: Song;
  onUpdate: (updates: Partial<Song>) => void;
}

export function TrackList({ song, onUpdate }: TrackListProps) {
  const [creating, setCreating] = useState(false);

  const handleAddTrack = async (instrumentType: string) => {
    setCreating(true);
    try {
      const response = await fetch('/api/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId: song.id,
          instrumentType,
        }),
      });

      if (!response.ok) throw new Error('Failed to create track');

      const newTrack = await response.json();
      onUpdate({
        tracks: [...song.tracks, newTrack],
      });
    } catch (error) {
      console.error('Error creating track:', error);
      alert('Failed to add track');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateTrack = (trackId: string, updates: Partial<Track>) => {
    const updatedTracks = song.tracks.map((track) =>
      track.id === trackId ? { ...track, ...updates } : track
    );
    onUpdate({ tracks: updatedTracks });
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm('Are you sure you want to delete this track?')) return;

    try {
      const response = await fetch(`/api/tracks/${trackId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete track');

      onUpdate({
        tracks: song.tracks.filter((track) => track.id !== trackId),
      });
    } catch (error) {
      console.error('Error deleting track:', error);
      alert('Failed to delete track');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {song.tracks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">No tracks yet. Add your first instrument track to start composing!</p>
        </div>
      )}

      {song.tracks.map((track) => (
        <TrackEditor
          key={track.id}
          track={track}
          song={song}
          onUpdate={(updates) => handleUpdateTrack(track.id, updates)}
          onDelete={() => handleDeleteTrack(track.id)}
        />
      ))}

      <div className="flex gap-2 pt-4 border-t">
        {INSTRUMENT_TYPES.map((instrument) => (
          <Button
            key={instrument}
            variant="outline"
            onClick={() => handleAddTrack(instrument)}
            disabled={creating}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {instrument.charAt(0).toUpperCase() + instrument.slice(1)} Track
          </Button>
        ))}
      </div>
    </div>
  );
}
