import React from 'react';
import { formatNumber } from '../utils/format';
import { X, RefreshCw, Zap, Trophy, ShieldCheck } from 'lucide-react';
import { sound } from '../utils/audio';

interface RebirthModalProps {
  level: number;
  rebirths: number;
  rebirthMultiplier: number;
  onConfirmRebirth: () => void;
  onClose: () => void;
}

export const RebirthModal: React.FC<RebirthModalProps> = ({
  level,
  rebirths,
  rebirthMultiplier,
  onConfirmRebirth,
  onClose,
}) => {
  const requiredLevel = (rebirths + 1) * 30;
  const canRebirth = level >= requiredLevel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-gradient-to-b from-amber-900 via-orange-950 to-slate-950 rounded-3xl p-5 border-4 border-amber-400 shadow-2xl text-white animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-700/50">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-amber-400 animate-spin-slow" />
            <div>
              <h2 className="text-2xl font-black font-arcade text-amber-300">
                Rebirth Temple
              </h2>
              <p className="text-xs font-bold text-amber-200">
                Ascend for permanent massive multipliers!
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

        {/* Content */}
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-amber-950/60 rounded-2xl border border-amber-500/30">
              <span className="text-xs font-bold text-amber-300">Current Rebirths</span>
              <p className="text-3xl font-black font-arcade text-white mt-1">{rebirths}</p>
            </div>
            <div className="p-3 bg-amber-950/60 rounded-2xl border border-amber-500/30">
              <span className="text-xs font-bold text-amber-300">Current Multiplier</span>
              <p className="text-3xl font-black font-arcade text-amber-400 mt-1">
                ×{rebirthMultiplier}
              </p>
            </div>
          </div>

          <div className="p-4 bg-orange-900/40 rounded-2xl border-2 border-orange-500/40 space-y-2">
            <h4 className="text-sm font-black text-orange-200 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-yellow-400" /> Next Rebirth Benefits:
            </h4>
            <ul className="text-xs text-orange-100 font-semibold space-y-1 pl-1">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Permanent <b className="text-yellow-300">+5.0x Speed Multiplier</b>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Special Golden Rebirth Chat Badge
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Resets Stage progress to Stage 1, keeps all Wins & Trails!
              </li>
            </ul>
          </div>

          <div className="text-center">
            <p className="text-xs font-bold text-slate-300">
              Requirement: Level <span className="text-yellow-400">{requiredLevel}</span> (You
              are Level <span className="text-emerald-400">{level}</span>)
            </p>
          </div>

          <button
            onClick={() => {
              if (canRebirth) {
                onConfirmRebirth();
              } else {
                sound.playWrong();
              }
            }}
            disabled={!canRebirth}
            className={`w-full py-3.5 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              canRebirth
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 active:scale-95'
                : 'bg-slate-800 text-slate-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <RefreshCw className="w-5 h-5" />
            {canRebirth ? 'REBIRTH NOW (+5x BOOST)' : `REACH LEVEL ${requiredLevel} TO REBIRTH`}
          </button>
        </div>
      </div>
    </div>
  );
};
