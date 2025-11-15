'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Song } from '@/types';
import { Play, Pause, Square, Repeat } from 'lucide-react';
import { audioEngine } from '@/lib/audio-engine';

interface PlaybackControlsProps {
  song: Song;
}

export function PlaybackControls({ song }: PlaybackControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  useEffect(() => {
    // Register callback to update UI when playback stops
    audioEngine.setOnStopCallback(() => {
      setIsPlaying(false);
    });

    return () => {
      audioEngine.setOnStopCallback(null);
      audioEngine.stop();
    };
  }, []);

  const handlePlayPause = async () => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      if (audioEngine.getIsPlaying()) {
        audioEngine.resume();
      } else {
        await audioEngine.play(song);
      }
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
  };

  const handleToggleLoop = () => {
    const newLoopState = !isLooping;
    setIsLooping(newLoopState);
    audioEngine.setLoop(newLoopState);
  };

  return (
    <div className="border-b bg-card p-3">
      <div className="flex items-center justify-center gap-2">
        <Button
          variant={isPlaying ? 'default' : 'outline'}
          size="sm"
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Play All
            </>
          )}
        </Button>

        <Button variant="outline" size="sm" onClick={handleStop}>
          <Square className="h-4 w-4 mr-2" />
          Stop
        </Button>

        <Button
          variant={isLooping ? 'default' : 'outline'}
          size="sm"
          onClick={handleToggleLoop}
        >
          <Repeat className="h-4 w-4 mr-2" />
          Loop
        </Button>

        <div className="ml-4 text-sm text-muted-foreground">
          {song.tempo} BPM • {song.timeSignature} • {song.bars} bars
        </div>
      </div>
    </div>
  );
}
