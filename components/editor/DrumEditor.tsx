'use client';

import { useState, useRef } from 'react';
import { Track, Song, Note, NOTE_DURATIONS, NoteDuration, DURATION_TO_SIXTEENTHS, DRUM_TYPES, DrumType } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { audioEngine } from '@/lib/audio-engine';
import { useUserStore } from '@/lib/store';
import { addContributor } from '@/lib/contributors';

interface DrumEditorProps {
  track: Track;
  song: Song;
  socket: any;
  drumKit: string;
  onContributorAdded?: (contributor: any) => void;
}

const CELL_WIDTH = 30;
const CELL_HEIGHT = 40;

const DRUM_LABELS: Record<DrumType, string> = {
  kick: 'Kick',
  snare: 'Snare',
  hihat: 'Hi-Hat',
  tom1: 'Tom 1',
  tom2: 'Tom 2',
  tom3: 'Tom 3',
};

export function DrumEditor({ track, song, socket, drumKit, onContributorAdded }: DrumEditorProps) {
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('sixteenth');
  const canvasRef = useRef<HTMLDivElement>(null);
  const user = useUserStore((state) => state.user);

  // Calculate total width based on bars and time signature
  const beatsPerBar = parseInt(song.timeSignature.split('/')[0]);
  const totalBeats = song.bars * beatsPerBar;
  const totalSixteenths = totalBeats * 4;

  const drumTypeToNote = (drumType: string): string => {
    const mapping: Record<string, string> = {
      kick: 'C1',
      snare: 'D1',
      hihat: 'F1',
      tom1: 'G1',
      tom2: 'A1',
      tom3: 'B1',
    };
    return mapping[drumType] || 'C1';
  };

  const handleCellClick = async (drumType: DrumType, position: number) => {
    // Check if there's already a note at this position and drum type
    const existingNote = track.notes.find(
      (note) => note.drumType === drumType && note.startPosition === position
    );

    if (existingNote) {
      // Delete the note
      try {
        const response = await fetch(`/api/notes/${existingNote.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete note');
        socket.emitNoteDeleted(track.id, existingNote.id);

        // Add user as contributor
        if (user && onContributorAdded) {
          const contributor = await addContributor(song.id, user.id);
          if (contributor) {
            onContributorAdded(contributor);
          }
        }
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    } else {
      // Play the drum sound immediately
      const drumNote = drumTypeToNote(drumType);
      audioEngine.playNote('drums', drumNote, selectedDuration, drumKit);

      // Add a new note
      try {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackId: track.id,
            drumType,
            duration: selectedDuration,
            startPosition: position,
          }),
        });
        if (!response.ok) throw new Error('Failed to create note');
        const newNote = await response.json();
        socket.emitNoteCreated(track.id, newNote);

        // Add user as contributor
        if (user && onContributorAdded) {
          const contributor = await addContributor(song.id, user.id);
          if (contributor) {
            onContributorAdded(contributor);
          }
        }
      } catch (error) {
        console.error('Error creating note:', error);
      }
    }
  };

  const isNoteAt = (drumType: DrumType, position: number): Note | null => {
    return track.notes.find(
      (note) => note.drumType === drumType && note.startPosition <= position &&
        position < note.startPosition + DURATION_TO_SIXTEENTHS[note.duration as NoteDuration]
    ) || null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Label className="text-sm">Note Duration:</Label>
        <Select value={selectedDuration} onValueChange={(v) => setSelectedDuration(v as NoteDuration)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTE_DURATIONS.map((duration) => (
              <SelectItem key={duration} value={duration}>
                {duration.charAt(0).toUpperCase() + duration.slice(1)} Note
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-auto" style={{ maxHeight: '300px', maxWidth: '100%' }}>
        <div ref={canvasRef} className="relative bg-background">
          {/* Drum editor grid */}
          <div className="flex">
            {/* Drum type labels */}
            <div className="sticky left-0 z-10 bg-muted border-r" style={{ display: 'flex', flexDirection: 'column' }}>
              {DRUM_TYPES.map((drumType, drumIndex) => (
                <div
                  key={drumType}
                  style={{
                    height: `${CELL_HEIGHT}px`,
                    width: '100px',
                    borderBottom: drumIndex < DRUM_TYPES.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    paddingLeft: '0.75rem',
                    paddingRight: '0.75rem',
                    boxSizing: 'border-box'
                  }}
                >
                  {DRUM_LABELS[drumType]}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div>
              {DRUM_TYPES.map((drumType, drumIndex) => (
                <div key={drumType} className="flex">
                  {Array.from({ length: totalSixteenths }).map((_, posIndex) => {
                    const existingNote = isNoteAt(drumType, posIndex);
                    const isStart = existingNote && existingNote.startPosition === posIndex;
                    const beatIndex = Math.floor(posIndex / 4);
                    const isBarStart = beatIndex % beatsPerBar === 0 && posIndex % 4 === 0;
                    const isBeatStart = posIndex % 4 === 0;

                    return (
                      <div
                        key={posIndex}
                        className={`border-r ${drumIndex < DRUM_TYPES.length - 1 ? 'border-b' : ''} cursor-pointer transition-colors ${
                          existingNote
                            ? isStart
                              ? 'bg-primary hover:bg-primary/80'
                              : 'bg-primary/70'
                            : 'hover:bg-accent'
                        } ${isBarStart ? 'border-l-2 border-l-foreground' : isBeatStart ? 'border-l border-l-muted-foreground/30' : ''}`}
                        style={{
                          width: `${CELL_WIDTH}px`,
                          height: `${CELL_HEIGHT}px`,
                          boxSizing: 'border-box'
                        }}
                        onClick={() => handleCellClick(drumType, posIndex)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Click on the grid to add or remove drum hits. Darker columns indicate beat boundaries.
      </p>
    </div>
  );
}
