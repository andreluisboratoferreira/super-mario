import React, { useRef, useEffect, useCallback } from 'react';
import {
  PlayerCharacter,
  Platform,
  Coin,
  QuestionBlock,
  Enemy,
  Particle,
  FloatingText,
  PowerUp,
  PowerUpType,
  GameStats,
  GameMode,
  Boss,
  Fireball,
} from '../types/game';
import { sound } from '../services/sound';
import { network } from '../services/network';

interface GameCanvasProps {
  isPlaying: boolean;
  isPaused: boolean;
  gameMode: GameMode;
  myOnlineRole?: 'mario' | 'luigi';
  resetTrigger?: number;
  stats: GameStats;
  activePowerUp: PowerUp | null;
  onUpdateStats: (updater: (prev: GameStats) => GameStats) => void;
  onTriggerMathChallenge: (platformIndex: number) => void;
  onGameOver: () => void;
  onVictory: () => void;
  inputState: {
    left: boolean;
    right: boolean;
    jump: boolean;
    p2Left?: boolean;
    p2Right?: boolean;
    p2Jump?: boolean;
  };
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  isPlaying,
  isPaused,
  gameMode,
  myOnlineRole = 'mario',
  resetTrigger = 0,
  stats,
  activePowerUp,
  onUpdateStats,
  onTriggerMathChallenge,
  onGameOver,
  onVictory,
  inputState,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync props to refs to avoid ANY stale closure
  const inputPropRef = useRef(inputState);
  inputPropRef.current = inputState;

  const powerUpRef = useRef(activePowerUp);
  powerUpRef.current = activePowerUp;

  const onUpdateStatsRef = useRef(onUpdateStats);
  onUpdateStatsRef.current = onUpdateStats;

  const onTriggerMathChallengeRef = useRef(onTriggerMathChallenge);
  onTriggerMathChallengeRef.current = onTriggerMathChallenge;

  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  const onVictoryRef = useRef(onVictory);
  onVictoryRef.current = onVictory;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const gameModeRef = useRef(gameMode);
  gameModeRef.current = gameMode;

  const myRoleRef = useRef(myOnlineRole);
  myRoleRef.current = myOnlineRole;

  // Real-time keyboard tracking
  const keysRef = useRef<{
    p1Left: boolean;
    p1Right: boolean;
    p1Jump: boolean;
    p2Left: boolean;
    p2Right: boolean;
    p2Jump: boolean;
  }>({
    p1Left: false,
    p1Right: false,
    p1Jump: false,
    p2Left: false,
    p2Right: false,
    p2Jump: false,
  });

  // Mutable Game Engine State
  const stateRef = useRef<{
    mario: PlayerCharacter;
    luigi: PlayerCharacter;
    platforms: Platform[];
    coins: Coin[];
    blocks: QuestionBlock[];
    enemies: Enemy[];
    particles: Particle[];
    floatingTexts: FloatingText[];
    boss: Boss | null;
    camera: { x: number; y: number };
    maxPlatformGenerated: number;
    highestReachedPlatform: number;
    lastMilestoneTriggered: number;
    lastJumpP1: boolean;
    lastJumpP2: boolean;
    gameTime: number;
    victoryTriggered: boolean;
    lastSyncTime: number;
  }>({
    mario: {
      id: 'mario',
      name: 'Mario',
      x: 100,
      y: 408,
      width: 32,
      height: 42,
      vx: 0,
      vy: 0,
      isGrounded: true,
      facing: 'right',
      isJumping: false,
      jumpHoldTimer: 0,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      invincibleTimer: 0,
      runFrame: 0,
      animTimer: 0,
      currentPlatformIndex: 0,
      score: 0,
      isDead: false,
    },
    luigi: {
      id: 'luigi',
      name: 'Luigi',
      x: 140,
      y: 404,
      width: 32,
      height: 46,
      vx: 0,
      vy: 0,
      isGrounded: true,
      facing: 'right',
      isJumping: false,
      jumpHoldTimer: 0,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      invincibleTimer: 0,
      runFrame: 0,
      animTimer: 0,
      currentPlatformIndex: 0,
      score: 0,
      isDead: false,
    },
    platforms: [],
    coins: [],
    blocks: [],
    enemies: [],
    particles: [],
    floatingTexts: [],
    boss: null,
    camera: { x: 0, y: 0 },
    maxPlatformGenerated: 0,
    highestReachedPlatform: 0,
    lastMilestoneTriggered: 0,
    lastJumpP1: false,
    lastJumpP2: false,
    gameTime: 0,
    victoryTriggered: false,
    lastSyncTime: 0,
  });

  // Spawn initial world
  const initWorld = useCallback((targetStartPlat: number = 0) => {
    const s = stateRef.current;
    s.platforms = [];
    s.coins = [];
    s.blocks = [];
    s.enemies = [];
    s.particles = [];
    s.floatingTexts = [];
    s.camera = { x: 0, y: 0 };
    s.highestReachedPlatform = targetStartPlat;
    s.lastMilestoneTriggered = Math.floor(targetStartPlat / 10) * 10;
    s.lastJumpP1 = false;
    s.lastJumpP2 = false;
    s.gameTime = 0;
    s.boss = null;
    s.victoryTriggered = false;
    s.lastSyncTime = 0;

    // Platform 0: Starting meadow ground
    s.platforms.push({
      id: 0,
      index: 0,
      x: 40,
      y: 450,
      width: 480,
      height: 80,
      type: 'NORMAL',
      initialX: 40,
      initialY: 450,
    });

    for (let i = 0; i < 5; i++) {
      s.coins.push({
        id: Math.random(),
        x: 180 + i * 45,
        y: 400,
        width: 20,
        height: 20,
        collected: false,
        value: 100,
        animFrame: i * 0.5,
      });
    }

    s.blocks.push({
      id: 1,
      x: 340,
      y: 320,
      width: 34,
      height: 34,
      hit: false,
      bounceOffset: 0,
      hasCoin: true,
    });

    // Position Mario and Luigi on Platform 0
    s.mario.x = 100;
    s.mario.y = 450 - s.mario.height;
    s.mario.vx = 0;
    s.mario.vy = 0;
    s.mario.isGrounded = true;
    s.mario.currentPlatformIndex = 0;
    s.mario.facing = 'right';
    s.mario.isDead = false;

    s.luigi.x = 140;
    s.luigi.y = 450 - s.luigi.height;
    s.luigi.vx = 0;
    s.luigi.vy = 0;
    s.luigi.isGrounded = true;
    s.luigi.currentPlatformIndex = 0;
    s.luigi.facing = 'right';
    s.luigi.isDead = false;

    s.maxPlatformGenerated = 0;

    if (targetStartPlat >= 295) {
      generatePlatformsUpTo(300);
      const plat295 = s.platforms.find((p) => p.index >= 295) || s.platforms[s.platforms.length - 1];
      s.mario.x = plat295.x + 30;
      s.mario.y = plat295.y - s.mario.height;
      s.mario.currentPlatformIndex = plat295.index;
      s.luigi.x = plat295.x + 70;
      s.luigi.y = plat295.y - s.luigi.height;
      s.luigi.currentPlatformIndex = plat295.index;
      s.camera.x = plat295.x - 200;
    } else {
      generatePlatformsUpTo(15);
    }
  }, []);

