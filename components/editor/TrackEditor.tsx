'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Song, Track, INSTRUMENT_TYPES, DRUM_KITS } from '@/types';
import { ChevronDown, ChevronUp, Trash2, Volume2 } from 'lucide-react';
import { PianoRoll } from './PianoRoll';
import { DrumEditor } from './DrumEditor';

interface TrackEditorProps {
  track: Track;
  song: Song;
  onUpdate: (updates: Partial<Track>) => void;
  onDelete: () => void;
  socket: any;
}

export function TrackEditor({ track, song, onUpdate, onDelete, socket }: TrackEditorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleInstrumentChange = async (instrumentType: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/tracks/${track.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instrumentType }),
      });

      if (!response.ok) throw new Error('Failed to update track');

      const updated = await response.json();
      onUpdate(updated);
    } catch (error) {
      console.error('Error updating track:', error);
      alert('Failed to update instrument');
    } finally {
      setUpdating(false);
    }
  };

  const handleVolumeChange = async (volume: number[]) => {
    const newVolume = volume[0];
    onUpdate({ volume: newVolume });

    // Debounced save to API
    setUpdating(true);
    try {
      const response = await fetch(`/api/tracks/${track.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: newVolume }),
      });

      if (!response.ok) throw new Error('Failed to update volume');
    } catch (error) {
      console.error('Error updating volume:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDrumKitChange = async (drumKit: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/tracks/${track.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drumKit }),
      });

      if (!response.ok) throw new Error('Failed to update drum kit');

      const updated = await response.json();
      onUpdate(updated);
      socket.emitTrackUpdate(track.id, { drumKit });
    } catch (error) {
      console.error('Error updating drum kit:', error);
      alert('Failed to update drum kit');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-3 bg-muted/50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>

          <Select
            value={track.instrumentType}
            onValueChange={handleInstrumentChange}
            disabled={updating}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INSTRUMENT_TYPES.map((instrument) => (
                <SelectItem key={instrument} value={instrument}>
                  {instrument.charAt(0).toUpperCase() + instrument.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {track.instrumentType === 'drums' && (
            <Select
              value={track.drumKit || 'breakbeat13'}
              onValueChange={handleDrumKitChange}
              disabled={updating}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select drum kit" />
              </SelectTrigger>
              <SelectContent>
                {DRUM_KITS.map((kit) => (
                  <SelectItem key={kit} value={kit}>
                    {kit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[track.volume]}
              onValueChange={handleVolumeChange}
              min={0}
              max={1}
              step={0.01}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-12 text-right">
              {Math.round(track.volume * 100)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 bg-background">
          {track.instrumentType === 'drums' ? (
            <DrumEditor track={track} song={song} socket={socket} drumKit={track.drumKit || 'breakbeat13'} />
          ) : (
            <PianoRoll track={track} song={song} socket={socket} />
          )}
        </div>
      )}
    </Card>
  );
}
