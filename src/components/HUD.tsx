import React, { useRef, useState, useEffect } from 'react';
import { PlayerState } from '../types/game';
import { formatNumber, calculateLevelAndProgress } from '../utils/format';
import { sound } from '../utils/audio';
import {
  Zap,
  Heart,
  Trophy,
  RefreshCw,
  Sparkles,
  Shirt,
  Gift,
  Volume2,
  VolumeX,
  Globe2,
  Home,
  Crown,
  Edit2,
  Flame,
} from 'lucide-react';

interface HUDProps {
  playerState: PlayerState;
  isInLobby: boolean;
  onOpenWorldSelect: () => void;
  onOpenTrails: () => void;
  onOpenSkins: () => void;
  onOpenRebirth: () => void;
  onOpenRewards: () => void;
  onOpenLeaderboard: () => void;
  onOpenHeartQuiz: () => void;
  onReturnToLobby: () => void;
  onToggleSound: () => void;
  onJoystickMove: (dx: number, dy: number) => void;
  onJump: () => void;
  onUpdateName: (name: string) => void;
}

export const HUD: React.FC<HUDProps> = ({
  playerState,
  isInLobby,
  onOpenWorldSelect,
  onOpenTrails,
  onOpenSkins,
  onOpenRebirth,
  onOpenRewards,
  onOpenLeaderboard,
  onOpenHeartQuiz,
  onReturnToLobby,
  onToggleSound,
  onJoystickMove,
  onJump,
  onUpdateName,
}) => {
  // Level & progress calculations
  const { level, progressRatio, currentSpeed, targetSpeed } = calculateLevelAndProgress(
    playerState.speed
  );

  // Edit name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameVal, setEditNameVal] = useState(playerState.name);

  // Joystick touch tracking
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickThumb, setJoystickThumb] = useState({ x: 0, y: 0 });

  const handleJoystickStart = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    setJoystickActive(true);
    handleJoystickMove(clientX, clientY);
  };

  const handleJoystickMove = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setJoystickThumb({ x: dx, y: dy });
    // Normalize to -1 .. 1
    onJoystickMove(dx / maxRadius, dy / maxRadius);
  };

  const handleJoystickEnd = () => {
    setJoystickActive(false);
    setJoystickThumb({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  // Keyboard shortcut helpers
  const handleSaveName = () => {
    if (editNameVal.trim().length > 0) {
      onUpdateName(editNameVal.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between p-2 sm:p-4">
      {/* ================= TOP BAR ================= */}
      <div className="flex items-start justify-between w-full pointer-events-auto gap-2">
        {/* Top Left: Avatar pill with level and name */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-950/90 border-3 border-amber-400/80 rounded-2xl px-3 py-1.5 shadow-xl backdrop-blur-xs">
            {/* Avatar Head Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 border-2 border-white flex items-center justify-center text-xl shadow-md">
              🎩
            </div>

            {/* Name & Level */}
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editNameVal}
                    onChange={(e) => setEditNameVal(e.target.value)}
                    maxLength={16}
                    className="bg-purple-950 border border-amber-400 rounded px-1.5 py-0.5 text-xs text-white font-bold w-28 outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-2 py-0.5 bg-emerald-500 rounded text-[10px] font-black text-white hover:bg-emerald-400"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-base text-yellow-300 drop-shadow-sm font-arcade">
                    {playerState.name}
                  </span>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setIsEditingName(true);
                    }}
                    className="text-purple-300 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="text-[11px] font-black text-amber-200">
                Level {level} {playerState.rebirths > 0 && `(R${playerState.rebirths})`}
              </div>
            </div>
          </div>
        </div>

        {/* Top Center: Speed & Hearts Counter */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Speed Counter */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-slate-900/90 to-indigo-950/90 border-3 border-cyan-400 rounded-2xl px-3 sm:px-4 py-1.5 shadow-xl">
            <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
            <div>
              <span className="text-[10px] uppercase font-black text-cyan-300 block leading-tight">
                Speed
              </span>
              <span className="font-black text-base sm:text-xl text-white font-arcade tracking-wide">
                {formatNumber(playerState.speed)}
              </span>
            </div>
          </div>

          {/* Hearts Counter */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenHeartQuiz();
            }}
            title="Refill Hearts"
            className={`flex items-center gap-2 bg-gradient-to-r from-rose-950/90 to-pink-950/90 border-3 ${
              playerState.hearts <= 1
                ? 'border-rose-500 animate-bounce'
                : 'border-rose-400'
            } rounded-2xl px-3 sm:px-4 py-1.5 shadow-xl active:scale-95 transition-all cursor-pointer`}
          >
            <Heart
              className={`w-5 h-5 ${
                playerState.hearts <= 1
                  ? 'text-rose-500 fill-rose-500'
                  : 'text-rose-400 fill-rose-400'
              }`}
            />
            <div>
              <span className="text-[10px] uppercase font-black text-rose-300 block leading-tight">
                Hearts
              </span>
              <span className="font-black text-base sm:text-xl text-white font-arcade tracking-wide">
                {playerState.hearts}/{playerState.maxHearts}
              </span>
            </div>
          </button>
        </div>

        {/* Top Right: Sound and Quick Teleport */}
        <div className="flex items-center gap-2">
          {!isInLobby && (
            <button
              onClick={() => {
                sound.playClick();
                onReturnToLobby();
              }}
              className="px-3 py-2 bg-purple-700/90 hover:bg-purple-600 border-2 border-purple-300 rounded-2xl text-white font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95"
            >
              <Home className="w-4 h-4" /> Lobby
            </button>
          )}

          <button
            onClick={onToggleSound}
            className="p-2.5 rounded-2xl bg-purple-900/90 hover:bg-purple-800 border-2 border-purple-400/80 text-white shadow-lg active:scale-95 cursor-pointer"
          >
            {playerState.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-rose-400" />
            )}
          </button>
        </div>
      </div>

      {/* ================= SIDEBARS (LEFT & RIGHT) ================= */}
      <div className="flex items-center justify-between w-full pointer-events-none my-auto">
        {/* Left Side Buttons */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Wins Badge */}
          <div className="flex items-center gap-2 bg-amber-950/80 border-2 border-amber-400/80 rounded-2xl px-3 py-1.5 shadow-lg">
            <Trophy className="w-4 h-4 text-amber-300" />
            <div>
              <span className="text-[9px] uppercase font-black text-amber-300 block leading-none">
                Wins
              </span>
              <span className="font-black text-xs sm:text-sm text-yellow-300 font-arcade">
                {formatNumber(playerState.wins)}
              </span>
            </div>
          </div>

          {/* Rebirth Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenRebirth();
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 border-2 border-amber-300 rounded-2xl px-3 py-2 shadow-lg active:scale-95 text-white font-black text-xs transition-all cursor-pointer btn-3d"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Rebirth</span>
          </button>

          {/* Trails Shop Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenTrails();
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-2 border-purple-300 rounded-2xl px-3 py-2 shadow-lg active:scale-95 text-white font-black text-xs transition-all cursor-pointer btn-3d"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Trails</span>
          </button>

          {/* Skins Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenSkins();
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 border-2 border-pink-300 rounded-2xl px-3 py-2 shadow-lg active:scale-95 text-white font-black text-xs transition-all cursor-pointer btn-3d"
          >
            <Shirt className="w-4 h-4" />
            <span>Skins</span>
          </button>

          {/* Rewards Gift Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenRewards();
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-2 border-cyan-300 rounded-2xl px-3 py-2 shadow-lg active:scale-95 text-white font-black text-xs transition-all cursor-pointer btn-3d"
          >
            <Gift className="w-4 h-4 text-yellow-300" />
            <span>Rewards</span>
          </button>
        </div>

        {/* Right Side Buttons */}
        <div className="flex flex-col gap-2 pointer-events-auto items-end">
          {/* Worlds Select Portal Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenWorldSelect();
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 border-2 border-sky-300 rounded-2xl px-3.5 py-2 shadow-lg active:scale-95 text-white font-black text-xs transition-all cursor-pointer btn-3d"
          >
            <Globe2 className="w-4 h-4 text-yellow-300" />
            <span>Worlds</span>
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenLeaderboard();
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 border-2 border-amber-300 rounded-2xl px-3.5 py-2 shadow-lg active:scale-95 text-white font-black text-xs transition-all cursor-pointer btn-3d"
          >
            <Crown className="w-4 h-4 text-white" />
            <span>Top Speed</span>
          </button>

          {/* Boost Multiplier Indicator */}
          <div className="bg-purple-950/80 border-2 border-purple-400/80 rounded-2xl px-3 py-1.5 shadow-lg text-right">
            <span className="text-[9px] uppercase font-black text-purple-300 block leading-none">
              Active Multiplier
            </span>
            <span className="font-black text-xs sm:text-sm text-pink-400 font-arcade">
              ×{formatNumber(playerState.rebirthMultiplier * (playerState.streakMultiplier || 1))}
            </span>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM BAR ================= */}
      <div className="w-full flex items-end justify-between pointer-events-none pb-1 sm:pb-2">
        {/* Bottom Left: Virtual Joystick for Touch / Mobile / iPad */}
        <div className="pointer-events-auto">
          <div
            ref={joystickRef}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              handleJoystickStart(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (joystickActive) {
                handleJoystickMove(e.clientX, e.clientY);
              }
            }}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              handleJoystickEnd();
            }}
            onPointerCancel={handleJoystickEnd}
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-900/60 border-4 border-slate-700/80 backdrop-blur-xs flex items-center justify-center touch-none cursor-pointer shadow-2xl active:border-cyan-400/80"
          >
            {/* Center thumb stick */}
            <div
              style={{
                transform: `translate(${joystickThumb.x}px, ${joystickThumb.y}px)`,
              }}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-green-300 border-3 border-white shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-transform duration-75 flex items-center justify-center"
            >
              <div className="w-4 h-4 rounded-full bg-white/70" />
            </div>
          </div>
        </div>

        {/* Bottom Center: Streak Multiplier & Level Bar */}
        <div className="flex-1 max-w-sm sm:max-w-md mx-2 sm:mx-4 flex flex-col items-center gap-1.5 pointer-events-auto">
          {/* Streak Banner */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-orange-500/60 text-[11px] font-black text-amber-300 shadow-md">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span>Streak Multiplier: {playerState.streakMultiplier.toFixed(2)}x</span>
            <span className="text-slate-400">•</span>
            <span className="text-white">
              {isInLobby ? '🎃 Lobby' : `Stage ${playerState.currentStage}`}
            </span>
          </div>

          {/* Level Progress Bar */}
          <div className="w-full bg-slate-950/90 border-2 border-slate-700 rounded-xl p-1 shadow-lg">
            <div className="flex items-center justify-between px-2 text-[10px] sm:text-xs font-black text-slate-300 mb-0.5">
              <span>Level {level}</span>
              <span>
                {formatNumber(currentSpeed)} / {formatNumber(targetSpeed)} Speed
              </span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
              <div
                style={{ width: `${Math.max(5, progressRatio * 100)}%` }}
                className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500 transition-all duration-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Bottom Right: Big Jump Button */}
        <div className="pointer-events-auto">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onJump();
            }}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-b from-purple-500 via-pink-500 to-rose-600 hover:from-purple-400 hover:to-pink-500 active:scale-90 border-4 border-white shadow-[0_8px_20px_rgba(236,72,153,0.5)] flex flex-col items-center justify-center text-white cursor-pointer transition-all btn-3d"
          >
            <div className="text-2xl sm:text-3xl font-black">🦘</div>
            <span className="text-xs sm:text-sm font-black font-arcade uppercase tracking-wider">
              JUMP
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
