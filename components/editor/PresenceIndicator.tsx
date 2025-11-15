'use client';

import { User } from '@/types';
import { Users } from 'lucide-react';

interface PresenceIndicatorProps {
  users: User[];
}

export function PresenceIndicator({ users }: PresenceIndicatorProps) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
      <Users className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-1">
        {users.map((user, index) => (
          <div
            key={`${user.id}-${index}`}
            className="flex items-center gap-1 px-2 py-1 bg-background rounded text-sm"
            title={user.name}
          >
            <span>{user.avatarIcon}</span>
            <span className="font-medium">{user.name}</span>
          </div>
        ))}
      </div>
      <span className="text-xs text-muted-foreground ml-2">
        {users.length} {users.length === 1 ? 'viewer' : 'viewers'}
      </span>
    </div>
  );
}
