import React from 'react';
import { WORLDS } from '../data/gameData';
import { X, Globe2, Lock, Check } from 'lucide-react';
import { sound } from '../utils/audio';

interface WorldSelectModalProps {
  currentWorld: number;
  playerLevel: number;
  onSelectWorld: (worldId: number) => void;
  onClose: () => void;
}

export const WorldSelectModal: React.FC<WorldSelectModalProps> = ({
  currentWorld,
  playerLevel,
  onSelectWorld,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-gradient-to-b from-pink-200 via-purple-100 to-indigo-100 rounded-3xl p-5 border-4 border-white shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-purple-200">
          <div className="flex items-center gap-2">
            <Globe2 className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-black font-arcade tracking-wide text-purple-900">
              Select World 🪐
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-pink-500 hover:bg-pink-600 active:scale-90 text-white font-black shadow-md transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Worlds List */}
        <div className="space-y-3.5 mt-4">
          {WORLDS.map((w) => {
            const isUnlocked = playerLevel >= w.requiredLevel;
            const isCurrent = currentWorld === w.id;

            return (
              <div
                key={w.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border-3 shadow-md transition-all ${
                  isCurrent
                    ? 'bg-purple-200 border-purple-500'
                    : isUnlocked
                    ? 'bg-gradient-to-r from-sky-100 to-blue-200 border-sky-400'
                    : 'bg-slate-200/80 border-slate-300 opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner font-arcade"
                    style={{ backgroundColor: w.accentColor }}
                  >
                    {w.id === 1 ? '🎃' : w.id === 2 ? '☁️' : w.id === 3 ? '🔥' : w.id === 4 ? '💠' : '🌌'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{w.name}</h3>
                    <p className="text-xs font-semibold text-slate-600">
                      {w.requiredLevel === 1 ? 'Starter World' : `Unlocks Level ${w.requiredLevel}`}
                    </p>
                  </div>
                </div>

                <div>
                  {isCurrent ? (
                    <div className="px-4 py-2 rounded-xl bg-purple-600 text-white font-extrabold text-sm flex items-center gap-1 shadow-sm">
                      <Check className="w-4 h-4" /> You're Here
                    </div>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onSelectWorld(w.id);
                        onClose();
                      }}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 active:scale-95 text-white font-black text-sm shadow-md transition-transform"
                    >
                      Teleport
                    </button>
                  ) : (
                    <div className="px-4 py-2 rounded-xl bg-amber-400/90 text-amber-950 font-black text-sm flex items-center gap-1 shadow-sm">
                      <Lock className="w-4 h-4" /> Locked
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs font-bold text-slate-500 mt-4">
          Complete stages and run on treadmills to earn Speed & Level Up!
        </p>
      </div>
    </div>
  );
};
