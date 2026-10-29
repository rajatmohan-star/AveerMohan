import React from 'react';
import { TRAILS } from '../data/gameData';
import { TrailItem } from '../types/game';
import { formatNumber } from '../utils/format';
import { X, Sparkles, Check, Lock, Trophy } from 'lucide-react';
import { sound } from '../utils/audio';

interface TrailsModalProps {
  wins: number;
  equippedTrailId: string;
  ownedTrailIds: string[];
  onBuyTrail: (trail: TrailItem) => void;
  onEquipTrail: (trail: TrailItem) => void;
  onClose: () => void;
}

export const TrailsModal: React.FC<TrailsModalProps> = ({
  wins,
  equippedTrailId,
  ownedTrailIds,
  onBuyTrail,
  onEquipTrail,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-indigo-900 via-purple-950 to-slate-950 rounded-3xl p-5 border-4 border-purple-400 shadow-2xl text-white max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-700/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-2xl font-black font-arcade text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300">
                Speed Trails Shop
              </h2>
              <p className="text-xs font-bold text-purple-300">
                Multiply your running and treadmill speed!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400/50 rounded-xl text-amber-300 font-extrabold text-xs">
              <Trophy className="w-3.5 h-3.5" />
              {formatNumber(wins)} Wins
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
        </div>

        {/* Trail Items Grid */}
        <div className="overflow-y-auto space-y-3 py-4 pr-1 flex-1">
          {TRAILS.map((t) => {
            const isOwned = ownedTrailIds.includes(t.id);
            const isEquipped = equippedTrailId === t.id;
            const canAfford = wins >= t.price;

            return (
              <div
                key={t.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                  isEquipped
                    ? 'bg-purple-900/60 border-yellow-400 ring-2 ring-yellow-400/30'
                    : isOwned
                    ? 'bg-slate-800/80 border-purple-500/50'
                    : 'bg-slate-900/70 border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/20"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-white">{t.name}</h3>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/30 text-purple-300 border border-purple-400/30">
                        {t.tier}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-emerald-400 font-black text-sm">
                        ×{formatNumber(t.multiplier)} Speed
                      </span>
                      {!isOwned && (
                        <span className="text-amber-400 text-xs font-bold flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> {formatNumber(t.price)} Wins
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  {isEquipped ? (
                    <div className="px-4 py-2 rounded-xl bg-yellow-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md">
                      <Check className="w-4 h-4 stroke-[3]" /> EQUIPPED
                    </div>
                  ) : isOwned ? (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onEquipTrail(t);
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                    >
                      EQUIP
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (canAfford) {
                          onBuyTrail(t);
                        } else {
                          sound.playWrong();
                        }
                      }}
                      disabled={!canAfford}
                      className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white'
                          : 'bg-slate-700 text-slate-400 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? (
                        <>BUY</>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" /> NEED WINS
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-purple-800 text-center text-xs text-purple-300 font-semibold">
          Equip trails to boost speed accumulation and unlock higher worlds!
        </div>
      </div>
    </div>
  );
};
