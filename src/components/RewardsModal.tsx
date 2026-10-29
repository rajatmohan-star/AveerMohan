import React from 'react';
import { Gift, X, Sparkles, Check } from 'lucide-react';
import { sound } from '../utils/audio';

interface RewardsModalProps {
  onClaimReward: (wins: number, speed: number) => void;
  onClose: () => void;
}

export const RewardsModal: React.FC<RewardsModalProps> = ({ onClaimReward, onClose }) => {
  const [claimed, setClaimed] = React.useState<number[]>([]);

  const rewards = [
    { day: 1, wins: 50, speed: 5000, title: 'Starter Crate' },
    { day: 2, wins: 150, speed: 20000, title: 'Speedy Boots' },
    { day: 3, wins: 500, speed: 100000, title: 'Golden Chest' },
    { day: 4, wins: 2000, speed: 500000, title: 'Mega Obby Pass' },
    { day: 5, wins: 10000, speed: 5000000, title: 'Legendary 3x3 Chest' },
  ];

  const handleClaim = (index: number, wins: number, speed: number) => {
    sound.playWin();
    setClaimed([...claimed, index]);
    onClaimReward(wins, speed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-950 rounded-3xl p-5 border-4 border-cyan-400 shadow-2xl text-white animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-cyan-700/50">
          <div className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="text-2xl font-black font-arcade text-cyan-300">
                Daily Rewards 🎁
              </h2>
              <p className="text-xs font-bold text-cyan-200">
                Free daily speed & wins for runners!
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

        <div className="space-y-2.5 py-4">
          {rewards.map((r, i) => {
            const isClaimed = claimed.includes(i);
            return (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border-2 border-cyan-500/30 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-600/30 border border-cyan-400 flex items-center justify-center text-xl">
                    🎁
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white">{r.title}</h4>
                    <p className="text-xs text-amber-300 font-bold">
                      +{r.wins} Wins & +{(r.speed / 1000).toFixed(0)}k Speed
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleClaim(i, r.wins, r.speed)}
                  disabled={isClaimed}
                  className={`px-4 py-2 rounded-xl font-black text-xs transition-all ${
                    isClaimed
                      ? 'bg-slate-700 text-slate-400'
                      : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white active:scale-95 shadow-md hover:from-emerald-400'
                  }`}
                >
                  {isClaimed ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Claimed
                    </span>
                  ) : (
                    'Claim'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
