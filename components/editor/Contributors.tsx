'use client';

import { SongContributor } from '@/types';

interface ContributorsProps {
  contributors: SongContributor[];
}

export function Contributors({ contributors }: ContributorsProps) {
  if (contributors.length === 0) {
    return null;
  }

  return (
    <div className="border-t bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground font-medium">Contributors:</span>
        <div className="flex items-center gap-2">
          {contributors.map((contributor) => (
            <div
              key={contributor.id}
              className="flex items-center gap-1.5 px-2 py-1 bg-background rounded-md border"
              title={contributor.user.name}
            >
              <span className="text-lg">{contributor.user.avatarIcon}</span>
              <span className="text-sm">{contributor.user.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
