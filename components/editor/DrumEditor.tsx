'use client';

import { useState, useRef } from 'react';
import { Track, Song, Note, NOTE_DURATIONS, NoteDuration, DURATION_TO_SIXTEENTHS, DRUM_TYPES, DrumType } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface DrumEditorProps {
  track: Track;
  song: Song;
  socket: any;
}

const CELL_WIDTH = 30;
const CELL_HEIGHT = 40;

const DRUM_LABELS: Record<DrumType, string> = {
  bass: 'Bass Drum',
  snare: 'Snare',
  hihat: 'Hi-Hat',
  ride: 'Ride Cymbal',
};

export function DrumEditor({ track, song, socket }: DrumEditorProps) {
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('sixteenth');
  const canvasRef = useRef<HTMLDivElement>(null);

  // Calculate total width based on bars and time signature
  const beatsPerBar = parseInt(song.timeSignature.split('/')[0]);
  const totalBeats = song.bars * beatsPerBar;
  const totalSixteenths = totalBeats * 4;

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
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    } else {
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
            <div className="sticky left-0 z-10 bg-muted border-r">
              {DRUM_TYPES.map((drumType) => (
                <div
                  key={drumType}
                  className="flex items-center justify-center text-xs font-medium border-b px-3"
                  style={{ height: CELL_HEIGHT, width: 100 }}
                >
                  {DRUM_LABELS[drumType]}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div>
              {DRUM_TYPES.map((drumType) => (
                <div key={drumType} className="flex border-b">
                  {Array.from({ length: totalSixteenths }).map((_, posIndex) => {
                    const existingNote = isNoteAt(drumType, posIndex);
                    const isStart = existingNote && existingNote.startPosition === posIndex;
                    const beatIndex = Math.floor(posIndex / 4);
                    const isBarStart = beatIndex % beatsPerBar === 0 && posIndex % 4 === 0;
                    const isBeatStart = posIndex % 4 === 0;

                    return (
                      <div
                        key={posIndex}
                        className={`border-r cursor-pointer transition-colors ${
                          existingNote
                            ? isStart
                              ? 'bg-primary hover:bg-primary/80'
                              : 'bg-primary/70'
                            : 'hover:bg-accent'
                        } ${isBarStart ? 'border-l-2 border-l-foreground' : isBeatStart ? 'border-l border-l-muted-foreground/30' : ''}`}
                        style={{
                          width: CELL_WIDTH,
                          height: CELL_HEIGHT,
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
