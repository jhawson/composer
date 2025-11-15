import * as Tone from 'tone';
import { Song, Track, Note, NoteDuration, DURATION_TO_SIXTEENTHS } from '@/types';

export class AudioEngine {
  private static instance: AudioEngine;
  private players: Map<string, Tone.PolySynth | Tone.Sampler> = new Map();
  private drumSampler: Tone.Sampler | null = null;
  private isPlaying = false;
  private currentPart: Tone.Part | null = null;
  private loop = false;

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
  }

  private getOrCreateInstrument(instrumentType: string): Tone.PolySynth | Tone.Sampler {
    if (this.players.has(instrumentType)) {
      return this.players.get(instrumentType)!;
    }

    let instrument: Tone.PolySynth | Tone.Sampler;

    if (instrumentType === 'drums') {
      // Create drum sampler if not exists
      if (!this.drumSampler) {
        this.drumSampler = new Tone.Sampler({
          urls: {
            C1: 'kick.wav',  // bass drum
            D1: 'snare.wav', // snare
            F1: 'hihat.wav', // hi-hat
            A1: 'ride.wav',  // ride
          },
          baseUrl: 'https://tonejs.github.io/audio/drum-samples/acoustic-kit/',
        }).toDestination();
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

      for (const note of track.notes) {
        const noteTime = this.positionToSeconds(note.startPosition, song.tempo);
        const noteDuration = this.durationToSeconds(note.duration as NoteDuration, song.tempo);

        let pitch: string;
        if (note.drumType) {
          pitch = this.drumTypeToNote(note.drumType);
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
