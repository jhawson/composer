'use client';

import { useState, useRef, useEffect } from 'react';
import { Track, Song, Note, NOTE_DURATIONS, NoteDuration, DURATION_TO_SIXTEENTHS } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { audioEngine } from '@/lib/audio-engine';

interface PianoRollProps {
  track: Track;
  song: Song;
  socket: any;
}

// MIDI notes from A0 to C7
const NOTES = [
  'C7', 'B6', 'A#6', 'A6', 'G#6', 'G6', 'F#6', 'F6', 'E6', 'D#6', 'D6', 'C#6',
  'C6', 'B5', 'A#5', 'A5', 'G#5', 'G5', 'F#5', 'F5', 'E5', 'D#5', 'D5', 'C#5',
  'C5', 'B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4',
  'C4', 'B3', 'A#3', 'A3', 'G#3', 'G3', 'F#3', 'F3', 'E3', 'D#3', 'D3', 'C#3',
  'C3', 'B2', 'A#2', 'A2', 'G#2', 'G2', 'F#2', 'F2', 'E2', 'D#2', 'D2', 'C#2',
  'C2', 'B1', 'A#1', 'A1', 'G#1', 'G1', 'F#1', 'F1', 'E1', 'D#1', 'D1', 'C#1',
  'C1', 'B0', 'A#0', 'A0'
];

const CELL_WIDTH = 30;
const CELL_HEIGHT = 20;

export function PianoRoll({ track, song, socket }: PianoRollProps) {
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
        socket.emitNoteDeleted(track.id, existingNote.id);
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    } else {
      // Play the note immediately
      audioEngine.playNote(track.instrumentType, pitch, selectedDuration);

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
        const newNote = await response.json();
        socket.emitNoteCreated(track.id, newNote);
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
            <div className="sticky left-0 z-10 bg-muted border-r" style={{ display: 'flex', flexDirection: 'column' }}>
              {NOTES.map((note, noteIndex) => (
                <div
                  key={note}
                  style={{
                    height: `${CELL_HEIGHT}px`,
                    width: '100px',
                    borderBottom: noteIndex < NOTES.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box'
                  }}
                >
                  {note}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div>
              {NOTES.map((note, noteIndex) => (
                <div key={note} className="flex">
                  {Array.from({ length: totalSixteenths }).map((_, posIndex) => {
                    const existingNote = isNoteAt(note, posIndex);
                    const isStart = existingNote && existingNote.startPosition === posIndex;
                    const beatIndex = Math.floor(posIndex / 4);
                    const isBarStart = beatIndex % beatsPerBar === 0 && posIndex % 4 === 0;
                    const isBeatStart = posIndex % 4 === 0;

                    return (
                      <div
                        key={posIndex}
                        className={`border-r ${noteIndex < NOTES.length - 1 ? 'border-b' : ''} cursor-pointer transition-colors ${
                          existingNote
                            ? isStart
                              ? 'bg-primary hover:bg-primary/80'
                              : 'bg-primary/70'
                            : note.includes('#')
                            ? 'bg-muted/30 hover:bg-muted'
                            : 'hover:bg-accent'
                        } ${isBarStart ? 'border-l-2 border-l-foreground' : isBeatStart ? 'border-l border-l-muted-foreground/30' : ''}`}
                        style={{
                          width: `${CELL_WIDTH}px`,
                          height: `${CELL_HEIGHT}px`,
                          boxSizing: 'border-box'
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
