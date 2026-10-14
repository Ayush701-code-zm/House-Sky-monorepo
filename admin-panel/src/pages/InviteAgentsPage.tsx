import React from 'react';
import { InviteLinkCard } from '../components/employees/InviteLinkCard';

export const InviteAgentsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl">
      <div>
        <h2 className="text-2xl font-serif font-bold text-[#171A18]">Invite Agents Under You</h2>
        <p className="text-xs text-[#171A18]/70 mt-1">
          Copy your personal link and share it. Anyone who joins with this link is attached as your downline agent.
        </p>
      </div>
      <InviteLinkCard variant="hero" />
    </div>
  );
};
