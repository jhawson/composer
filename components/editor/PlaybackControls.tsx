'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Song } from '@/types';
import { Play, Pause, Square, Repeat } from 'lucide-react';

interface PlaybackControlsProps {
  song: Song;
}

export function PlaybackControls({ song }: PlaybackControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement Tone.js playback
  };

  const handleStop = () => {
    setIsPlaying(false);
    // TODO: Implement Tone.js stop
  };

  const handleToggleLoop = () => {
    setIsLooping(!isLooping);
    // TODO: Implement Tone.js loop
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
