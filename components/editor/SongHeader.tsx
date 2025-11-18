'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Song } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { useUserStore } from '@/lib/store';
import { addContributor } from '@/lib/contributors';

interface SongHeaderProps {
  song: Song;
  onUpdate: (updates: Partial<Song>) => void;
  onContributorAdded?: (contributor: any) => void;
}

export function SongHeader({ song, onUpdate, onContributorAdded }: SongHeaderProps) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [name, setName] = useState(song.name);
  const [tempo, setTempo] = useState(song.tempo.toString());
  const [timeSignature, setTimeSignature] = useState(song.timeSignature);
  const [bars, setBars] = useState(song.bars.toString());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state with prop changes (from WebSocket updates)
  useEffect(() => {
    setName(song.name);
    setTempo(song.tempo.toString());
    setTimeSignature(song.timeSignature);
    setBars(song.bars.toString());
  }, [song.name, song.tempo, song.timeSignature, song.bars]);

  // Auto-save function with debounce
  const autoSave = (updates: Partial<Song>) => {
    // Broadcast changes immediately for real-time feel
    onUpdate(updates);

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save for 500ms
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/songs/${song.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) throw new Error('Failed to update song');

        // Add user as contributor
        if (user && onContributorAdded) {
          const contributor = await addContributor(song.id, user.id);
          if (contributor) {
            onContributorAdded(contributor);
          }
        }
      } catch (error) {
        console.error('Error auto-saving song:', error);
      }
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleNameChange = (newName: string) => {
    setName(newName);
    autoSave({ name: newName });
  };

  const handleTempoChange = (newTempo: string) => {
    setTempo(newTempo);
    const tempoNum = parseInt(newTempo);
    if (!isNaN(tempoNum) && tempoNum >= 40 && tempoNum <= 240) {
      autoSave({ tempo: tempoNum });
    }
  };

  const handleTimeSignatureChange = (newTimeSignature: string) => {
    setTimeSignature(newTimeSignature);
    autoSave({ timeSignature: newTimeSignature });
  };

  const handleBarsChange = (newBars: string) => {
    setBars(newBars);
    const barsNum = parseInt(newBars);
    if (!isNaN(barsNum) && barsNum >= 1 && barsNum <= 32) {
      autoSave({ bars: barsNum });
    }
  };

  return (
    <div className="border-b bg-card">
      <div className="p-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/songs')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <Label htmlFor="songName" className="text-xs">Song Name</Label>
            <Input
              id="songName"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-48"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="tempo" className="text-xs">Tempo (BPM)</Label>
            <Input
              id="tempo"
              type="number"
              value={tempo}
              onChange={(e) => handleTempoChange(e.target.value)}
              className="w-24"
              min="40"
              max="240"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="timeSignature" className="text-xs">Time Signature</Label>
            <Select value={timeSignature} onValueChange={handleTimeSignatureChange}>
              <SelectTrigger id="timeSignature" className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2/4">2/4</SelectItem>
                <SelectItem value="3/4">3/4</SelectItem>
                <SelectItem value="4/4">4/4</SelectItem>
                <SelectItem value="5/4">5/4</SelectItem>
                <SelectItem value="6/8">6/8</SelectItem>
                <SelectItem value="7/8">7/8</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="bars" className="text-xs">Bars</Label>
            <Input
              id="bars"
              type="number"
              value={bars}
              onChange={(e) => handleBarsChange(e.target.value)}
              className="w-20"
              min="1"
              max="32"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
