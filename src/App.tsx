import React, { useEffect, useRef, useState } from 'react';
import { ThreeGameEngine } from './game/threeScene';
import { PlayerState, TrailItem, SkinItem } from './types/game';
import { TRAILS, SKINS, WORLDS } from './data/gameData';
import { HUD } from './components/HUD';
import { HomeScreen } from './components/HomeScreen';
import { WorldSelectModal } from './components/WorldSelectModal';
import { HeartQuizModal } from './components/HeartQuizModal';
import { TrailsModal } from './components/TrailsModal';
import { SkinsModal } from './components/SkinsModal';
import { RebirthModal } from './components/RebirthModal';
import { RewardsModal } from './components/RewardsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { sound } from './utils/audio';
import { calculateLevelAndProgress } from './utils/format';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'escape_3x3_player_save_v1';

const DEFAULT_STATE: PlayerState = {
  name: 'SpeedyWizard57',
  level: 1,
  speed: 120,
  wins: 0,
  hearts: 5,
  maxHearts: 5,
  currentWorld: 1,
  currentStage: 0, // 0 = Lobby
  highestWorld: 1,
  highestStage: 1,
  equippedTrailId: 'trail_default',
  ownedTrailIds: ['trail_default'],
  equippedSkinId: 'skin_wizard',
  ownedSkinIds: ['skin_wizard'],
  rebirths: 0,
  rebirthMultiplier: 1,
  streakMultiplier: 1.1,
  streakCount: 1,
  soundEnabled: true,
  totalDistanceRun: 0,
};

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ThreeGameEngine | null>(null);

  // Load saved state or default
  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch {
      // fallback
    }
    return DEFAULT_STATE;
  });

  // Game UI flow state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<
    'none' | 'world_select' | 'heart_quiz' | 'trails' | 'skins' | 'rebirth' | 'rewards' | 'leaderboard'
  >('none');
  const [isMandatoryQuiz, setIsMandatoryQuiz] = useState<boolean>(false);

  // Save to localStorage whenever playerState updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playerState));
    } catch {
      // ignore
    }
  }, [playerState]);

  // Audio mute/unmute
  useEffect(() => {
    sound.enabled = playerState.soundEnabled;
  }, [playerState.soundEnabled]);

  // Mount Three.js game engine
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new ThreeGameEngine(mountRef.current, playerState, {
      onSpeedGain: (amount) => {
        setPlayerState((prev) => {
          const mult = prev.rebirthMultiplier * (prev.streakMultiplier || 1);
          const newSpeed = prev.speed + amount * mult;
          const { level } = calculateLevelAndProgress(newSpeed);

          // Update player model in 3D scene
          if (engineRef.current && level !== prev.level) {
            engineRef.current.updatePlayerInfo(prev.name, level);
          }

          return {
            ...prev,
            speed: newSpeed,
            level,
          };
        });
      },

      onWinStage: (stage, winsEarned) => {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#facc15', '#ec4899', '#38bdf8', '#22c55e', '#a855f7'],
        });

        setPlayerState((prev) => {
          const nextStage = stage + 1;
          const nextWins = prev.wins + winsEarned;
          const nextStreak = Math.min(prev.streakMultiplier + 0.05, 5.0);

          return {
            ...prev,
            wins: nextWins,
            currentStage: nextStage,
            highestStage: Math.max(prev.highestStage, nextStage),
            streakMultiplier: nextStreak,
            streakCount: prev.streakCount + 1,
          };
        });
      },

      onHeartLost: (lossCount) => {
        setPlayerState((prev) => {
          const remainingHearts = Math.max(0, prev.hearts - lossCount);
          if (remainingHearts === 0) {
            // Must solve multiplication quiz to revive!
            setIsMandatoryQuiz(true);
            setActiveModal('heart_quiz');
          }
          return {
            ...prev,
            hearts: remainingHearts,
            streakMultiplier: 1.0, // reset streak on fall
          };
        });
      },

      onOpenWorldSelect: () => {
        setActiveModal('world_select');
      },

      onOpenStageSelect: () => {
        // Teleport to current highest stage
        if (engineRef.current) {
          engineRef.current.loadWorldOrStage(playerState.currentWorld, Math.max(1, playerState.currentStage));
        }
      },

      onLobbyEntered: () => {
        setPlayerState((prev) => ({ ...prev, currentStage: 0 }));
      },
    });

    engineRef.current = engine;

    // Apply equipped trail
    const currTrail = TRAILS.find((t) => t.id === playerState.equippedTrailId) || TRAILS[0];
    engine.setTrail(currTrail);

    // Apply equipped skin
    const currSkin = SKINS.find((s) => s.id === playerState.equippedSkinId) || SKINS[0];
    engine.updatePlayerInfo(playerState.name, playerState.level, currSkin);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []); // Run once on mount

  // Sync Trail changes to 3D scene
  const handleEquipTrail = (trail: TrailItem) => {
    setPlayerState((prev) => ({
      ...prev,
      equippedTrailId: trail.id,
    }));
    if (engineRef.current) {
      engineRef.current.setTrail(trail);
    }
  };

  const handleBuyTrail = (trail: TrailItem) => {
    if (playerState.wins < trail.price) return;
    sound.playWin();
    confetti({ particleCount: 50, spread: 60 });

    setPlayerState((prev) => ({
      ...prev,
      wins: prev.wins - trail.price,
      ownedTrailIds: [...prev.ownedTrailIds, trail.id],
      equippedTrailId: trail.id,
    }));

    if (engineRef.current) {
      engineRef.current.setTrail(trail);
    }
  };

  // Sync Skin changes to 3D scene
  const handleEquipSkin = (skin: SkinItem) => {
    setPlayerState((prev) => ({
      ...prev,
      equippedSkinId: skin.id,
    }));
    if (engineRef.current) {
      engineRef.current.updatePlayerInfo(playerState.name, playerState.level, skin);
    }
  };

  const handleBuySkin = (skin: SkinItem) => {
    if (playerState.wins < skin.price) return;
    sound.playWin();
    confetti({ particleCount: 50, spread: 60 });

    setPlayerState((prev) => ({
      ...prev,
      wins: prev.wins - skin.price,
      ownedSkinIds: [...prev.ownedSkinIds, skin.id],
      equippedSkinId: skin.id,
    }));

    if (engineRef.current) {
      engineRef.current.updatePlayerInfo(playerState.name, playerState.level, skin);
    }
  };

  // World Selection
  const handleSelectWorld = (worldId: number) => {
    setPlayerState((prev) => ({
      ...prev,
      currentWorld: worldId,
      currentStage: 1,
    }));
    if (engineRef.current) {
      engineRef.current.loadWorldOrStage(worldId, 1);
    }
    setActiveModal('none');
  };

  // Rebirth Handler
  const handleConfirmRebirth = () => {
    sound.playWin();
    confetti({
      particleCount: 150,
      spread: 100,
      colors: ['#f59e0b', '#fbbf24', '#fef08a'],
    });

    setPlayerState((prev) => ({
      ...prev,
      rebirths: prev.rebirths + 1,
      rebirthMultiplier: prev.rebirthMultiplier + 5,
      currentStage: 0, // return to lobby
    }));

    if (engineRef.current) {
      engineRef.current.loadWorldOrStage(1, 0);
    }
    setActiveModal('none');
  };

  // Heart Quiz Refill
  const handleHeartQuizSuccess = () => {
    setPlayerState((prev) => ({
      ...prev,
      hearts: prev.maxHearts,
      streakMultiplier: 1.25, // Bonus streak boost for doing math!
    }));
    setIsMandatoryQuiz(false);
    setActiveModal('none');
  };

  // Daily Rewards Claim
  const handleClaimReward = (wins: number, speed: number) => {
    setPlayerState((prev) => {
      const newSpeed = prev.speed + speed;
      const { level } = calculateLevelAndProgress(newSpeed);
      return {
        ...prev,
        wins: prev.wins + wins,
        speed: newSpeed,
        level,
      };
    });
  };

  // Return to Lobby
  const handleReturnToLobby = () => {
    setPlayerState((prev) => ({
      ...prev,
      currentStage: 0,
    }));
    if (engineRef.current) {
      engineRef.current.loadWorldOrStage(playerState.currentWorld, 0);
    }
  };

  // Joystick & Jump Controls
  const handleJoystickMove = (dx: number, dy: number) => {
    if (engineRef.current) {
      engineRef.current.setJoystick(dx, dy);
    }
  };

  const handleJump = () => {
    if (engineRef.current) {
      engineRef.current.requestJump();
    }
  };

  // Player Name Change
  const handleUpdateName = (newName: string) => {
    setPlayerState((prev) => ({
      ...prev,
      name: newName,
    }));
    if (engineRef.current) {
      const skin = SKINS.find((s) => s.id === playerState.equippedSkinId);
      engineRef.current.updatePlayerInfo(newName, playerState.level, skin);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none touch-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Home Screen (Title with PLAY NOW button) */}
      {!isPlaying && (
        <HomeScreen
          playerName={playerState.name}
          onUpdatePlayerName={handleUpdateName}
          onPlay={() => setIsPlaying(true)}
          soundEnabled={playerState.soundEnabled}
          onToggleSound={() =>
            setPlayerState((p) => ({ ...p, soundEnabled: !p.soundEnabled }))
          }
        />
      )}

      {/* Main Interactive Game HUD */}
      {isPlaying && (
        <HUD
          playerState={playerState}
          isInLobby={playerState.currentStage === 0}
          onOpenWorldSelect={() => setActiveModal('world_select')}
          onOpenTrails={() => setActiveModal('trails')}
          onOpenSkins={() => setActiveModal('skins')}
          onOpenRebirth={() => setActiveModal('rebirth')}
          onOpenRewards={() => setActiveModal('rewards')}
          onOpenLeaderboard={() => setActiveModal('leaderboard')}
          onOpenHeartQuiz={() => {
            setIsMandatoryQuiz(false);
            setActiveModal('heart_quiz');
          }}
          onReturnToLobby={handleReturnToLobby}
          onToggleSound={() =>
            setPlayerState((p) => ({ ...p, soundEnabled: !p.soundEnabled }))
          }
          onJoystickMove={handleJoystickMove}
          onJump={handleJump}
          onUpdateName={handleUpdateName}
        />
      )}

      {/* Active Modals */}
      {activeModal === 'world_select' && (
        <WorldSelectModal
          currentWorld={playerState.currentWorld}
          playerLevel={playerState.level}
          onSelectWorld={handleSelectWorld}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'heart_quiz' && (
        <HeartQuizModal
          onSuccess={handleHeartQuizSuccess}
          onClose={() => setActiveModal('none')}
          isMandatory={isMandatoryQuiz}
        />
      )}

      {activeModal === 'trails' && (
        <TrailsModal
          wins={playerState.wins}
          equippedTrailId={playerState.equippedTrailId}
          ownedTrailIds={playerState.ownedTrailIds}
          onBuyTrail={handleBuyTrail}
          onEquipTrail={handleEquipTrail}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'skins' && (
        <SkinsModal
          wins={playerState.wins}
          equippedSkinId={playerState.equippedSkinId}
          ownedSkinIds={playerState.ownedSkinIds}
          onBuySkin={handleBuySkin}
          onEquipSkin={handleEquipSkin}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'rebirth' && (
        <RebirthModal
          level={playerState.level}
          rebirths={playerState.rebirths}
          rebirthMultiplier={playerState.rebirthMultiplier}
          onConfirmRebirth={handleConfirmRebirth}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'rewards' && (
        <RewardsModal
          onClaimReward={handleClaimReward}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'leaderboard' && (
        <LeaderboardModal
          playerName={playerState.name}
          playerSpeed={playerState.speed}
          playerWins={playerState.wins}
          onClose={() => setActiveModal('none')}
        />
      )}
    </div>
  );
}
