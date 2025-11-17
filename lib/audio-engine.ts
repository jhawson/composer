import * as Tone from 'tone';
import { Song, Track, Note, NoteDuration, DURATION_TO_SIXTEENTHS } from '@/types';

export class AudioEngine {
  private static instance: AudioEngine;
  private players: Map<string, Tone.PolySynth | Tone.Sampler> = new Map();
  private drumSampler: Tone.Sampler | null = null;
  private drumSamplerLoaded = false;
  private drumSamplerLoadPromise: Promise<void> | null = null;
  private pianoSampler: Tone.Sampler | null = null;
  private pianoSamplerLoaded = false;
  private pianoSamplerLoadPromise: Promise<void> | null = null;
  private isPlaying = false;
  private currentPart: Tone.Part | null = null;
  private loop = false;
  private onStopCallback: (() => void) | null = null;

  private constructor() {}

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  async initialize() {
    await Tone.start();
    console.log('Audio engine initialized');
    // Preload piano and drum samples
    await Promise.all([
      this.loadPianoSampler(),
      this.loadDrumSampler()
    ]);
  }

  private async loadDrumSampler(): Promise<void> {
    if (this.drumSamplerLoaded) {
      return Promise.resolve();
    }

    if (this.drumSamplerLoadPromise) {
      return this.drumSamplerLoadPromise;
    }

    console.log('Loading drum samples from CDN...');

    this.drumSamplerLoadPromise = new Promise<void>((resolve, reject) => {
      this.drumSampler = new Tone.Sampler({
        urls: {
          C1: 'kick.mp3',
          D1: 'snare.mp3',
          F1: 'hihat.mp3',
          G1: 'tom1.mp3',
          A1: 'tom2.mp3',
          B1: 'tom3.mp3'
        },
        baseUrl: 'https://tonejs.github.io/audio/drum-samples/breakbeat13/',
        onload: () => {
          console.log('Drum samples loaded successfully');
          this.drumSamplerLoaded = true;
          this.players.set('drums', this.drumSampler!);
          resolve();
        },
        onerror: (err) => {
          console.error('Failed to load drum samples:', err);
          reject(err);
        }
      }).toDestination();
    });

    return this.drumSamplerLoadPromise;
  }

  private async loadPianoSampler(): Promise<void> {
    if (this.pianoSamplerLoaded) {
      return Promise.resolve();
    }

    if (this.pianoSamplerLoadPromise) {
      return this.pianoSamplerLoadPromise;
    }

    console.log('Loading piano samples from CDN...');

    this.pianoSamplerLoadPromise = new Promise<void>((resolve, reject) => {
      this.pianoSampler = new Tone.Sampler({
        urls: {
          A0: 'A0.mp3',
          C1: 'C1.mp3',
          'D#1': 'Ds1.mp3',
          'F#1': 'Fs1.mp3',
          A1: 'A1.mp3',
          C2: 'C2.mp3',
          'D#2': 'Ds2.mp3',
          'F#2': 'Fs2.mp3',
          A2: 'A2.mp3',
          C3: 'C3.mp3',
          'D#3': 'Ds3.mp3',
          'F#3': 'Fs3.mp3',
          A3: 'A3.mp3',
          C4: 'C4.mp3',
          'D#4': 'Ds4.mp3',
          'F#4': 'Fs4.mp3',
          A4: 'A4.mp3',
          C5: 'C5.mp3',
          'D#5': 'Ds5.mp3',
          'F#5': 'Fs5.mp3',
          A5: 'A5.mp3',
          C6: 'C6.mp3',
          'D#6': 'Ds6.mp3',
          'F#6': 'Fs6.mp3',
          A6: 'A6.mp3',
          C7: 'C7.mp3',
          'D#7': 'Ds7.mp3',
          'F#7': 'Fs7.mp3',
          A7: 'A7.mp3',
          C8: 'C8.mp3'
        },
        baseUrl: 'https://tonejs.github.io/audio/salamander/',
        release: 1,
        onload: () => {
          console.log('Piano samples loaded successfully');
          this.pianoSamplerLoaded = true;
          this.players.set('piano', this.pianoSampler!);
          resolve();
        },
        onerror: (err) => {
          console.error('Failed to load piano samples:', err);
          reject(err);
        }
      }).toDestination();
    });

    return this.pianoSamplerLoadPromise;
  }

