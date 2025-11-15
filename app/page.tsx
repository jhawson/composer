'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStore } from '@/lib/store';
import { Music } from 'lucide-react';

export default function Home() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users?name=${encodeURIComponent(name.trim())}`);
      if (!response.ok) throw new Error('Failed to create user');

      const user = await response.json();
      setUser(user);

      // Store in localStorage as well for persistence
      localStorage.setItem('composer-user', JSON.stringify(user));

      router.push('/songs');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to join. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Music className="h-16 w-16 text-primary" />
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Composer</CardTitle>
            <CardDescription>
              Collaborate on music together in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">What's your name?</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
                {loading ? 'Joining...' : 'Get Started'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Create songs, add instruments, and collaborate with others in real-time
        </p>
      </div>
    </main>
  );
}
