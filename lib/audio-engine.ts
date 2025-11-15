import * as Tone from 'tone';
import { Song, Track, Note, NoteDuration, DURATION_TO_SIXTEENTHS } from '@/types';

export class AudioEngine {
  private static instance: AudioEngine;
  private players: Map<string, Tone.PolySynth | Tone.Sampler> = new Map();
  private drumSampler: Tone.Sampler | null = null;
  private drumSamplerLoaded = false;
  private drumSamplerLoadPromise: Promise<void> | null = null;
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
    // Preload drum samples
    await this.loadDrumSampler();
  }

  private async loadDrumSampler(): Promise<void> {
    if (this.drumSamplerLoaded) {
      return Promise.resolve();
    }

    if (this.drumSamplerLoadPromise) {
      return this.drumSamplerLoadPromise;
    }

    // Use synthesized drums instead of samples to avoid loading issues
    console.log('Creating synthesized drum kit');

    // Create a custom synth for each drum type
    const kickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
    }).toDestination();

    const snareSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
    }).toDestination();

    const hihatSynth = new Tone.MetalSynth({
      frequency: 200,
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();

    const rideSynth = new Tone.MetalSynth({
      frequency: 300,
      envelope: { attack: 0.001, decay: 0.4, release: 0.1 },
      harmonicity: 3.1,
      modulationIndex: 16,
      resonance: 3000,
      octaves: 1.5
    }).toDestination();

    // Create a custom drum sampler that maps to these synths
    const drumKit = {
      triggerAttackRelease: (note: string, duration: number, time?: number) => {
        switch (note) {
          case 'C1': // bass/kick
            kickSynth.triggerAttackRelease('C1', duration, time);
            break;
          case 'D1': // snare
            snareSynth.triggerAttackRelease(duration, time);
            break;
          case 'F1': // hihat
            hihatSynth.triggerAttackRelease(duration, time);
            break;
          case 'A1': // ride
            rideSynth.triggerAttackRelease(duration, time);
            break;
        }
      },
      volume: { value: 0 },
      dispose: () => {
        kickSynth.dispose();
        snareSynth.dispose();
        hihatSynth.dispose();
        rideSynth.dispose();
      }
    };

    this.drumSampler = drumKit as any;
    this.drumSamplerLoaded = true;
    this.players.set('drums', this.drumSampler);
    console.log('Synthesized drum kit ready');

    this.drumSamplerLoadPromise = Promise.resolve();
    return this.drumSamplerLoadPromise;
  }

  private getOrCreateInstrument(instrumentType: string): Tone.PolySynth | Tone.Sampler {
    if (this.players.has(instrumentType)) {
      return this.players.get(instrumentType)!;
    }

    let instrument: Tone.PolySynth | Tone.Sampler;

    if (instrumentType === 'drums') {
      // Return existing drum sampler or create a placeholder
      if (this.drumSampler) {
        instrument = this.drumSampler;
      } else {
        // This shouldn't happen if loadDrumSampler was called, but just in case
        throw new Error('Drum sampler not initialized. Call loadDrumSampler() first.');
      }
      instrument = this.drumSampler;
    } else if (instrumentType === 'bass') {
      // Bass synth
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
      // Piano synth (default)
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

    this.players.set(instrumentType, instrument);
    return instrument;
  }

  private drumTypeToNote(drumType: string): string {
    const mapping: Record<string, string> = {
      bass: 'C1',
      snare: 'D1',
      hihat: 'F1',
      ride: 'A1',
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
    this.currentPart = new Tone.Part((time, event) => {
      event.instrument.volume.value = Tone.gainToDb(event.volume);
      event.instrument.triggerAttackRelease(event.note, event.duration, time);
    }, events.map(e => [e.time, e]));

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

    // For drums, ensure samples are loaded
    if (instrumentType === 'drums' && !this.drumSamplerLoaded) {
      console.log('Waiting for drum samples to load...');
      await this.loadDrumSampler();
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
  }
}

export const audioEngine = AudioEngine.getInstance();
