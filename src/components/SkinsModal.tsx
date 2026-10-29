import React from 'react';
import { SKINS } from '../data/gameData';
import { SkinItem } from '../types/game';
import { formatNumber } from '../utils/format';
import { X, Shirt, Check, Lock, Trophy } from 'lucide-react';
import { sound } from '../utils/audio';

interface SkinsModalProps {
  wins: number;
  equippedSkinId: string;
  ownedSkinIds: string[];
  onBuySkin: (skin: SkinItem) => void;
  onEquipSkin: (skin: SkinItem) => void;
  onClose: () => void;
}

export const SkinsModal: React.FC<SkinsModalProps> = ({
  wins,
  equippedSkinId,
  ownedSkinIds,
  onBuySkin,
  onEquipSkin,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-950 rounded-3xl p-5 border-4 border-pink-400 shadow-2xl text-white max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-700/50">
          <div className="flex items-center gap-2">
            <Shirt className="w-6 h-6 text-pink-400" />
            <div>
              <h2 className="text-2xl font-black font-arcade text-pink-300">
                Customise Character
              </h2>
              <p className="text-xs font-bold text-purple-300">
                Equip stylish hats and colourful 3D outfits!
              </p>
            </div>
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

        {/* Skins Grid */}
        <div className="overflow-y-auto space-y-3 py-4 pr-1 flex-1">
          {SKINS.map((s) => {
            const isOwned = ownedSkinIds.includes(s.id);
            const isEquipped = equippedSkinId === s.id;
            const canAfford = wins >= s.price;

            return (
              <div
                key={s.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                  isEquipped
                    ? 'bg-purple-900/60 border-pink-400 ring-2 ring-pink-400/30'
                    : isOwned
                    ? 'bg-slate-800/80 border-purple-500/50'
                    : 'bg-slate-900/70 border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/20"
                    style={{ backgroundColor: s.bodyColor }}
                  >
                    {s.hatType === 'tophat'
                      ? '🎩'
                      : s.hatType === 'wizard'
                      ? '🧙‍♂️'
                      : s.hatType === 'pumpkin'
                      ? '🎃'
                      : s.hatType === 'crown'
                      ? '👑'
                      : '🧢'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">{s.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-purple-200 capitalize">
                        {s.hatType} Hat
                      </span>
                      {!isOwned && (
                        <span className="text-amber-400 text-xs font-bold flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> {formatNumber(s.price)} Wins
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  {isEquipped ? (
                    <div className="px-4 py-2 rounded-xl bg-pink-500 text-white font-black text-xs flex items-center gap-1 shadow-md">
                      <Check className="w-4 h-4 stroke-[3]" /> EQUIPPED
                    </div>
                  ) : isOwned ? (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onEquipSkin(s);
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                    >
                      EQUIP
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (canAfford) {
                          onBuySkin(s);
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
      </div>
    </div>
  );
};
