import { SongContributor } from '@/types';

export async function addContributor(songId: string, userId: string): Promise<SongContributor | null> {
  try {
    const response = await fetch(`/api/songs/${songId}/contributors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      console.error('Failed to add contributor');
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding contributor:', error);
    return null;
  }
}
