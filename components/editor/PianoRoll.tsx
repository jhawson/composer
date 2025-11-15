'use client';

import { useState, useRef, useEffect } from 'react';
import { Track, Song, Note, NOTE_DURATIONS, NoteDuration, DURATION_TO_SIXTEENTHS } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface PianoRollProps {
  track: Track;
  song: Song;
}

// MIDI notes from C3 to C6
const NOTES = [
  'C6', 'B5', 'A#5', 'A5', 'G#5', 'G5', 'F#5', 'F5', 'E5', 'D#5', 'D5', 'C#5',
  'C5', 'B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4',
  'C4', 'B3', 'A#3', 'A3', 'G#3', 'G3', 'F#3', 'F3', 'E3', 'D#3', 'D3', 'C#3', 'C3'
];

const CELL_WIDTH = 30;
const CELL_HEIGHT = 20;

export function PianoRoll({ track, song }: PianoRollProps) {
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('quarter');
  const canvasRef = useRef<HTMLDivElement>(null);

  // Calculate total width based on bars and time signature
  const beatsPerBar = parseInt(song.timeSignature.split('/')[0]);
  const totalBeats = song.bars * beatsPerBar;
  const totalSixteenths = totalBeats * 4; // 4 sixteenth notes per beat
  const totalWidth = totalSixteenths * CELL_WIDTH;

  const handleCellClick = async (pitch: string, position: number) => {
    // Check if there's already a note at this position and pitch
    const existingNote = track.notes.find(
      (note) => note.pitch === pitch && note.startPosition === position
    );

    if (existingNote) {
      // Delete the note
      try {
        const response = await fetch(`/api/notes/${existingNote.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete note');
        // Note: In a real app, we'd update the parent component
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
            pitch,
            duration: selectedDuration,
            startPosition: position,
          }),
        });
        if (!response.ok) throw new Error('Failed to create note');
        // Note: In a real app, we'd update the parent component
      } catch (error) {
        console.error('Error creating note:', error);
      }
    }
  };

  const isNoteAt = (pitch: string, position: number): Note | null => {
    return track.notes.find(
      (note) => note.pitch === pitch && note.startPosition <= position &&
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

      <div className="border rounded-lg overflow-auto" style={{ maxHeight: '400px', maxWidth: '100%' }}>
        <div ref={canvasRef} className="relative bg-background">
          {/* Piano roll grid */}
          <div className="flex">
            {/* Note labels */}
            <div className="sticky left-0 z-10 bg-muted border-r">
              {NOTES.map((note) => (
                <div
                  key={note}
                  className="flex items-center justify-center text-xs font-mono border-b"
                  style={{ height: CELL_HEIGHT, width: 50 }}
                >
                  {note}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div>
              {NOTES.map((note, noteIndex) => (
                <div key={note} className="flex border-b">
                  {Array.from({ length: totalSixteenths }).map((_, posIndex) => {
                    const existingNote = isNoteAt(note, posIndex);
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
                            : note.includes('#')
                            ? 'bg-muted/30 hover:bg-muted'
                            : 'hover:bg-accent'
                        } ${isBarStart ? 'border-l-2 border-l-foreground' : isBeatStart ? 'border-l border-l-muted-foreground/30' : ''}`}
                        style={{
                          width: CELL_WIDTH,
                          height: CELL_HEIGHT,
                        }}
                        onClick={() => handleCellClick(note, posIndex)}
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
        Click on the grid to add or remove notes. Darker columns indicate beat boundaries.
      </p>
    </div>
  );
}
