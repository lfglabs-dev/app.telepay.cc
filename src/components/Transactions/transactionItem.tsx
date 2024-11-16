/* eslint-disable @next/next/no-img-element */
import type { FC } from 'react';
import { Avatar } from "@/components/ui/avatar"

interface TransactionItemProps {
  name: string;
  time: string;
  amount: number;
  avatar?: string;
  verified?: boolean;
  type?: 'user' | 'wallet';
}

export const TransactionItem: FC<TransactionItemProps> = ({
  name,
  time,
  amount,
  avatar,
  verified = false,
  type = 'user'
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {type === 'user' ? (
          <Avatar className="h-10 w-10 rounded-full border border-zinc-800">
            <img alt={name} src={avatar} className="rounded-full" />
          </Avatar>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
            <div className="h-4 w-4 rounded-full bg-emerald-400" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{name}</span>
          </div>
          <div className="text-sm text-zinc-400">{time}</div>
        </div>
      </div>
      <div className={`font-medium ${amount > 0 ? 'text-emerald-400' : ''}`}>
        {amount > 0 ? '+' : ''}${Math.abs(amount).toLocaleString()}
      </div>
    </div>
  );
};