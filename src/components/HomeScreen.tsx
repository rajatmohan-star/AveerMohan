import React, { useState } from 'react';
import { Play, Sparkles, Volume2, VolumeX, Globe2, Zap, Heart, Trophy, ArrowRight, User } from 'lucide-react';
import { sound } from '../utils/audio';

interface HomeScreenProps {
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
  onPlay: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  playerName,
  onUpdatePlayerName,
  onPlay,
  soundEnabled,
  onToggleSound,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);

  const handleNameSave = () => {
    if (nameInput.trim().length > 0) {
      onUpdatePlayerName(nameInput.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto bg-gradient-to-b from-indigo-950 via-purple-900 to-slate-950 text-white select-none">
      {/* Top Bar with Audio & Settings */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-purple-800/80 border-2 border-purple-400/60 shadow-lg flex items-center gap-2">
            <span className="text-xl">🎃</span>
            <span className="text-xs font-black uppercase tracking-wider text-purple-200">
              3x3 Speed Obby
            </span>
          </div>
          <div className="px-3 py-1 rounded-full bg-purple-950/70 border border-purple-400/40 text-[11px] font-bold text-pink-300">
            Created by <span className="font-black text-yellow-300">Aveer Mohan</span>
          </div>
        </div>

        <button
          onClick={onToggleSound}
          className="p-2.5 rounded-2xl bg-purple-800/80 hover:bg-purple-700/80 border-2 border-purple-400/60 shadow-lg active:scale-95 transition-all cursor-pointer"
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <VolumeX className="w-5 h-5 text-rose-400" />
          )}
        </button>
      </div>

      {/* Main Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl my-6 z-10">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/30 to-rose-500/20 border border-amber-400/50 mb-4 shadow-md backdrop-blur-xs">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="text-xs font-black text-amber-200 uppercase tracking-widest">
            5 Distinct Worlds • Infinite Speed Run
          </span>
        </div>

        {/* Big Stylized Obby Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-arcade tracking-tight text-stroke-lg text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] leading-none mb-3">
          Play the Game of <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-400">
            3x3 Escape
          </span>
        </h1>

        <p className="text-sm sm:text-base font-bold text-purple-200 max-w-lg mb-6 drop-shadow-sm">
          Run across numbered platforms, jump over clouds and lava, solve multiplication questions
          to refill hearts, and unlock extreme speed multipliers!
        </p>

        {/* Player Name Tag */}
        <div className="mb-6 flex items-center justify-center gap-2 bg-purple-950/70 border-2 border-purple-400/50 px-4 py-2 rounded-2xl shadow-inner">
          <User className="w-4 h-4 text-pink-400" />
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={18}
                className="bg-purple-900 border border-purple-400 rounded-lg px-2 py-0.5 text-sm font-bold text-white outline-none w-36"
                autoFocus
              />
              <button
                onClick={handleNameSave}
                className="px-2.5 py-0.5 bg-emerald-500 text-white rounded-lg text-xs font-black hover:bg-emerald-400"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-yellow-300">{playerName}</span>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-xs text-purple-300 hover:text-white underline cursor-pointer font-bold"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* BIG PLAY NOW BUTTON */}
        <button
          onClick={() => {
            sound.playWin();
            onPlay();
          }}
          className="group relative px-12 sm:px-16 py-5 sm:py-6 rounded-3xl bg-gradient-to-b from-green-400 via-emerald-500 to-green-700 hover:from-green-300 hover:to-emerald-600 text-white font-black text-2xl sm:text-3xl font-arcade tracking-wider border-4 border-white shadow-[0_10px_25px_rgba(34,197,94,0.6)] active:scale-95 transition-all cursor-pointer flex items-center gap-3 btn-3d"
        >
          <Play className="w-8 h-8 fill-white group-hover:scale-110 transition-transform" />
          PLAY NOW
        </button>

        {/* Quick Features Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 w-full max-w-xl">
          <div className="p-3 rounded-2xl bg-purple-900/40 border border-purple-500/30 flex flex-col items-center text-center">
            <Globe2 className="w-5 h-5 text-sky-400 mb-1" />
            <span className="text-xs font-black text-white">5 Worlds</span>
            <span className="text-[10px] text-purple-300 font-semibold">Levels 1 to 400</span>
          </div>

          <div className="p-3 rounded-2xl bg-purple-900/40 border border-purple-500/30 flex flex-col items-center text-center">
            <Zap className="w-5 h-5 text-yellow-400 mb-1" />
            <span className="text-xs font-black text-white">Speed Trails</span>
            <span className="text-[10px] text-purple-300 font-semibold">x2 to x100,000+</span>
          </div>

          <div className="p-3 rounded-2xl bg-purple-900/40 border border-purple-500/30 flex flex-col items-center text-center">
            <Heart className="w-5 h-5 text-rose-400 mb-1 fill-rose-400" />
            <span className="text-xs font-black text-white">Heart Quiz</span>
            <span className="text-[10px] text-purple-300 font-semibold">Times Tables</span>
          </div>

          <div className="p-3 rounded-2xl bg-purple-900/40 border border-purple-500/30 flex flex-col items-center text-center">
            <Trophy className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-xs font-black text-white">Earn Wins</span>
            <span className="text-[10px] text-purple-300 font-semibold">Rebirth Temple</span>
          </div>
        </div>
      </div>

      {/* Footer Controls Tip & Creator Attribution */}
      <div className="w-full max-w-2xl text-center pb-2 z-10 space-y-1">
        <div className="text-xs font-semibold text-purple-300">
          Controls: <b className="text-white">WASD / Arrow Keys + Space</b> on Keyboard •{' '}
          <b className="text-white">Virtual Joystick & Jump Button</b> on Touch / iPad
        </div>
        <div className="text-[11px] font-bold text-purple-400">
          Made by <span className="text-amber-300 font-extrabold">Aveer Mohan</span> • Play the Game of 3x3 Escape
        </div>
      </div>
    </div>
  );
};
