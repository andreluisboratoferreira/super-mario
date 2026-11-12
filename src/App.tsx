import React, { useState, useEffect, useCallback } from 'react';
import {
  GameState,
  GameMode,
  GameStats,
  MathChallenge,
  MathDifficulty,
  PowerUp,
  PowerUpType,
} from './types/game';
import { sound } from './services/sound';
import { network } from './services/network';
import { generateMathChallenge } from './services/mathGenerator';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { MathChallengeModal } from './components/MathChallengeModal';
import { TitleModal } from './components/TitleModal';
import { GameOverModal } from './components/GameOverModal';
import { HelpModal } from './components/HelpModal';
import { BossVictoryModal } from './components/BossVictoryModal';
import { OnlineRoomModal } from './components/OnlineRoomModal';

const HIGH_SCORE_KEY = 'super_salto_matematico_highscore_v1';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [gameMode, setGameMode] = useState<GameMode>('2P_LOCAL'); // '1P' | '2P_LOCAL' | '2P_ONLINE'
  const [onlineRoomId, setOnlineRoomId] = useState<string | null>(null);
  const [myOnlineRole, setMyOnlineRole] = useState<'mario' | 'luigi'>('mario');
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState<boolean>(false);

  const [gameSessionId, setGameSessionId] = useState<number>(0);
  const [mathDifficulty, setMathDifficulty] = useState<MathDifficulty>('adaptativo');
  const [currentChallenge, setCurrentChallenge] = useState<MathChallenge | null>(null);
  const [activePowerUp, setActivePowerUp] = useState<PowerUp | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(sound.getIsMuted());
  const [isMusicMuted, setIsMusicMuted] = useState<boolean>(true);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(true);

  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(HIGH_SCORE_KEY);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    coins: 0,
    lives: 3,
    maxLives: 5,
    currentPlatform: 0,
    highestPlatform: 0,
    mathSolvedCount: 0,
    mathStreak: 0,
    highestStreak: 0,
    timeSeconds: 0,
    bossDefeated: false,
  });

  const [inputState, setInputState] = useState({
    left: false,
    right: false,
    jump: false,
  });

  // Keep powerup timer ticking
  useEffect(() => {
    if (!activePowerUp || gameState !== 'PLAYING') return;

    const interval = setInterval(() => {
      setActivePowerUp((prev) => {
        if (!prev) return null;
        const newTime = prev.timeLeft - 0.25;
        if (newTime <= 0) {
          return null;
        }
        return { ...prev, timeLeft: newTime };
      });
    }, 250);

    return () => clearInterval(interval);
  }, [activePowerUp, gameState]);

  // Update high score
  useEffect(() => {
    if (stats.score > highScore) {
      setHighScore(stats.score);
      try {
        localStorage.setItem(HIGH_SCORE_KEY, stats.score.toString());
      } catch {}
    }
  }, [stats.score, highScore]);

  // Global pause & shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING' && gameState !== 'PAUSED') return;

      if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Listen for online peer events (Math Trigger, Math Solved)
  useEffect(() => {
    if (gameMode !== '2P_ONLINE') return;

    const cleanupTrigger = network.on('MATH_TRIGGER', (data) => {
      const challenge = generateMathChallenge(data.platformIndex, mathDifficulty);
      setCurrentChallenge(challenge);
      setGameState('MATH_CHALLENGE');
      setInputState({ left: false, right: false, jump: false });
    });

    const cleanupSolved = network.on('MATH_SOLVED', (data) => {
      if (data.success) {
        sound.playMathSuccess();
        setStats((prev) => ({
          ...prev,
          coins: prev.coins + data.rewardCoins,
          lives: Math.min(prev.maxLives, prev.lives + 1),
          score: prev.score + 500,
        }));
      } else {
        sound.playMathFail();
        setStats((prev) => ({
          ...prev,
          lives: Math.max(0, prev.lives - 1),
        }));
      }
      setCurrentChallenge(null);
      setGameState('PLAYING');
    });

    return () => {
      cleanupTrigger();
      cleanupSolved();
    };
  }, [gameMode, mathDifficulty]);

  // Start Local Game
  const handleStartGame = () => {
    setStats({
      score: 0,
      coins: 0,
      lives: 3,
      maxLives: 5,
      currentPlatform: 0,
      highestPlatform: 0,
      mathSolvedCount: 0,
      mathStreak: 0,
      highestStreak: 0,
      timeSeconds: 0,
      bossDefeated: false,
    });
    setActivePowerUp(null);
    setCurrentChallenge(null);
    setInputState({ left: false, right: false, jump: false });
    setOnlineRoomId(null);
    setGameSessionId((prev) => prev + 1);
    setGameState('PLAYING');

    window.focus();
    sound.playPowerUp();
    if (!isMusicMuted) {
      sound.startMusic();
    }
  };

  // Start Online Game (PCs diferentes!)
  const handleStartOnlineGame = (roomId: string, character: 'mario' | 'luigi') => {
    setGameMode('2P_ONLINE');
    setOnlineRoomId(roomId);
    setMyOnlineRole(character);
    setIsOnlineModalOpen(false);

    setStats({
      score: 0,
      coins: 0,
      lives: 3,
      maxLives: 5,
      currentPlatform: 0,
      highestPlatform: 0,
      mathSolvedCount: 0,
      mathStreak: 0,
      highestStreak: 0,
      timeSeconds: 0,
      bossDefeated: false,
    });
    setActivePowerUp(null);
    setCurrentChallenge(null);
    setInputState({ left: false, right: false, jump: false });
    setGameSessionId((prev) => prev + 1);
    setGameState('PLAYING');

    window.focus();
    sound.playPowerUp();
    if (!isMusicMuted) {
      sound.startMusic();
    }
  };

  // Warp to Boss
  const handleWarpToBoss = () => {
    setStats((prev) => ({
      ...prev,
      currentPlatform: 295,
      highestPlatform: 295,
    }));
    setGameSessionId((prev) => prev + 1);
    sound.playBossRoar();
  };

  // Trigger Math Challenge (every 10 platforms)
  const handleTriggerMathChallenge = useCallback(
    (platformIndex: number) => {
      const challenge = generateMathChallenge(platformIndex, mathDifficulty);
      setCurrentChallenge(challenge);
      setGameState('MATH_CHALLENGE');
      setInputState({ left: false, right: false, jump: false });
      if (gameMode === '2P_ONLINE') {
        network.sendMathTrigger(platformIndex);
      }
    },
    [mathDifficulty, gameMode]
  );

  // Result of solving math challenge (10s timer)
  const handleSolveMathChallenge = (
    success: boolean,
    rewardPowerUp: PowerUpType,
    rewardCoins: number
  ) => {
    if (gameMode === '2P_ONLINE') {
      network.sendMathSolved(success, rewardPowerUp, rewardCoins);
    }

    if (success) {
      setStats((prev) => {
        const nextStreak = prev.mathStreak + 1;
        const newLives = Math.min(prev.maxLives, prev.lives + 1);
        const streakBonus = nextStreak * 100;
        return {
          ...prev,
          mathSolvedCount: prev.mathSolvedCount + 1,
          mathStreak: nextStreak,
          highestStreak: Math.max(prev.highestStreak, nextStreak),
          coins: prev.coins + rewardCoins,
          lives: newLives,
          score: prev.score + 500 + streakBonus,
        };
      });

      const POWERUP_NAMES: Record<PowerUpType, string> = {
        SUPER_JUMP: 'Super Salto',
        COIN_MAGNET: 'Ímã de Moedas',
        STAR_SHIELD: 'Escudo Estrela',
        DOUBLE_COINS: 'Moedas em Dobro',
        NONE: 'Bônus',
      };
      const POWERUP_ICONS: Record<PowerUpType, string> = {
        SUPER_JUMP: '🦘',
        COIN_MAGNET: '🧲',
        STAR_SHIELD: '⭐',
        DOUBLE_COINS: '💰',
        NONE: '✨',
      };

      if (rewardPowerUp !== 'NONE') {
        setActivePowerUp({
          type: rewardPowerUp,
          name: POWERUP_NAMES[rewardPowerUp],
          duration: 20,
          timeLeft: 20,
          color: '#facc15',
          icon: POWERUP_ICONS[rewardPowerUp],
        });
      }

      setCurrentChallenge(null);
      setGameState('PLAYING');
      window.focus();
    } else {
      setStats((prev) => {
        const nextLives = Math.max(0, prev.lives - 1);
        if (nextLives === 0) {
          sound.playGameOver();
          setTimeout(() => setGameState('GAME_OVER'), 400);
        }
        return {
          ...prev,
          mathStreak: 0,
          lives: nextLives,
        };
      });

      setCurrentChallenge(null);
      if (stats.lives > 1) {
        setGameState('PLAYING');
        window.focus();
      }
    }
  };

  const handleGameOver = () => {
    setGameState('GAME_OVER');
  };

  const handleVictory = () => {
    sound.playBossVictory();
    setStats((prev) => ({ ...prev, bossDefeated: true }));
    setGameState('VICTORY');
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  const handleToggleMusic = () => {
    const next = !isMusicMuted;
    setIsMusicMuted(next);
    sound.setMusicMuted(next);
  };

  const handleTogglePause = () => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
      window.focus();
    }
  };

  return (
    <div
      onClick={() => window.focus()}
      className="relative w-screen h-screen overflow-hidden bg-sky-400 font-sans select-none"
    >
      {/* HUD overlay */}
      {gameState !== 'TITLE' && (
        <HUD
          stats={stats}
          gameMode={gameMode}
          myOnlineRole={myOnlineRole}
          onlineRoomId={onlineRoomId}
          activePowerUp={activePowerUp}
          isMuted={isMuted}
          isMusicMuted={isMusicMuted}
          isPaused={gameState === 'PAUSED'}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
          onTogglePause={handleTogglePause}
          onOpenHelp={() => setIsHelpOpen(true)}
          onWarpToBoss={handleWarpToBoss}
        />
      )}

      {/* Main 2D Canvas Game */}
      <GameCanvas
        isPlaying={gameState === 'PLAYING' || gameState === 'PAUSED'}
        isPaused={gameState === 'PAUSED'}
        gameMode={gameMode}
        myOnlineRole={myOnlineRole}
        resetTrigger={gameSessionId}
        stats={stats}
        activePowerUp={activePowerUp}
        onUpdateStats={setStats}
        onTriggerMathChallenge={handleTriggerMathChallenge}
        onGameOver={handleGameOver}
        onVictory={handleVictory}
        inputState={inputState}
      />

      {/* Touch / Pointer Controls */}
      {showTouchControls && (gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <TouchControls
          onLeftStart={() => setInputState((prev) => ({ ...prev, left: true }))}
          onLeftEnd={() => setInputState((prev) => ({ ...prev, left: false }))}
          onRightStart={() => setInputState((prev) => ({ ...prev, right: true }))}
          onRightEnd={() => setInputState((prev) => ({ ...prev, right: false }))}
          onJumpStart={() => setInputState((prev) => ({ ...prev, jump: true }))}
          onJumpEnd={() => setInputState((prev) => ({ ...prev, jump: false }))}
        />
      )}

      {/* Title / Start Screen */}
      {gameState === 'TITLE' && (
        <TitleModal
          onStart={handleStartGame}
          gameMode={gameMode}
          onSelectGameMode={setGameMode}
          onOpenOnlineModal={() => setIsOnlineModalOpen(true)}
          mathDifficulty={mathDifficulty}
          onSelectDifficulty={setMathDifficulty}
          highScore={highScore}
        />
      )}

      {/* Online Room Modal (Different PCs) */}
      <OnlineRoomModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        onStartOnlineGame={handleStartOnlineGame}
      />

      {/* 10-Second Math Challenge Modal */}
      {gameState === 'MATH_CHALLENGE' && currentChallenge && (
        <MathChallengeModal
          challenge={currentChallenge}
          streak={stats.mathStreak}
          onSolve={handleSolveMathChallenge}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          stats={stats}
          highScore={highScore}
          onRestart={handleStartGame}
        />
      )}

      {/* Boss Victory Modal (Zero o Jogo!) */}
      {gameState === 'VICTORY' && (
        <BossVictoryModal
          stats={stats}
          highScore={highScore}
          onRestart={handleStartGame}
        />
      )}

      {/* Pause Screen Overlay */}
      {gameState === 'PAUSED' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-4 border-amber-400 pixel-shadow-lg text-center max-w-xs w-full text-slate-800 dark:text-slate-100">
            <h2 className="font-pixel text-lg text-amber-500 mb-2">JOGO PAUSADO</h2>
            <p className="text-xs text-slate-500 mb-5">Pressione P ou o botão abaixo para continuar</p>
            <div className="space-y-2">
              <button
                onClick={handleTogglePause}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Continuar
              </button>
              <button
                onClick={() => {
                  network.disconnect();
                  setGameState('TITLE');
                }}
                className="w-full py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Voltar ao Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help / Rules Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        mathDifficulty={mathDifficulty}
        onSelectDifficulty={setMathDifficulty}
      />
    </div>
  );
}