  const generatePlatformsUpTo = (targetIndex: number) => {
    const s = stateRef.current;
    let lastPlat = s.platforms[s.platforms.length - 1];

    while (s.maxPlatformGenerated < Math.min(300, targetIndex)) {
      s.maxPlatformGenerated++;
      const nextIdx = s.maxPlatformGenerated;
      const isMilestone = nextIdx % 10 === 0 && nextIdx < 300;
      const isBossArena = nextIdx === 300;

      if (isBossArena) {
        const arenaX = lastPlat.x + lastPlat.width + 120;
        const arenaY = 440;

        s.platforms.push({
          id: 300,
          index: 300,
          x: arenaX,
          y: arenaY,
          width: 550,
          height: 50,
          type: 'BOSS_BRIDGE',
          initialX: arenaX,
          initialY: arenaY,
        });

        s.platforms.push({
          id: 301,
          index: 301,
          x: arenaX + 550,
          y: arenaY,
          width: 250,
          height: 60,
          type: 'CASTLE_FLOOR',
          initialX: arenaX + 550,
          initialY: arenaY,
        });

        s.boss = {
          x: arenaX + 380,
          y: arenaY - 68,
          width: 64,
          height: 68,
          vx: -1.2,
          vy: 0,
          hp: 3,
          maxHp: 3,
          isGrounded: true,
          facing: 'left',
          state: 'idle',
          attackTimer: 0,
          jumpTimer: 2.0,
          fireTimer: 2.5,
          isVulnerable: false,
          fireballs: [],
          arenaStartX: arenaX,
          axeX: arenaX + 535,
          axeY: arenaY - 45,
          bridgeCollapsed: false,
        };

        sound.playBossRoar();
        break;
      }

      const gapX = isMilestone ? 140 : 120 + Math.random() * 80;
      const deltaY = (Math.random() - 0.5) * 85;
      const nextY = Math.max(220, Math.min(490, lastPlat.y + deltaY));
      const nextX = lastPlat.x + lastPlat.width + gapX;

      let platWidth = 140 + Math.random() * 70;
      let platType: Platform['type'] = 'NORMAL';

      if (isMilestone) {
        platWidth = 320;
        platType = 'MILESTONE';
      } else {
        const rand = Math.random();
        if (rand < 0.2) {
          platType = 'MOVING_H';
        } else if (rand < 0.35) {
          platType = 'BOUNCY';
          platWidth = 120;
        } else if (rand < 0.48 && nextIdx > 4) {
          platType = 'CRUMBLING';
          platWidth = 110;
        }
      }

      const newPlat: Platform = {
        id: nextIdx,
        index: nextIdx,
        x: nextX,
        y: nextY,
        width: platWidth,
        height: isMilestone ? 60 : 42,
        type: platType,
        initialX: nextX,
        initialY: nextY,
        rangeX: platType === 'MOVING_H' ? 65 : 0,
        speed: 1.2 + Math.random() * 0.7,
        direction: 1,
        clearedMath: false,
      };

      s.platforms.push(newPlat);
      lastPlat = newPlat;

      if (!isMilestone) {
        const coinCount = Math.floor(2 + Math.random() * 3);
        const startCoinX = nextX + 25;
        const spacing = (platWidth - 50) / Math.max(1, coinCount - 1);

        for (let c = 0; c < coinCount; c++) {
          s.coins.push({
            id: Math.random(),
            x: startCoinX + c * spacing,
            y: nextY - 45 - (c % 2 === 1 ? 25 : 0),
            width: 20,
            height: 20,
            collected: false,
            value: 100,
            animFrame: Math.random() * 5,
          });
        }

        if (Math.random() < 0.45 && platWidth > 130) {
          s.blocks.push({
            id: Math.random(),
            x: nextX + platWidth / 2 - 17,
            y: nextY - 105,
            width: 34,
            height: 34,
            hit: false,
            bounceOffset: 0,
            hasCoin: true,
          });
        }

        if (Math.random() < 0.35 && platWidth >= 145 && nextIdx > 2) {
          s.enemies.push({
            id: Math.random(),
            x: nextX + platWidth / 2,
            y: nextY - 30,
            width: 30,
            height: 30,
            vx: 1.1 * (Math.random() > 0.5 ? 1 : -1),
            minX: nextX + 8,
            maxX: nextX + platWidth - 38,
            isSquashed: false,
            squashTimer: 0,
            type: 'goomba',
          });
        }
      } else {
        for (let c = 0; c < 5; c++) {
          s.coins.push({
            id: Math.random(),
            x: nextX + 40 + c * 35,
            y: nextY - 50,
            width: 20,
            height: 20,
            collected: false,
            value: 100,
            animFrame: c * 0.4,
          });
        }
      }
    }
  };

  useEffect(() => {
    initWorld(stats.currentPlatform >= 295 ? 295 : 0);
  }, [initWorld, resetTrigger]);

  // Online peer events listener
  useEffect(() => {
    if (gameMode !== '2P_ONLINE') return;

    const cleanupSync = network.on('PEER_SYNC', (data) => {
      const s = stateRef.current;
      const peer = data.character === 'mario' ? s.mario : s.luigi;
      peer.x = data.x;
      peer.y = data.y;
      peer.vx = data.vx;
      peer.vy = data.vy;
      peer.facing = data.facing;
      peer.isGrounded = data.isGrounded;
      peer.isJumping = data.isJumping;
      peer.runFrame = data.runFrame;
      peer.currentPlatformIndex = data.currentPlatformIndex;
    });

    const cleanupFall = network.on('PLAYER_FELL', (data) => {
      killAndResetToStart(`💀 ${data.character === 'mario' ? 'Mario' : 'Luigi'} caiu no abismo! Voltando ao início!`);
    });

    const cleanupBoss = network.on('BOSS_EVENT', (data) => {
      const s = stateRef.current;
      if (data.eventType === 'AXE_CUT' && s.boss) {
        s.boss.bridgeCollapsed = true;
        s.boss.hp = 0;
        sound.playBridgeCollapse();
        sound.playBossVictory();
        setTimeout(() => {
          if (!s.victoryTriggered) {
            s.victoryTriggered = true;
            onVictoryRef.current();
          }
        }, 1800);
      }
    });

    return () => {
      cleanupSync();
      cleanupFall();
      cleanupBoss();
    };
  }, [gameMode]);

  // Global direct keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlayingRef.current || isPausedRef.current) return;

      const code = e.code;
      const key = e.key;

      // In 2P_ONLINE: user uses either WASD or Arrows to control their assigned character!
      if (gameModeRef.current === '2P_ONLINE') {
        const isMeMario = myRoleRef.current === 'mario';
        if (code === 'KeyA' || key === 'a' || key === 'A' || code === 'ArrowLeft' || key === 'ArrowLeft') {
          e.preventDefault();
          if (isMeMario) keysRef.current.p1Left = true;
          else keysRef.current.p2Left = true;
        } else if (code === 'KeyD' || key === 'd' || key === 'D' || code === 'ArrowRight' || key === 'ArrowRight') {
          e.preventDefault();
          if (isMeMario) keysRef.current.p1Right = true;
          else keysRef.current.p2Right = true;
        } else if (code === 'KeyW' || key === 'w' || key === 'W' || code === 'ArrowUp' || key === 'ArrowUp' || code === 'Space' || key === ' ' || code === 'Enter' || key === 'Enter') {
          e.preventDefault();
          if (isMeMario) keysRef.current.p1Jump = true;
          else keysRef.current.p2Jump = true;
        }
        return;
      }

      // Local 2P or 1P:
      // P1 (Mario) Controls: WASD or Space
      if (code === 'KeyA' || key === 'a' || key === 'A') {
        e.preventDefault();
        keysRef.current.p1Left = true;
      } else if (code === 'KeyD' || key === 'd' || key === 'D') {
        e.preventDefault();
        keysRef.current.p1Right = true;
      } else if (code === 'KeyW' || key === 'w' || key === 'W' || code === 'Space' || key === ' ') {
        e.preventDefault();
        keysRef.current.p1Jump = true;
      }

