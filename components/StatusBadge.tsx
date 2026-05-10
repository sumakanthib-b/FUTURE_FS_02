import React from 'react';
import { cn } from '../lib/utils';

interface StatusBadgeProps {
  status: 'new' | 'contacted' | 'converted';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    contacted: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    converted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-sm",
      styles[status]
    )}>
      {status}
    </span>
  );
}
