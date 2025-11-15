'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Song } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';

interface SongHeaderProps {
  song: Song;
  onUpdate: (updates: Partial<Song>) => void;
}

export function SongHeader({ song, onUpdate }: SongHeaderProps) {
  const router = useRouter();
  const [name, setName] = useState(song.name);
  const [tempo, setTempo] = useState(song.tempo.toString());
  const [timeSignature, setTimeSignature] = useState(song.timeSignature);
  const [bars, setBars] = useState(song.bars.toString());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/songs/${song.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tempo: parseInt(tempo),
          timeSignature,
          bars: parseInt(bars),
        }),
      });

      if (!response.ok) throw new Error('Failed to update song');

      const updated = await response.json();
      onUpdate(updated);
    } catch (error) {
      console.error('Error updating song:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    name !== song.name ||
    tempo !== song.tempo.toString() ||
    timeSignature !== song.timeSignature ||
    bars !== song.bars.toString();

  return (
    <div className="border-b bg-card">
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
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
                onChange={(e) => setName(e.target.value)}
                className="w-48"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="tempo" className="text-xs">Tempo (BPM)</Label>
              <Input
                id="tempo"
                type="number"
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                className="w-24"
                min="40"
                max="240"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="timeSignature" className="text-xs">Time Signature</Label>
              <Select value={timeSignature} onValueChange={setTimeSignature}>
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
                onChange={(e) => setBars(e.target.value)}
                className="w-20"
                min="1"
                max="32"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
