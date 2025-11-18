import * as Tone from 'tone';
import { Song, Track, Note, NoteDuration, DURATION_TO_SIXTEENTHS } from '@/types';

export class AudioEngine {
  private static instance: AudioEngine;
  private players: Map<string, Tone.PolySynth | Tone.Sampler> = new Map();
  private drumSamplers: Map<string, Tone.Sampler> = new Map();
  private drumSamplersLoaded: Map<string, boolean> = new Map();
  private drumSamplersLoadPromises: Map<string, Promise<void>> = new Map();
  private pianoSampler: Tone.Sampler | null = null;
  private pianoSamplerLoaded = false;
  private pianoSamplerLoadPromise: Promise<void> | null = null;
  private synthPlayer: Tone.PolySynth | null = null;
  private organSampler: Tone.Sampler | null = null;
  private bassSampler: Tone.Sampler | null = null;
  private guitarSampler: Tone.Sampler | null = null;
  private celloSampler: Tone.Sampler | null = null;
  private fluteSampler: Tone.Sampler | null = null;
  private harpSampler: Tone.Sampler | null = null;
  private samplersLoaded: Record<string, boolean> = {};
  private samplersLoadPromises: Record<string, Promise<void> | null> = {};
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
    // Initialize synth (no loading needed)
    this.initializeSynth();
    // Preload all instrument samples (using default drum kit)
    await Promise.all([
      this.loadPianoSampler(),
      this.loadDrumSampler('breakbeat13'),
      this.loadOrganSampler(),
      this.loadBassSampler(),
      this.loadGuitarSampler(),
      this.loadCelloSampler(),
      this.loadFluteSampler(),
      this.loadHarpSampler()
    ]);
  }

  private initializeSynth() {
    // Create a polyphonic synthesizer with a nice preset
    this.synthPlayer = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle'
      },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    }).toDestination();

    this.players.set('synth', this.synthPlayer);
    console.log('Synth initialized');
  }

  private async loadDrumSampler(drumKit: string): Promise<void> {
    if (this.drumSamplersLoaded.get(drumKit)) {
      return Promise.resolve();
    }

    if (this.drumSamplersLoadPromises.has(drumKit)) {
      return this.drumSamplersLoadPromises.get(drumKit)!;
    }

    console.log(`Loading drum samples for kit: ${drumKit}...`);

    const loadPromise = new Promise<void>((resolve, reject) => {
      const sampler = new Tone.Sampler({
        urls: {
          C1: 'kick.mp3',
          D1: 'snare.mp3',
          F1: 'hihat.mp3',
          G1: 'tom1.mp3',
          A1: 'tom2.mp3',
          B1: 'tom3.mp3'
        },
        baseUrl: `https://tonejs.github.io/audio/drum-samples/${drumKit}/`,
        attack: 0,
        release: 0.5,
        curve: 'linear' as const,
        onload: () => {
          console.log(`Drum samples loaded successfully for kit: ${drumKit}`);
          this.drumSamplersLoaded.set(drumKit, true);
          this.drumSamplers.set(drumKit, sampler);
          resolve();
        },
        onerror: (err) => {
          console.error(`Failed to load drum samples for kit ${drumKit}:`, err);
          reject(err);
        }
      }).toDestination();
    });

    this.drumSamplersLoadPromises.set(drumKit, loadPromise);
    return loadPromise;
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

  private async loadOrganSampler(): Promise<void> {
    if (this.samplersLoaded['organ']) {
      return Promise.resolve();
    }

    if (this.samplersLoadPromises['organ']) {
      return this.samplersLoadPromises['organ']!;
    }

    console.log('Loading organ samples from CDN...');

    this.samplersLoadPromises['organ'] = new Promise<void>((resolve, reject) => {
      this.organSampler = new Tone.Sampler({
        urls: {
          C3: 'C3.mp3',
          C4: 'C4.mp3',
          C5: 'C5.mp3',
          C6: 'C6.mp3'
        },
        baseUrl: 'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples/organ/',
        release: 1,
        onload: () => {
          console.log('Organ samples loaded successfully');
          this.samplersLoaded['organ'] = true;
          this.players.set('organ', this.organSampler!);
          resolve();
        },
        onerror: (err) => {
          console.error('Failed to load organ samples:', err);
          reject(err);
        }
      }).toDestination();
    });

    return this.samplersLoadPromises['organ'];
  }

  private async loadBassSampler(): Promise<void> {
    if (this.samplersLoaded['bass']) {
      return Promise.resolve();
    }

    if (this.samplersLoadPromises['bass']) {
      return this.samplersLoadPromises['bass']!;
    }

    console.log('Loading bass samples from CDN...');

    this.samplersLoadPromises['bass'] = new Promise<void>((resolve, reject) => {
      this.bassSampler = new Tone.Sampler({
        urls: {
          'A#1': 'As1.mp3',
          'A#2': 'As2.mp3',
          'A#3': 'As3.mp3'
        },
        baseUrl: 'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples/bass-electric/',
        release: 1,
        onload: () => {
          console.log('Bass samples loaded successfully');
          this.samplersLoaded['bass'] = true;
          this.players.set('bass', this.bassSampler!);
          resolve();
        },
        onerror: (err) => {
          console.error('Failed to load bass samples:', err);
          reject(err);
        }
      }).toDestination();
    });

    return this.samplersLoadPromises['bass'];
  }

  private async loadGuitarSampler(): Promise<void> {
    if (this.samplersLoaded['guitar']) {
      return Promise.resolve();
    }

    if (this.samplersLoadPromises['guitar']) {
      return this.samplersLoadPromises['guitar']!;
    }

    console.log('Loading guitar samples from CDN...');

    this.samplersLoadPromises['guitar'] = new Promise<void>((resolve, reject) => {
      this.guitarSampler = new Tone.Sampler({
        urls: {
          'A2': 'A2.mp3',
          'A3': 'A3.mp3',
          'A4': 'A4.mp3',
          'C3': 'C3.mp3',
          'C4': 'C4.mp3',
          'C5': 'C5.mp3',
          'F2': 'F2.mp3',
          'F3': 'F3.mp3',
          'F4': 'F4.mp3'
        },
        baseUrl: 'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples/guitar-acoustic/',
        release: 1,
        onload: () => {
          console.log('Guitar samples loaded successfully');
          this.samplersLoaded['guitar'] = true;
          this.players.set('guitar', this.guitarSampler!);
          resolve();
        },
        onerror: (err) => {
          console.error('Failed to load guitar samples:', err);
          reject(err);
        }
      }).toDestination();
    });

    return this.samplersLoadPromises['guitar'];
  }

  private async loadCelloSampler(): Promise<void> {
    if (this.samplersLoaded['cello']) {
      return Promise.resolve();
    }

    if (this.samplersLoadPromises['cello']) {
      return this.samplersLoadPromises['cello']!;
    }

    console.log('Loading cello samples from CDN...');

    this.samplersLoadPromises['cello'] = new Promise<void>((resolve, reject) => {
      this.celloSampler = new Tone.Sampler({
        urls: {
          'A#2': 'As2.mp3',
          'A#3': 'As3.mp3',
          C2: 'C2.mp3',
          C3: 'C3.mp3',
          C4: 'C4.mp3',
          C5: 'C5.mp3',
          'D#2': 'Ds2.mp3',
          'D#3': 'Ds3.mp3',
          'D#4': 'Ds4.mp3',
          'F#3': 'Fs3.mp3',
          'F#4': 'Fs4.mp3',
          'G#2': 'Gs2.mp3',
          'G#3': 'Gs3.mp3',
          'G#4': 'Gs4.mp3'
        },
        baseUrl: 'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples/cello/',
        release: 1,
        onload: () => {
          console.log('Cello samples loaded successfully');
          this.samplersLoaded['cello'] = true;
          this.players.set('cello', this.celloSampler!);
          resolve();
        },
        onerror: (err) => {
          console.error('Failed to load cello samples:', err);
          reject(err);
        }
      }).toDestination();
    });

    return this.samplersLoadPromises['cello'];
  }

  private async loadFluteSampler(): Promise<void> {
    if (this.samplersLoaded['flute']) {
      return Promise.resolve();
    }

    if (this.samplersLoadPromises['flute']) {
      return this.samplersLoadPromises['flute']!;
    }

    console.log('Loading flute samples from CDN...');

    this.samplersLoadPromises['flute'] = new Promise<void>((resolve, reject) => {
      this.fluteSampler = new Tone.Sampler({
        urls: {
          A4: 'A4.mp3',
          A5: 'A5.mp3',
          A6: 'A6.mp3',
          C4: 'C4.mp3',
          C5: 'C5.mp3',
          C6: 'C6.mp3',
          C7: 'C7.mp3',
          E4: 'E4.mp3',
          E5: 'E5.mp3',
          E6: 'E6.mp3'
        },
        baseUrl: 'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples/flute/',
        release: 1,
        onload: () => {
          console.log('Flute samples loaded successfully');
          this.samplersLoaded['flute'] = true;
          this.players.set('flute', this.fluteSampler!);
          resolve();
        },
        onerror: (err) => {
          console.error('Failed to load flute samples:', err);
          reject(err);
        }
      }).toDestination();
    });

    return this.samplersLoadPromises['flute'];
  }

  private async loadHarpSampler(): Promise<void> {
    if (this.samplersLoaded['harp']) {
      return Promise.resolve();
    }

    if (this.samplersLoadPromises['harp']) {
      return this.samplersLoadPromises['harp']!;
    }

    console.log('Loading harp samples from CDN...');

    this.samplersLoadPromises['harp'] = new Promise<void>((resolve, reject) => {
      this.harpSampler = new Tone.Sampler({
        urls: {
          A2: 'A2.mp3',
          A4: 'A4.mp3',
          A6: 'A6.mp3',
          B1: 'B1.mp3',
          B3: 'B3.mp3',
          B5: 'B5.mp3',
          B6: 'B6.mp3',
          C3: 'C3.mp3',
          C5: 'C5.mp3',
          D2: 'D2.mp3',
          D4: 'D4.mp3',
          D6: 'D6.mp3',
          D7: 'D7.mp3',
          E1: 'E1.mp3',
          E3: 'E3.mp3',
          E5: 'E5.mp3',
          F2: 'F2.mp3',
          F4: 'F4.mp3',
          F6: 'F6.mp3',
          F7: 'F7.mp3',
          G1: 'G1.mp3',
          G3: 'G3.mp3',
          G5: 'G5.mp3'
        },
        baseUrl: 'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples/harp/',
        release: 1,
        onload: () => {
          console.log('Harp samples loaded successfully');
          this.samplersLoaded['harp'] = true;
          this.players.set('harp', this.harpSampler!);
          resolve();
        },
        onerror: (err) => {
          console.error('Failed to load harp samples:', err);
          reject(err);
        }
      }).toDestination();
    });

    return this.samplersLoadPromises['harp'];
  }

  private getOrCreateInstrument(instrumentType: string, drumKit?: string): Tone.PolySynth | Tone.Sampler {
    // For drums, use drumKit-specific key
    const playerKey = instrumentType === 'drums' && drumKit ? `drums-${drumKit}` : instrumentType;

    if (this.players.has(playerKey)) {
      return this.players.get(playerKey)!;
    }

    let instrument: Tone.PolySynth | Tone.Sampler;

    if (instrumentType === 'drums') {
      const kit = drumKit || 'breakbeat13';
      if (this.drumSamplers.has(kit)) {
        instrument = this.drumSamplers.get(kit)!;
      } else {
        throw new Error(`Drum sampler for kit ${kit} not initialized.`);
      }
    } else if (instrumentType === 'piano') {
      if (this.pianoSampler) {
        instrument = this.pianoSampler;
      } else {
        throw new Error('Piano sampler not initialized.');
      }
    } else if (instrumentType === 'synth') {
      if (this.synthPlayer) {
        instrument = this.synthPlayer;
      } else {
        throw new Error('Synth not initialized.');
      }
    } else if (instrumentType === 'organ') {
      if (this.organSampler) {
        instrument = this.organSampler;
      } else {
        throw new Error('Organ sampler not initialized.');
      }
    } else if (instrumentType === 'bass') {
      if (this.bassSampler) {
        instrument = this.bassSampler;
      } else {
        throw new Error('Bass sampler not initialized.');
      }
    } else if (instrumentType === 'guitar') {
      if (this.guitarSampler) {
        instrument = this.guitarSampler;
      } else {
        throw new Error('Guitar sampler not initialized.');
      }
    } else if (instrumentType === 'cello') {
      if (this.celloSampler) {
        instrument = this.celloSampler;
      } else {
        throw new Error('Cello sampler not initialized.');
      }
    } else if (instrumentType === 'flute') {
      if (this.fluteSampler) {
        instrument = this.fluteSampler;
      } else {
        throw new Error('Flute sampler not initialized.');
      }
    } else if (instrumentType === 'harp') {
      if (this.harpSampler) {
        instrument = this.harpSampler;
      } else {
        throw new Error('Harp sampler not initialized.');
      }
    } else {
      // Fallback to piano for unknown types
      if (this.pianoSampler) {
        instrument = this.pianoSampler;
      } else {
        throw new Error('No instrument sampler available.');
      }
    }

    this.players.set(playerKey, instrument);
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
      // Load drum kit if needed
      if (track.instrumentType === 'drums' && track.drumKit) {
        await this.loadDrumSampler(track.drumKit);
      }

      const instrument = this.getOrCreateInstrument(track.instrumentType, track.drumKit || undefined);
      console.log(`Track ${track.instrumentType}${track.drumKit ? ` (${track.drumKit})` : ''}: ${track.notes.length} notes`);

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
  async playNote(instrumentType: string, pitch: string, duration: NoteDuration = 'quarter', drumKit?: string) {
    await this.initialize();

    // Ensure samples are loaded for sampled instruments
    if (instrumentType === 'drums') {
      const kit = drumKit || 'breakbeat13';
      if (!this.drumSamplersLoaded.get(kit)) {
        console.log(`Waiting for drum samples to load for kit: ${kit}...`);
        await this.loadDrumSampler(kit);
      }
    }

    if (instrumentType === 'piano' && !this.pianoSamplerLoaded) {
      console.log('Waiting for piano samples to load...');
      await this.loadPianoSampler();
    }

    const instrument = this.getOrCreateInstrument(instrumentType, drumKit);
    const durationSeconds = this.durationToSeconds(duration, 120); // Use default tempo for preview
    instrument.triggerAttackRelease(pitch, durationSeconds);
  }

  dispose() {
    this.stop();
    this.players.forEach((player) => player.dispose());
    this.players.clear();
    this.drumSamplers.forEach((sampler) => sampler.dispose());
    this.drumSamplers.clear();
    if (this.pianoSampler) {
      this.pianoSampler.dispose();
      this.pianoSampler = null;
    }
    if (this.synthPlayer) {
      this.synthPlayer.dispose();
      this.synthPlayer = null;
    }
    if (this.organSampler) {
      this.organSampler.dispose();
      this.organSampler = null;
    }
    if (this.bassSampler) {
      this.bassSampler.dispose();
      this.bassSampler = null;
    }
    if (this.guitarSampler) {
      this.guitarSampler.dispose();
      this.guitarSampler = null;
    }
    if (this.celloSampler) {
      this.celloSampler.dispose();
      this.celloSampler = null;
    }
    if (this.fluteSampler) {
      this.fluteSampler.dispose();
      this.fluteSampler = null;
    }
    if (this.harpSampler) {
      this.harpSampler.dispose();
      this.harpSampler = null;
    }
  }
}

export const audioEngine = AudioEngine.getInstance();
