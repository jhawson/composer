'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserStore } from '@/lib/store';
import { Music, Plus, Clock } from 'lucide-react';

interface Song {
  id: string;
  name: string;
  tempo: number;
  timeSignature: string;
  bars: number;
  createdAt: string;
  updatedAt: string;
  tracks: any[];
}

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSongName, setNewSongName] = useState('');
  const router = useRouter();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      const storedUser = localStorage.getItem('composer-user');
      if (storedUser) {
        useUserStore.getState().setUser(JSON.parse(storedUser));
      } else {
        router.push('/');
        return;
      }
    }

    fetchSongs();
  }, [user, router]);

  const fetchSongs = async () => {
    try {
      const response = await fetch('/api/songs');
      if (!response.ok) throw new Error('Failed to fetch songs');
      const data = await response.json();
      setSongs(data);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSongName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSongName }),
      });

      if (!response.ok) throw new Error('Failed to create song');

      const song = await response.json();
      router.push(`/editor/${song.id}`);
    } catch (error) {
      console.error('Error creating song:', error);
      alert('Failed to create song. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading songs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Music className="h-10 w-10 text-primary" />
              Composer
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, <span className="font-medium">{user?.name}</span> {user?.avatarIcon}
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                New Song
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Song</DialogTitle>
                <DialogDescription>
                  Start composing a new song. You can configure tempo and other settings in the editor.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSong}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="songName">Song Name</Label>
                    <Input
                      id="songName"
                      placeholder="My Awesome Song"
                      value={newSongName}
                      onChange={(e) => setNewSongName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating || !newSongName.trim()}>
                    {creating ? 'Creating...' : 'Create Song'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {songs.length === 0 ? (
          <Card className="p-12 text-center">
            <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No songs yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first song to get started with collaborative music composition
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Song
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {songs.map((song) => (
              <Card
                key={song.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/editor/${song.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    {song.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Clock className="h-3 w-3" />
                    {formatDate(song.updatedAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">{song.tempo}</span> BPM
                    </div>
                    <div>
                      <span className="font-medium">{song.timeSignature}</span>
                    </div>
                    <div>
                      <span className="font-medium">{song.tracks.length}</span> tracks
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