  private getOrCreateInstrument(instrumentType: string): Tone.PolySynth | Tone.Sampler {
    if (this.players.has(instrumentType)) {
      return this.players.get(instrumentType)!;
    }

    let instrument: Tone.PolySynth | Tone.Sampler;

    if (instrumentType === 'drums') {
      // Return existing drum sampler
      if (this.drumSampler) {
        instrument = this.drumSampler;
      } else {
        throw new Error('Drum sampler not initialized. Call loadDrumSampler() first.');
      }
    } else if (instrumentType === 'piano') {
      // Return existing piano sampler
      if (this.pianoSampler) {
        instrument = this.pianoSampler;
      } else {
        throw new Error('Piano sampler not initialized. Call loadPianoSampler() first.');
      }
    } else if (instrumentType === 'bass') {
      // Bass synth (keep synthesized for now)
      instrument = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.01,
          decay: 0.3,
          sustain: 0.4,
          release: 0.8,
        },
      }).toDestination();
    } else {
      // Default to piano sampler for unknown instrument types
      if (this.pianoSampler) {
        instrument = this.pianoSampler;
      } else {
        // Fallback to synth if piano not loaded
        instrument = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.005,
            decay: 0.2,
            sustain: 0.3,
            release: 1,
          },
        }).toDestination();
      }
    }

    this.players.set(instrumentType, instrument);
    return instrument;
  }

  private drumTypeToNote(drumType: string): string {
    const mapping: Record<string, string> = {
      kick: 'C1',
      snare: 'D1',
      hihat: 'F1',
      tom1: 'G1',
      tom2: 'A1',
      tom3: 'B1',
    };
    return mapping[drumType] || 'C1';
  }

  private durationToSeconds(duration: NoteDuration, tempo: number): number {
    const sixteenths = DURATION_TO_SIXTEENTHS[duration];
    const quarterNoteSeconds = 60 / tempo;
    const sixteenthNoteSeconds = quarterNoteSeconds / 4;
    return sixteenths * sixteenthNoteSeconds;
  }

  private positionToSeconds(position: number, tempo: number): number {
    const quarterNoteSeconds = 60 / tempo;
    const sixteenthNoteSeconds = quarterNoteSeconds / 4;
    return position * sixteenthNoteSeconds;
  }

  async play(song: Song, soloTrackId?: string) {
    await this.initialize();
    this.stop();

    const tracksToPlay = soloTrackId
      ? song.tracks.filter((t) => t.id === soloTrackId)
      : song.tracks;

    if (tracksToPlay.length === 0) {
      console.warn('No tracks to play');
      return;
    }

    // Set tempo
    Tone.getTransport().bpm.value = song.tempo;

    // Calculate song duration
    const beatsPerBar = parseInt(song.timeSignature.split('/')[0]);
    const totalBeats = song.bars * beatsPerBar;
    const totalSixteenths = totalBeats * 4;
    const songDuration = this.positionToSeconds(totalSixteenths, song.tempo);

    // Create events for all notes
    const events: Array<{
      time: number;
      note: string;
      duration: number;
      instrument: Tone.PolySynth | Tone.Sampler;
      volume: number;
    }> = [];

    for (const track of tracksToPlay) {
      const instrument = this.getOrCreateInstrument(track.instrumentType);
      console.log(`Track ${track.instrumentType}: ${track.notes.length} notes`);

      for (const note of track.notes) {
        const noteTime = this.positionToSeconds(note.startPosition, song.tempo);
        const noteDuration = this.durationToSeconds(note.duration as NoteDuration, song.tempo);

        let pitch: string;
        if (note.drumType) {
          pitch = this.drumTypeToNote(note.drumType);
          console.log(`Drum note: ${note.drumType} -> ${pitch} at ${noteTime}s`);
        } else if (note.pitch) {
          pitch = note.pitch;
        } else {
          continue;
        }

        events.push({
          time: noteTime,
          note: pitch,
          duration: noteDuration,
          instrument,
          volume: track.volume,
        });
      }
    }

    console.log(`Total events scheduled: ${events.length}`);

    // Create a Tone.Part to schedule all events
    type EventType = {
      time: number;
      note: string;
      duration: number;
      instrument: Tone.PolySynth | Tone.Sampler;
      volume: number;
    };

    this.currentPart = new Tone.Part((time, event: EventType) => {
      event.instrument.volume.value = Tone.gainToDb(event.volume);
      event.instrument.triggerAttackRelease(event.note, event.duration, time);
    }, events as any);

    this.currentPart.loop = this.loop;
    this.currentPart.loopEnd = songDuration;

    this.currentPart.start(0);
    Tone.getTransport().start();
    this.isPlaying = true;

    // Auto-stop if not looping
    if (!this.loop) {
      setTimeout(() => {
        if (this.isPlaying) {
          this.stop();
        }
      }, songDuration * 1000 + 100);
    }
  }

  pause() {
    if (this.isPlaying) {
      Tone.getTransport().pause();
      this.isPlaying = false;
    }
  }

  resume() {
    if (!this.isPlaying) {
      Tone.getTransport().start();
      this.isPlaying = true;
    }
  }

  stop() {
    if (this.currentPart) {
      this.currentPart.stop();
      this.currentPart.dispose();
      this.currentPart = null;
    }
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    this.isPlaying = false;

    // Notify callback that playback stopped
    if (this.onStopCallback) {
      this.onStopCallback();
    }
  }

  setOnStopCallback(callback: (() => void) | null) {
    this.onStopCallback = callback;
  }

  setLoop(enabled: boolean) {
    this.loop = enabled;
    if (this.currentPart) {
      this.currentPart.loop = enabled;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // Play a single note immediately (for preview when clicking)
  async playNote(instrumentType: string, pitch: string, duration: NoteDuration = 'quarter') {
    await this.initialize();

    // Ensure samples are loaded for sampled instruments
    if (instrumentType === 'drums' && !this.drumSamplerLoaded) {
      console.log('Waiting for drum samples to load...');
      await this.loadDrumSampler();
    }

    if (instrumentType === 'piano' && !this.pianoSamplerLoaded) {
      console.log('Waiting for piano samples to load...');
      await this.loadPianoSampler();
    }

    const instrument = this.getOrCreateInstrument(instrumentType);
    const durationSeconds = this.durationToSeconds(duration, 120); // Use default tempo for preview
    instrument.triggerAttackRelease(pitch, durationSeconds);
  }

  dispose() {
    this.stop();
    this.players.forEach((player) => player.dispose());
    this.players.clear();
    if (this.drumSampler) {
      this.drumSampler.dispose();
      this.drumSampler = null;
    }
    if (this.pianoSampler) {
      this.pianoSampler.dispose();
      this.pianoSampler = null;
    }
  }
}

export const audioEngine = AudioEngine.getInstance();
