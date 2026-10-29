import React from 'react';
import { INITIAL_LEADERBOARD } from '../data/gameData';
import { LeaderboardEntry } from '../types/game';
import { formatNumber } from '../utils/format';
import { X, Trophy, Zap, Crown } from 'lucide-react';
import { sound } from '../utils/audio';

interface LeaderboardModalProps {
  playerName: string;
  playerSpeed: number;
  playerWins: number;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  playerName,
  playerSpeed,
  playerWins,
  onClose,
}) => {
  // Combine player into leaderboard
  const list: LeaderboardEntry[] = [...INITIAL_LEADERBOARD];

  // Insert or evaluate player position
  const playerEntry: LeaderboardEntry = {
    rank: 0,
    name: playerName,
    speedText: formatNumber(playerSpeed),
    speedValue: playerSpeed,
    winsText: formatNumber(playerWins),
    isPlayer: true,
  };

  list.push(playerEntry);
  list.sort((a, b) => b.speedValue - a.speedValue);

  // Re-assign ranks
  list.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950 rounded-3xl p-5 border-4 border-amber-400 shadow-2xl text-white max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-amber-700/50">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-2xl font-black font-arcade text-amber-300">
                Top Speed Board
              </h2>
              <p className="text-xs font-bold text-amber-200">
                All-time world records across 3x3 Escape
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-rose-500 hover:bg-rose-600 active:scale-90 text-white font-black shadow-md transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-2 py-3 flex-1 pr-1">
          {list.slice(0, 15).map((row) => (
            <div
              key={row.name}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                row.isPlayer
                  ? 'bg-purple-800/80 border-yellow-400 ring-2 ring-yellow-400/50'
                  : row.rank === 1
                  ? 'bg-gradient-to-r from-amber-900/60 to-yellow-900/40 border-amber-400'
                  : 'bg-slate-900/70 border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm bg-slate-800 border border-white/20">
                  {row.rank === 1 ? (
                    <Crown className="w-4 h-4 text-yellow-400" />
                  ) : (
                    `#${row.rank}`
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    {row.name}
                    {row.isPlayer && (
                      <span className="text-[10px] bg-yellow-400 text-slate-950 font-black px-1.5 py-0.2 rounded">
                        YOU
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> {row.winsText} Wins
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 font-black text-sm text-cyan-300 font-arcade">
                <Zap className="w-4 h-4 text-cyan-400" />
                {row.speedText}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