      // P2 (Luigi) Controls: Arrow keys
      if (code === 'ArrowLeft' || key === 'ArrowLeft') {
        e.preventDefault();
        keysRef.current.p2Left = true;
      } else if (code === 'ArrowRight' || key === 'ArrowRight') {
        e.preventDefault();
        keysRef.current.p2Right = true;
      } else if (code === 'ArrowUp' || key === 'ArrowUp' || code === 'Enter' || key === 'Enter') {
        e.preventDefault();
        keysRef.current.p2Jump = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key;

      if (gameModeRef.current === '2P_ONLINE') {
        const isMeMario = myRoleRef.current === 'mario';
        if (code === 'KeyA' || key === 'a' || key === 'A' || code === 'ArrowLeft' || key === 'ArrowLeft') {
          if (isMeMario) keysRef.current.p1Left = false;
          else keysRef.current.p2Left = false;
        } else if (code === 'KeyD' || key === 'd' || key === 'D' || code === 'ArrowRight' || key === 'ArrowRight') {
          if (isMeMario) keysRef.current.p1Right = false;
          else keysRef.current.p2Right = false;
        } else if (code === 'KeyW' || key === 'w' || key === 'W' || code === 'ArrowUp' || key === 'ArrowUp' || code === 'Space' || key === ' ' || code === 'Enter' || key === 'Enter') {
          if (isMeMario) keysRef.current.p1Jump = false;
          else keysRef.current.p2Jump = false;
        }
        return;
      }

      // P1 (Mario)
      if (code === 'KeyA' || key === 'a' || key === 'A') {
        keysRef.current.p1Left = false;
      } else if (code === 'KeyD' || key === 'd' || key === 'D') {
        keysRef.current.p1Right = false;
      } else if (code === 'KeyW' || key === 'w' || key === 'W' || code === 'Space' || key === ' ') {
        keysRef.current.p1Jump = false;
      }

      // P2 (Luigi)
      if (code === 'ArrowLeft' || key === 'ArrowLeft') {
        keysRef.current.p2Left = false;
      } else if (code === 'ArrowRight' || key === 'ArrowRight') {
        keysRef.current.p2Right = false;
      } else if (code === 'ArrowUp' || key === 'ArrowUp' || code === 'Enter' || key === 'Enter') {
        keysRef.current.p2Jump = false;
      }
    };

    const handleBlur = () => {
      keysRef.current.p1Left = false;
      keysRef.current.p1Right = false;
      keysRef.current.p1Jump = false;
      keysRef.current.p2Left = false;
      keysRef.current.p2Right = false;
      keysRef.current.p2Jump = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(32, currentTime - lastTime);
      lastTime = currentTime;

      const canvas = canvasRef.current;
      if (canvas && isPlayingRef.current) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (!isPausedRef.current) {
            update(dt);
          }
          render(ctx, canvas);
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Kill and reset to Platform 0
  const killAndResetToStart = (causeText: string) => {
    const s = stateRef.current;
    sound.playHurt();

    s.floatingTexts.push({
      id: Math.random(),
      x: s.camera.x + 200,
      y: s.camera.y + 200,
      text: causeText,
      color: '#ef4444',
      fontSize: 18,
      alpha: 1,
      vy: -1.5,
      life: 0,
    });

    onUpdateStatsRef.current((prev) => {
      const nextLives = Math.max(0, prev.lives - 1);
      if (nextLives === 0) {
        sound.playGameOver();
        setTimeout(() => onGameOverRef.current(), 400);
      }
      return {
        ...prev,
        lives: nextLives,
        currentPlatform: 0,
      };
    });

    // Reset BOTH players back to the start of the map (Platform 0)
    const startPlat = s.platforms[0];
    s.mario.x = 100;
    s.mario.y = startPlat.y - s.mario.height;
    s.mario.vx = 0;
    s.mario.vy = 0;
    s.mario.invincibleTimer = 2.0;
    s.mario.currentPlatformIndex = 0;

    s.luigi.x = 140;
    s.luigi.y = startPlat.y - s.luigi.height;
    s.luigi.vx = 0;
    s.luigi.vy = 0;
    s.luigi.invincibleTimer = 2.0;
    s.luigi.currentPlatformIndex = 0;

    s.camera.x = 0;
    s.camera.y = 0;
    s.highestReachedPlatform = 0;
    s.lastMilestoneTriggered = 0;
  };

  const updatePlayer = (
    player: PlayerCharacter,
    isLeft: boolean,
    isRight: boolean,
    isJump: boolean,
    lastJump: boolean,
    dt: number,
    isLuigi: boolean
  ): boolean => {
    const s = stateRef.current;
    const currentPowerUp = powerUpRef.current;
    const accel = 1.0;
    const friction = 0.82;
    const maxSpeed = currentPowerUp?.type === 'SUPER_JUMP' ? 7.6 : 6.8;

    if (isLeft && !isRight) {
      player.vx = Math.max(-maxSpeed, player.vx - accel);
      player.facing = 'left';
    } else if (isRight && !isLeft) {
      player.vx = Math.min(maxSpeed, player.vx + accel);
      player.facing = 'right';
    } else {
      player.vx *= friction;
      if (Math.abs(player.vx) < 0.1) player.vx = 0;
    }

    if (Math.abs(player.vx) > 0.4 && player.isGrounded) {
      player.animTimer += dt * 0.016;
      player.runFrame = Math.floor(player.animTimer) % 4;

      if (Math.random() < 0.25) {
        s.particles.push({
          id: Math.random(),
          x: player.x + player.width / 2 + (player.facing === 'left' ? 10 : -10),
          y: player.y + player.height,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -Math.random() * 1.5,
          color: 'rgba(255,255,255,0.7)',
          size: 3 + Math.random() * 3,
          alpha: 0.8,
          life: 0,
          maxLife: 0.3,
        });
      }
    }

    const justPressedJump = isJump && !lastJump;
    if (justPressedJump) {
      player.jumpBufferTimer = 0.18;
    } else if (player.jumpBufferTimer > 0) {
      player.jumpBufferTimer -= dt * 0.001;
    }

    if (player.isGrounded) {
      player.coyoteTimer = 0.14;
    } else if (player.coyoteTimer > 0) {
      player.coyoteTimer -= dt * 0.001;
    }

    if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
      const baseJump = isLuigi ? -14.2 : -13.5;
      const jumpPower = currentPowerUp?.type === 'SUPER_JUMP' ? baseJump - 2.5 : baseJump;
      player.vy = jumpPower;
      player.isGrounded = false;
      player.isJumping = true;
      player.jumpBufferTimer = 0;
      player.coyoteTimer = 0;

      if (currentPowerUp?.type === 'SUPER_JUMP') {
        sound.playSuperJump();
      } else {
        sound.playJump(isLuigi);
      }

      for (let i = 0; i < 6; i++) {
        s.particles.push({
          id: Math.random(),
          x: player.x + player.width / 2,
          y: player.y + player.height,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 2,
          color: isLuigi ? '#86efac' : '#fca5a5',
          size: 4 + Math.random() * 3,
          alpha: 0.9,
          life: 0,
          maxLife: 0.35,
        });
      }
    }

    if (!isJump && player.vy < -4.0) {
      player.vy *= 0.55;
    }

    const gravity = isLuigi ? 0.60 : 0.65;
    player.vy += gravity;
    if (player.vy > 14) player.vy = 14;

    player.x += player.vx;
    player.y += player.vy;

    if (player.invincibleTimer > 0) {
      player.invincibleTimer -= dt * 0.001;
    }

    return isJump;
  };

