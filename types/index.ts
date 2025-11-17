export interface User {
  id: string;
  name: string;
  avatarIcon: string;
  createdAt: string;
}

export interface Song {
  id: string;
  name: string;
  tempo: number;
  timeSignature: string;
  bars: number;
  createdAt: string;
  updatedAt: string;
  tracks: Track[];
  chatMessages?: ChatMessage[];
}

export interface Track {
  id: string;
  songId: string;
  instrumentType: string;
  volume: number;
  order: number;
  createdAt: string;
  updatedAt: string;
  notes: Note[];
}

export interface Note {
  id: string;
  trackId: string;
  pitch: string | null;
  drumType: string | null;
  duration: NoteDuration;
  startPosition: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  songId: string;
  userId: string;
  message: string;
  createdAt: string;
  user: User;
}

export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';
export type InstrumentType = 'piano' | 'bass' | 'drums';
export type DrumType = 'kick' | 'snare' | 'hihat' | 'tom1' | 'tom2' | 'tom3';

export const NOTE_DURATIONS: NoteDuration[] = ['whole', 'half', 'quarter', 'eighth', 'sixteenth'];
export const INSTRUMENT_TYPES: InstrumentType[] = ['piano', 'bass', 'drums'];
export const DRUM_TYPES: DrumType[] = ['tom3', 'tom2', 'tom1', 'hihat', 'snare', 'kick'];

// Duration to number of 16th notes
export const DURATION_TO_SIXTEENTHS: Record<NoteDuration, number> = {
  whole: 16,
  half: 8,
  quarter: 4,
  eighth: 2,
  sixteenth: 1,
};