  const update = (dt: number) => {
    const s = stateRef.current;
    const isOnline = gameModeRef.current === '2P_ONLINE';
    const isLocal2P = gameModeRef.current === '2P_LOCAL';
    const isMeMario = isOnline ? (myRoleRef.current === 'mario') : true;
    s.gameTime += dt * 0.001;

    // Movement inputs
    if (isOnline) {
      // Control my designated character locally
      if (isMeMario) {
        const p1Left = keysRef.current.p1Left || inputPropRef.current.left;
        const p1Right = keysRef.current.p1Right || inputPropRef.current.right;
        const p1Jump = keysRef.current.p1Jump || inputPropRef.current.jump;
        s.lastJumpP1 = updatePlayer(s.mario, p1Left, p1Right, p1Jump, s.lastJumpP1, dt, false);
      } else {
        const p2Left = keysRef.current.p2Left || inputPropRef.current.left;
        const p2Right = keysRef.current.p2Right || inputPropRef.current.right;
        const p2Jump = keysRef.current.p2Jump || inputPropRef.current.jump;
        s.lastJumpP2 = updatePlayer(s.luigi, p2Left, p2Right, p2Jump, s.lastJumpP2, dt, true);
      }

      // Broadcast position to peer (~30fps throttling)
      s.lastSyncTime += dt;
      if (s.lastSyncTime >= 30) {
        s.lastSyncTime = 0;
        const myP = isMeMario ? s.mario : s.luigi;
        network.sendPlayerSync({
          character: myRoleRef.current,
          x: myP.x,
          y: myP.y,
          vx: myP.vx,
          vy: myP.vy,
          facing: myP.facing,
          isGrounded: myP.isGrounded,
          isJumping: myP.isJumping,
          runFrame: myP.runFrame,
          currentPlatformIndex: myP.currentPlatformIndex,
        });
      }
    } else {
      // Local 2P or 1P mode
      const p1Left = keysRef.current.p1Left || (keysRef.current.p2Left && !isLocal2P) || inputPropRef.current.left;
      const p1Right = keysRef.current.p1Right || (keysRef.current.p2Right && !isLocal2P) || inputPropRef.current.right;
      const p1Jump = keysRef.current.p1Jump || (keysRef.current.p2Jump && !isLocal2P) || inputPropRef.current.jump;

      const p2Left = isLocal2P ? (keysRef.current.p2Left || !!inputPropRef.current.p2Left) : false;
      const p2Right = isLocal2P ? (keysRef.current.p2Right || !!inputPropRef.current.p2Right) : false;
      const p2Jump = isLocal2P ? (keysRef.current.p2Jump || !!inputPropRef.current.p2Jump) : false;

      s.lastJumpP1 = updatePlayer(s.mario, p1Left, p1Right, p1Jump, s.lastJumpP1, dt, false);

      if (isLocal2P) {
        s.lastJumpP2 = updatePlayer(s.luigi, p2Left, p2Right, p2Jump, s.lastJumpP2, dt, true);
      } else {
        const dist = s.mario.x - s.luigi.x;
        const followLeft = dist < -60;
        const followRight = dist > 60;
        const followJump = s.mario.isJumping && s.luigi.isGrounded && Math.random() < 0.2;
        s.lastJumpP2 = updatePlayer(s.luigi, followLeft, followRight, followJump, s.lastJumpP2, dt, true);
      }
    }

    // Platforms generation up to 300
    const leaderPlat = Math.max(s.mario.currentPlatformIndex, s.luigi.currentPlatformIndex);
    if (leaderPlat + 12 > s.maxPlatformGenerated && s.maxPlatformGenerated < 300) {
      generatePlatformsUpTo(leaderPlat + 15);
    }

    // Platform collisions
    const activePlayers = (isOnline || isLocal2P) ? [s.mario, s.luigi] : [s.mario];

    for (const player of activePlayers) {
      player.isGrounded = false;

      for (const plat of s.platforms) {
        if (plat.isCrumbled) continue;

        if (plat.type === 'MOVING_H' && plat.rangeX && plat.speed) {
          plat.x = plat.initialX + Math.sin(s.gameTime * plat.speed) * plat.rangeX;
        }

        if (plat.type === 'CRUMBLING' && plat.crumbleTimer !== undefined) {
          plat.crumbleTimer -= dt * 0.001;
          if (plat.crumbleTimer <= 0) {
            plat.isCrumbled = true;
          }
        }

        const isFalling = player.vy >= 0;
        const isWithinX =
          player.x + player.width - 4 > plat.x && player.x + 4 < plat.x + plat.width;

        const feetY = player.y + player.height;
        const prevFeetY = feetY - player.vy;

        const steppedOnPlat =
          (prevFeetY <= plat.y + 12 && feetY >= plat.y && feetY <= plat.y + plat.height + 4) ||
          (isFalling && feetY >= plat.y && feetY <= plat.y + Math.max(16, player.vy + 6));

        if (isFalling && isWithinX && steppedOnPlat) {
          player.y = plat.y - player.height;
          player.vy = 0;
          player.isGrounded = true;
          player.isJumping = false;
          player.currentPlatformIndex = plat.index;

          if (plat.type === 'BOUNCY') {
            player.vy = -16.5;
            player.isGrounded = false;
            sound.playSpring();
            for (let p = 0; p < 8; p++) {
              s.particles.push({
                id: Math.random(),
                x: player.x + player.width / 2,
                y: plat.y,
                vx: (Math.random() - 0.5) * 5,
                vy: -Math.random() * 4,
                color: '#f87171',
                size: 4 + Math.random() * 3,
                alpha: 1,
                life: 0,
                maxLife: 0.4,
              });
            }
          }

          if (plat.type === 'CRUMBLING' && plat.crumbleTimer === undefined) {
            plat.crumbleTimer = 0.9;
          }

          if (plat.index > s.highestReachedPlatform) {
            s.highestReachedPlatform = plat.index;
            onUpdateStatsRef.current((prev) => ({
              ...prev,
              currentPlatform: plat.index,
              highestPlatform: Math.max(prev.highestPlatform, plat.index),
              score: prev.score + 50,
            }));
          }

          // Trigger Milestone Math Challenge (every 10 phases!)
          if (
            plat.type === 'MILESTONE' &&
            plat.index % 10 === 0 &&
            !plat.clearedMath &&
            s.lastMilestoneTriggered !== plat.index
          ) {
            s.lastMilestoneTriggered = plat.index;
            plat.clearedMath = true;
            sound.playPortalOpen();
            if (isOnline) {
              network.sendMathTrigger(plat.index);
            }
            onTriggerMathChallengeRef.current(plat.index);
          }
        }
      }
    }

    // --- FALLING INTO THE ABYSS (QUANDO CAI TEM QUE MORRER E VOLTAR AO INÍCIO DO MAPA) ---
    const deathY = s.camera.y + 680;
    if (s.mario.y > deathY) {
      if (isOnline) network.sendPlayerFell('mario');
      killAndResetToStart('💀 Mario caiu no abismo! Voltando ao início!');
      return;
    }
    if ((isLocal2P || isOnline) && s.luigi.y > deathY) {
      if (isOnline) network.sendPlayerFell('luigi');
      killAndResetToStart('💀 Luigi caiu no abismo! Voltando ao início!');
      return;
    }

    // --- COINS COLLECTION ---
    const currentP = powerUpRef.current;
    const magnetActive = currentP?.type === 'COIN_MAGNET';

    for (const coin of s.coins) {
      if (coin.collected) continue;
      coin.animFrame += dt * 0.008;

      if (magnetActive) {
        const target = isOnline && !isMeMario ? s.luigi : s.mario;
        const dx = (target.x + target.width / 2) - (coin.x + coin.width / 2);
        const dy = (target.y + target.height / 2) - (coin.y + coin.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 260) {
          coin.x += (dx / dist) * 7.5;
          coin.y += (dy / dist) * 7.5;
        }
      }

      for (const p of activePlayers) {
        if (
          p.x < coin.x + coin.width &&
          p.x + p.width > coin.x &&
          p.y < coin.y + coin.height &&
          p.y + p.height > coin.y
        ) {
          coin.collected = true;
          sound.playCoin();
          const mult = currentP?.type === 'DOUBLE_COINS' ? 2 : 1;
          const pts = coin.value * mult;

          onUpdateStatsRef.current((prev) => ({
            ...prev,
            coins: prev.coins + (1 * mult),
            score: prev.score + pts,
          }));

          s.floatingTexts.push({
            id: Math.random(),
            x: coin.x,
            y: coin.y - 10,
            text: `+${pts}`,
            color: '#fbbf24',
            fontSize: 14,
            alpha: 1,
            vy: -1.2,
            life: 0,
          });
        }
      }
    }

    // --- QUESTION BLOCKS ---
    for (const block of s.blocks) {
      if (block.bounceOffset > 0) {
        block.bounceOffset = Math.max(0, block.bounceOffset - 1.2);
      }

      for (const p of activePlayers) {
        const isHittingUnder =
          p.vy < 0 &&
          p.x + p.width > block.x + 4 &&
          p.x < block.x + block.width - 4 &&
          p.y <= block.y + block.height &&
          p.y - p.vy >= block.y + block.height - 12;

        if (isHittingUnder) {
          p.vy = 2;
          block.bounceOffset = 12;
          if (!block.hit) {
            block.hit = true;
            sound.playBump();
            if (block.hasCoin) {
              sound.playCoin();
              const mult = currentP?.type === 'DOUBLE_COINS' ? 2 : 1;
              const pts = 200 * mult;
              onUpdateStatsRef.current((prev) => ({
                ...prev,
                coins: prev.coins + (1 * mult),
                score: prev.score + pts,
              }));
              s.floatingTexts.push({
                id: Math.random(),
                x: block.x + 10,
                y: block.y - 20,
                text: `+${pts}`,
                color: '#facc15',
                fontSize: 16,
                alpha: 1,
                vy: -1.5,
                life: 0,
              });
            }
          }
        }
      }
    }

    // --- ENEMIES COLLISION ---
    for (const enemy of s.enemies) {
      if (enemy.isSquashed) {
        enemy.squashTimer += dt * 0.001;
        continue;
      }

      enemy.x += enemy.vx;
      if (enemy.x <= enemy.minX) {
        enemy.x = enemy.minX;
        enemy.vx = Math.abs(enemy.vx);
      } else if (enemy.x >= enemy.maxX) {
        enemy.x = enemy.maxX;
        enemy.vx = -Math.abs(enemy.vx);
      }

      for (const p of activePlayers) {
        const overlapX = p.x + p.width - 6 > enemy.x && p.x + 6 < enemy.x + enemy.width;
        const overlapY = p.y + p.height > enemy.y && p.y < enemy.y + enemy.height;

        if (overlapX && overlapY) {
          const isLandingOnHead = p.vy > 0 && p.y + p.height <= enemy.y + 18;

          if (isLandingOnHead) {
            enemy.isSquashed = true;
            p.vy = -9.5;
            sound.playStomp();
            onUpdateStatsRef.current((prev) => ({ ...prev, score: prev.score + 200 }));
            s.floatingTexts.push({
              id: Math.random(),
              x: enemy.x,
              y: enemy.y - 15,
              text: '+200',
              color: '#f43f5e',
              fontSize: 15,
              alpha: 1,
              vy: -1.3,
              life: 0,
            });
          } else if (currentP?.type === 'STAR_SHIELD') {
            enemy.isSquashed = true;
            sound.playStomp();
            onUpdateStatsRef.current((prev) => ({ ...prev, score: prev.score + 300 }));
          } else if (p.invincibleTimer <= 0) {
            sound.playHurt();
            p.invincibleTimer = 1.6;
            p.vy = -6;
            p.vx = p.facing === 'left' ? 4 : -4;
            onUpdateStatsRef.current((prev) => {
              const nextLives = Math.max(0, prev.lives - 1);
              if (nextLives === 0) {
                sound.playGameOver();
                setTimeout(() => onGameOverRef.current(), 400);
              }
              return { ...prev, lives: nextLives };
            });
          }
        }
      }
    }

    // --- BOSS BATTLE (FASE 300) ---
    const boss = s.boss;
    if (boss && boss.hp > 0 && !boss.bridgeCollapsed) {
      boss.attackTimer += dt * 0.001;
      boss.fireTimer -= dt * 0.001;
      boss.jumpTimer -= dt * 0.001;

      if (boss.fireTimer <= 0) {
        boss.fireTimer = 3.2;
        sound.playFireball();
        boss.fireballs.push({
          id: Math.random(),
          x: boss.x - 10,
          y: boss.y + 25,
          vx: -4.5,
          vy: Math.sin(s.gameTime * 4) * 1.5,
          radius: 12,
          life: 0,
        });
      }

      if (boss.jumpTimer <= 0 && boss.isGrounded) {
        boss.jumpTimer = 2.8;
        boss.vy = -10;
        boss.isGrounded = false;
        sound.playBossRoar();
      }

      boss.vy += 0.55;
      boss.y += boss.vy;

      const bridgeY = 440;
      if (boss.y + boss.height >= bridgeY) {
        boss.y = bridgeY - boss.height;
        boss.vy = 0;
        boss.isGrounded = true;
      }

      // Fireballs collision
      for (let f = boss.fireballs.length - 1; f >= 0; f--) {
        const fb = boss.fireballs[f];
        fb.x += fb.vx;
        fb.y += fb.vy;
        fb.life += dt * 0.001;

        s.particles.push({
          id: Math.random(),
          x: fb.x,
          y: fb.y,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          color: Math.random() > 0.5 ? '#f97316' : '#ef4444',
          size: 4 + Math.random() * 3,
          alpha: 0.9,
          life: 0,
          maxLife: 0.25,
          shape: 'fire',
        });

        for (const p of activePlayers) {
          const dist = Math.hypot((p.x + p.width / 2) - fb.x, (p.y + p.height / 2) - fb.y);
          if (dist < fb.radius + 14 && p.invincibleTimer <= 0) {
            sound.playHurt();
            p.invincibleTimer = 1.6;
            p.vy = -5;
            onUpdateStatsRef.current((prev) => {
              const nextLives = Math.max(0, prev.lives - 1);
              if (nextLives === 0) {
                sound.playGameOver();
                setTimeout(() => onGameOverRef.current(), 400);
              }
              return { ...prev, lives: nextLives };
            });
          }
        }

        if (fb.life > 4 || fb.x < boss.arenaStartX - 100) {
          boss.fireballs.splice(f, 1);
        }
      }

      // AXE CUT - DEFEAT BOSS
      for (const p of activePlayers) {
        const axeHit =
          p.x + p.width >= boss.axeX - 10 &&
          p.x <= boss.axeX + 30 &&
          p.y + p.height >= boss.axeY &&
          p.y <= boss.axeY + 50;

        if (axeHit && !boss.bridgeCollapsed) {
          boss.bridgeCollapsed = true;
          boss.hp = 0;
          sound.playBridgeCollapse();
          sound.playBossVictory();

          if (isOnline) {
            network.sendBossEvent('AXE_CUT');
          }

          const bridgePlat = s.platforms.find((pl) => pl.type === 'BOSS_BRIDGE');
          if (bridgePlat) {
            bridgePlat.isCrumbled = true;
          }

          s.floatingTexts.push({
            id: Math.random(),
            x: boss.x - 80,
            y: boss.y - 40,
            text: '🏆 CHEFÃO DERROTADO!',
            color: '#facc15',
            fontSize: 24,
            alpha: 1,
            vy: -1.5,
            life: 0,
          });

          setTimeout(() => {
            if (!s.victoryTriggered) {
              s.victoryTriggered = true;
              onVictoryRef.current();
            }
          }, 1800);
        }
      }

      // Stomp Boss head
      for (const p of activePlayers) {
        const bossOverlap =
          p.x + p.width > boss.x + 8 &&
          p.x < boss.x + boss.width - 8 &&
          p.y + p.height > boss.y &&
          p.y < boss.y + boss.height;

        if (bossOverlap) {
          if (p.vy > 0 && p.y + p.height <= boss.y + 24) {
            boss.hp -= 1;
            p.vy = -12;
            sound.playStomp();
            sound.playBossRoar();

            s.floatingTexts.push({
              id: Math.random(),
              x: boss.x + 10,
              y: boss.y - 20,
              text: `GOLPE! HP: ${boss.hp}/${boss.maxHp}`,
              color: '#facc15',
              fontSize: 16,
              alpha: 1,
              vy: -1.5,
              life: 0,
            });

            if (boss.hp <= 0) {
              boss.bridgeCollapsed = true;
              sound.playBridgeCollapse();
              sound.playBossVictory();
              if (isOnline) network.sendBossEvent('AXE_CUT');
              setTimeout(() => {
                if (!s.victoryTriggered) {
                  s.victoryTriggered = true;
                  onVictoryRef.current();
                }
              }, 1600);
            }
          } else if (p.invincibleTimer <= 0) {
            sound.playHurt();
            p.invincibleTimer = 1.6;
            p.vy = -6;
            p.vx = -6;
            onUpdateStatsRef.current((prev) => {
              const nextLives = Math.max(0, prev.lives - 1);
              if (nextLives === 0) {
                sound.playGameOver();
                setTimeout(() => onGameOverRef.current(), 400);
              }
              return { ...prev, lives: nextLives };
            });
          }
        }
      }
    }

    // Particles & Floating text update
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life += dt * 0.001;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        s.particles.splice(i, 1);
      }
    }

    for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
      const ft = s.floatingTexts[i];
      ft.y += ft.vy;
      ft.life += dt * 0.001;
      ft.alpha = Math.max(0, 1 - ft.life / 1.0);
      if (ft.life >= 1.0) {
        s.floatingTexts.splice(i, 1);
      }
    }

    // --- CAMERA TRACKING (EM PC DIFERENTE, A CÂMERA ACOMPANHA O PRÓPRIO JOGADOR DE CADA PC!) ---
    let targetCamX = s.mario.x - 280;
    let targetCamY = s.mario.y - 280;

    if (isOnline) {
      if (myRoleRef.current === 'luigi') {
        // PC 2: Camera follows Luigi!
        targetCamX = s.luigi.x - 280;
        targetCamY = s.luigi.y - 280;
      } else {
        // PC 1: Camera follows Mario!
        targetCamX = s.mario.x - 280;
        targetCamY = s.mario.y - 280;
      }
    } else if (isLocal2P) {
      // Local 2P: Camera follows midpoint between Mario & Luigi
      const midX = (s.mario.x + s.luigi.x) / 2;
      const midY = (s.mario.y + s.luigi.y) / 2;
      targetCamX = midX - 280;
      targetCamY = midY - 280;
    }

    s.camera.x += (targetCamX - s.camera.x) * 0.1;
    s.camera.y += (targetCamY - s.camera.y) * 0.08;
  };

  // Render everything onto Canvas
  const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const s = stateRef.current;
    const { camera, mario, luigi, boss } = s;
    const currentP = powerUpRef.current;

    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }

    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Parallax sky
    const isBossZone = s.highestReachedPlatform >= 295;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);

    if (isBossZone) {
      skyGrad.addColorStop(0, '#1c1917');
      skyGrad.addColorStop(0.6, '#450a0a');
      skyGrad.addColorStop(1, '#7f1d1d');
    } else {
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.7, '#7dd3fc');
      skyGrad.addColorStop(1, '#bae6fd');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    if (!isBossZone) {
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      const hillOffsetX = (camera.x * 0.15) % 600;
      for (let hx = -600; hx < width + 600; hx += 300) {
        ctx.arc(hx - hillOffsetX + 150, height + 80, 240, Math.PI, 0, false);
      }
      ctx.fill();

      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      const hill2OffsetX = (camera.x * 0.3) % 450;
      for (let hx = -450; hx < width + 450; hx += 220) {
        ctx.arc(hx - hill2OffsetX + 110, height + 50, 170, Math.PI, 0, false);
      }
      ctx.fill();

      const cloudOffsetX = (camera.x * 0.08) % 800;
      for (let cx = -800; cx < width + 800; cx += 260) {
        drawMarioCloud(ctx, cx - cloudOffsetX, 80 + Math.sin(cx * 0.01) * 35);
      }
    } else {
      ctx.fillStyle = '#292524';
      for (let cx = 0; cx < width; cx += 60) {
        ctx.fillRect(cx, 40, 30, 25);
      }
    }

    ctx.translate(-camera.x, -camera.y);

    // Render platforms
    for (const plat of s.platforms) {
      if (plat.isCrumbled) continue;

      if (plat.type === 'BOSS_BRIDGE') {
        drawBossBridge(ctx, plat);
      } else if (plat.type === 'CASTLE_FLOOR') {
        drawCastleFloor(ctx, plat);
      } else if (plat.type === 'MILESTONE') {
        drawMilestonePlatform(ctx, plat, s.gameTime);
      } else if (plat.type === 'BOUNCY') {
        drawBouncyPlatform(ctx, plat, s.gameTime);
      } else if (plat.type === 'CRUMBLING') {
        drawCrumblingPlatform(ctx, plat);
      } else {
        drawNormalPlatform(ctx, plat);
      }
    }

    // Question blocks & Coins
    for (const block of s.blocks) {
      drawQuestionBlock(ctx, block, s.gameTime);
    }
    for (const coin of s.coins) {
      if (coin.collected) continue;
      drawSpinningCoin(ctx, coin);
    }

    // Enemies
    for (const enemy of s.enemies) {
      drawEnemy(ctx, enemy);
    }

    // Boss & Fireballs
    if (boss) {
      drawBossArena(ctx, boss, s.gameTime);
    }

    // Particles
    for (const p of s.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      if (p.shape === 'star') {
        drawStar(ctx, p.x, p.y, p.size, p.size / 2, 5);
      } else if (p.shape === 'fire') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Render Mario & Luigi
    if (mario.invincibleTimer <= 0 || Math.floor(s.gameTime * 20) % 2 === 0) {
      drawHeroSprite(ctx, mario, 'mario', currentP, s.gameTime);
    }

    if (luigi.invincibleTimer <= 0 || Math.floor(s.gameTime * 20) % 2 === 0) {
      drawHeroSprite(ctx, luigi, 'luigi', currentP, s.gameTime);
    }

    // Floating texts
    for (const ft of s.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.fontSize}px 'Outfit', sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();
  };

  // Sprite drawing helpers
  const drawHeroSprite = (
    ctx: CanvasRenderingContext2D,
    hero: PlayerCharacter,
    character: 'mario' | 'luigi',
    powerup: PowerUp | null,
    time: number
  ) => {
    ctx.save();
    const isLuigi = character === 'luigi';
    const isMe = (gameModeRef.current === '2P_ONLINE' && myRoleRef.current === character);
    const capColor = isLuigi ? '#22c55e' : '#ef4444';
    const overallsColor = isLuigi ? '#1e3a8a' : '#2563eb';

    if (hero.facing === 'left') {
      ctx.translate(hero.x + hero.width, hero.y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(hero.x, hero.y);
    }

    if (powerup && powerup.type === 'STAR_SHIELD') {
      const hue = (time * 360) % 360;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      ctx.shadowBlur = 15;
    } else if (powerup && powerup.type === 'SUPER_JUMP') {
      ctx.shadowColor = isLuigi ? '#4ade80' : '#38bdf8';
      ctx.shadowBlur = 12;
    }

    // Player tag (shows "VOCÊ" if online)
    ctx.save();
    ctx.fillStyle = isLuigi ? '#22c55e' : '#ef4444';
    ctx.font = "bold 8px 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.fillText(isMe ? 'VOCÊ' : (isLuigi ? 'LUIGI' : 'MARIO'), 16, -6);
    ctx.restore();

    // Cap
    ctx.fillStyle = capColor;
    ctx.fillRect(6, 2, 20, 8);
    ctx.fillRect(10, 6, 20, 4);

    // Face & Nose
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(8, 10, 16, 11);
    ctx.fillRect(20, 12, isLuigi ? 5 : 6, isLuigi ? 6 : 5);

    // Eyes & Mustache
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(16, 11, 3, 4);
    ctx.fillRect(14, 16, 12, 4);
    ctx.fillRect(8, 14, 4, 6);

    // Shirt
    ctx.fillStyle = capColor;
    ctx.fillRect(6, 21, 20, 10);

    // Overalls
    ctx.fillStyle = overallsColor;
    ctx.fillRect(8, 23, 16, 10);
    ctx.fillRect(8, 21, 4, 3);
    ctx.fillRect(18, 21, 4, 3);

    ctx.fillStyle = '#fde047';
    ctx.fillRect(9, 23, 2, 2);
    ctx.fillRect(19, 23, 2, 2);

    // Gloves
    ctx.fillStyle = '#ffffff';
    if (!hero.isGrounded) {
      ctx.fillRect(22, 12, 6, 6);
      ctx.fillRect(2, 24, 6, 6);
    } else if (Math.abs(hero.vx) > 0.4) {
      const armOffset = Math.sin(time * 16) * 4;
      ctx.fillRect(22, 23 + armOffset, 6, 6);
      ctx.fillRect(2, 23 - armOffset, 6, 6);
    } else {
      ctx.fillRect(22, 24, 6, 6);
      ctx.fillRect(4, 24, 6, 6);
    }

    // Legs & Shoes
    ctx.fillStyle = '#78350f';
    if (!hero.isGrounded) {
      ctx.fillRect(4, 33, 10, 8);
      ctx.fillRect(16, 31, 11, 7);
    } else if (Math.abs(hero.vx) > 0.4) {
      const legPhase = Math.floor(hero.runFrame);
      if (legPhase === 0 || legPhase === 2) {
        ctx.fillRect(6, 33, 8, 9);
        ctx.fillRect(16, 33, 8, 9);
      } else if (legPhase === 1) {
        ctx.fillRect(2, 32, 10, 8);
        ctx.fillRect(18, 34, 10, 7);
      } else {
        ctx.fillRect(18, 32, 10, 8);
        ctx.fillRect(2, 34, 10, 7);
      }
    } else {
      ctx.fillRect(6, 33, 8, 9);
      ctx.fillRect(16, 33, 8, 9);
    }

    ctx.restore();
  };

  const drawBossArena = (ctx: CanvasRenderingContext2D, boss: Boss, time: number) => {
    ctx.save();
    const lavaY = 510;
    const lavaGrad = ctx.createLinearGradient(boss.arenaStartX, lavaY, boss.arenaStartX, lavaY + 120);
    lavaGrad.addColorStop(0, '#ea580c');
    lavaGrad.addColorStop(0.5, '#dc2626');
    lavaGrad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(boss.arenaStartX - 50, lavaY, 800, 150);

    ctx.fillStyle = '#fef08a';
    for (let lx = boss.arenaStartX; lx < boss.arenaStartX + 750; lx += 45) {
      const bubble = Math.sin(time * 6 + lx * 0.1) * 5;
      ctx.beginPath();
      ctx.arc(lx, lavaY + bubble, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!boss.bridgeCollapsed) {
      const ax = boss.axeX;
      const ay = boss.axeY;
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(ax + 10, ay + 15, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#78350f';
      ctx.fillRect(ax + 8, ay + 15, 6, 25);

      ctx.fillStyle = '#fef08a';
      ctx.font = "bold 9px 'Press Start 2P', monospace";
      ctx.fillText('CORTE A CORRENTE!', ax - 70, ay - 10);
    }

    if (boss.hp > 0 && !boss.bridgeCollapsed) {
      const bx = boss.x;
      const by = boss.y;

      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.roundRect(bx + 18, by + 12, 38, 44, 12);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      for (let s = 0; s < 3; s++) {
        const sx = bx + 28 + s * 10;
        ctx.beginPath();
        ctx.moveTo(sx, by + 10);
        ctx.lineTo(sx - 4, by + 2);
        ctx.lineTo(sx + 4, by + 2);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.roundRect(bx + 6, by + 18, 30, 42, 8);
      ctx.fill();

      ctx.fillStyle = '#15803d';
      ctx.fillRect(bx, by + 6, 22, 22);

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(bx + 8, by + 4);
      ctx.lineTo(bx + 16, by - 12);
      ctx.lineTo(bx + 24, by + 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx + 4, by + 10, 6, 6);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(bx + 4, by + 12, 3, 4);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by + 20, 3, 5);
      ctx.fillRect(bx + 6, by + 20, 3, 5);

      const hpPercent = (boss.hp / boss.maxHp) * 100;
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(bx - 10, by - 25, 84, 10);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(bx - 8, by - 23, (80 * hpPercent) / 100, 6);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx - 10, by - 25, 84, 10);

      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 8px 'Press Start 2P', monospace";
      ctx.fillText(`CHEFÃO ${boss.hp} HP`, bx - 6, by - 30);
    }

    for (const fb of boss.fireballs) {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(fb.x + 3, fb.y, fb.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  const drawBossBridge = (ctx: CanvasRenderingContext2D, plat: Platform) => {
    ctx.save();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;
    ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);

    for (let px = plat.x; px < plat.x + plat.width; px += 24) {
      ctx.beginPath();
      ctx.moveTo(px, plat.y);
      ctx.lineTo(px, plat.y + plat.height);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawCastleFloor = (ctx: CanvasRenderingContext2D, plat: Platform) => {
    ctx.save();
    ctx.fillStyle = '#334155';
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
    ctx.restore();
  };

  const drawMarioCloud = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    ctx.arc(x + 20, y + 20, 20, 0, Math.PI * 2);
    ctx.arc(x + 45, y + 10, 26, 0, Math.PI * 2);
    ctx.arc(x + 75, y + 18, 22, 0, Math.PI * 2);
    ctx.rect(x + 20, y + 20, 55, 18);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 36, y + 14, 3, 8);
    ctx.fillRect(x + 52, y + 14, 3, 8);
    ctx.restore();
  };

  const drawNormalPlatform = (ctx: CanvasRenderingContext2D, plat: Platform) => {
    ctx.save();
    const grassHeight = 10;
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(plat.x, plat.y, plat.width, grassHeight);

    ctx.fillStyle = '#22c55e';
    for (let gx = plat.x; gx < plat.x + plat.width; gx += 16) {
      ctx.fillRect(gx, plat.y - 2, 4, 3);
    }

    ctx.fillStyle = '#b45309';
    ctx.fillRect(plat.x, plat.y + grassHeight, plat.width, plat.height - grassHeight);

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);

    ctx.beginPath();
    const rowHeight = 14;
    for (let ry = plat.y + grassHeight + rowHeight; ry < plat.y + plat.height; ry += rowHeight) {
      ctx.moveTo(plat.x, ry);
      ctx.lineTo(plat.x + plat.width, ry);
    }
    for (let bx = plat.x + 20; bx < plat.x + plat.width; bx += 32) {
      ctx.moveTo(bx, plat.y + grassHeight);
      ctx.lineTo(bx, plat.y + plat.height);
    }
    ctx.stroke();

    if (plat.type === 'MOVING_H') {
      ctx.fillStyle = '#fef08a';
      ctx.font = '10px sans-serif';
      ctx.fillText('◄►', plat.x + plat.width / 2 - 10, plat.y + 24);
    }
    ctx.restore();
  };

  const drawBouncyPlatform = (ctx: CanvasRenderingContext2D, plat: Platform, time: number) => {
    ctx.save();
    const capHeight = 16;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(plat.x, plat.y, plat.width, capHeight, [8, 8, 2, 2]);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 3; i++) {
      const dotX = plat.x + 20 + i * (plat.width / 3.5);
      ctx.beginPath();
      ctx.arc(dotX, plat.y + 8, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(plat.x + plat.width / 2 - 14, plat.y + capHeight, 28, plat.height - capHeight);

    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const startY = plat.y + capHeight + 4;
    ctx.moveTo(plat.x + plat.width / 2 - 12, startY);
    ctx.lineTo(plat.x + plat.width / 2 + 12, startY + 6);
    ctx.lineTo(plat.x + plat.width / 2 - 12, startY + 12);
    ctx.stroke();
    ctx.restore();
  };

  const drawCrumblingPlatform = (ctx: CanvasRenderingContext2D, plat: Platform) => {
    ctx.save();
    const shake = plat.crumbleTimer !== undefined ? (Math.random() - 0.5) * 4 : 0;
    ctx.translate(shake, 0);

    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 12);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(plat.x + 8, plat.y + 6, plat.width - 16, 4);

    if (plat.crumbleTimer !== undefined) {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(plat.x + 25, plat.y + 4);
      ctx.lineTo(plat.x + 35, plat.y + 16);
      ctx.lineTo(plat.x + 45, plat.y + 24);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawMilestonePlatform = (ctx: CanvasRenderingContext2D, plat: Platform, time: number) => {
    ctx.save();
    const goldGrad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.height);
    goldGrad.addColorStop(0, '#fde047');
    goldGrad.addColorStop(0.5, '#eab308');
    goldGrad.addColorStop(1, '#ca8a04');
    ctx.fillStyle = goldGrad;
    ctx.beginPath();
    ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 6);
    ctx.fill();

    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 3;
    ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);

    ctx.fillStyle = '#451a03';
    ctx.font = "bold 13px 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.fillText(`FASE ${plat.index}`, plat.x + plat.width / 2, plat.y + plat.height - 18);

    const portalX = plat.x + plat.width / 2;
    const portalY = plat.y - 120;
    const portalWidth = 90;
    const portalHeight = 120;

    const pulse = 15 + Math.sin(time * 4) * 8;
    const glowGrad = ctx.createRadialGradient(
      portalX,
      portalY + portalHeight / 2,
      10,
      portalX,
      portalY + portalHeight / 2,
      portalWidth / 2 + pulse
    );
    glowGrad.addColorStop(0, 'rgba(250, 204, 21, 0.85)');
    glowGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.45)');
    glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(portalX, portalY + portalHeight / 2, portalWidth / 2 + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#b45309';
    ctx.fillRect(portalX - portalWidth / 2, portalY, 14, portalHeight);
    ctx.fillRect(portalX + portalWidth / 2 - 14, portalY, 14, portalHeight);

    ctx.beginPath();
    ctx.arc(portalX, portalY + 20, portalWidth / 2, Math.PI, 0, false);
    ctx.fillStyle = '#d97706';
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.save();
    ctx.translate(portalX, portalY + portalHeight / 2 + 10);
    ctx.rotate(time * 2);
    drawStar(ctx, 0, 0, 22, 10, 5);
    ctx.restore();

    const flagX = plat.x + plat.width - 35;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(flagX, plat.y);
    ctx.lineTo(flagX, plat.y - 110);
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(flagX, plat.y - 112, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = plat.clearedMath ? '#22c55e' : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(flagX, plat.y - 105);
    ctx.lineTo(flagX - 30, plat.y - 90);
    ctx.lineTo(flagX, plat.y - 75);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  const drawQuestionBlock = (ctx: CanvasRenderingContext2D, block: QuestionBlock, time: number) => {
    ctx.save();
    const by = block.y - block.bounceOffset;

    if (!block.hit) {
      const grad = ctx.createLinearGradient(block.x, by, block.x, by + block.height);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#eab308');
      grad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = grad;
      ctx.fillRect(block.x, by, block.width, block.height);

      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(block.x, by, block.width, block.height);

      ctx.fillStyle = '#78350f';
      ctx.font = "bold 20px 'Press Start 2P', monospace";
      ctx.textAlign = 'center';
      ctx.fillText('?', block.x + block.width / 2, by + block.height - 8);
    } else {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(block.x, by, block.width, block.height);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(block.x, by, block.width, block.height);
    }
    ctx.restore();
  };

  const drawSpinningCoin = (ctx: CanvasRenderingContext2D, coin: Coin) => {
    ctx.save();
    const cx = coin.x + coin.width / 2;
    const cy = coin.y + coin.height / 2;
    const rotScale = Math.sin(coin.animFrame * 3.5);

    ctx.translate(cx, cy);
    ctx.scale(Math.abs(rotScale) < 0.15 ? 0.15 : rotScale, 1);

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.ellipse(0, 0, coin.width / 2, coin.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  };

  const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
    ctx.save();
    if (enemy.isSquashed) {
      ctx.fillStyle = '#854d0e';
      ctx.beginPath();
      ctx.ellipse(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height - 4,
        enemy.width / 2,
        5,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    } else {
      ctx.fillStyle = '#9a3412';
      ctx.beginPath();
      ctx.arc(enemy.x + enemy.width / 2, enemy.y + 12, enemy.width / 2, Math.PI, 0, false);
      ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height - 8);
      ctx.lineTo(enemy.x, enemy.y + enemy.height - 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(enemy.x + 2, enemy.y + enemy.height - 8, 8, 8);
      ctx.fillRect(enemy.x + enemy.width - 10, enemy.y + enemy.height - 8, 8, 8);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(enemy.x + 6, enemy.y + 10, 5, 8);
      ctx.fillRect(enemy.x + enemy.width - 11, enemy.y + 10, 5, 8);
      ctx.fillStyle = '#000000';
      ctx.fillRect(enemy.x + 8, enemy.y + 12, 3, 5);
      ctx.fillRect(enemy.x + enemy.width - 9, enemy.y + 12, 3, 5);
    }
    ctx.restore();
  };

  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    outerR: number,
    innerR: number,
    points: number
  ) => {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / points;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < points; i++) {
      x = cx + Math.cos(rot) * outerR;
      y = cy + Math.sin(rot) * outerR;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerR;
      y = cy + Math.sin(rot) * innerR;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
    ctx.fill();
  };

  return (
    <canvas
      ref={canvasRef}
      tabIndex={0}
      onClick={() => {
        window.focus();
        canvasRef.current?.focus();
      }}
      className="w-full h-full block cursor-default outline-none select-none"
    />
  );
};
