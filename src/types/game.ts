export type GameState =
  | 'TITLE'
  | 'PLAYING'
  | 'MATH_CHALLENGE'
  | 'BOSS_FIGHT'
  | 'PAUSED'
  | 'GAME_OVER'
  | 'VICTORY';

export type GameMode = '1P' | '2P_LOCAL' | '2P_ONLINE';

export type MathDifficulty = 'facil' | 'medio' | 'dificil' | 'adaptativo';

export type PowerUpType =
  | 'NONE'
  | 'SUPER_JUMP'
  | 'COIN_MAGNET'
  | 'STAR_SHIELD'
  | 'DOUBLE_COINS';

export interface PowerUp {
  type: PowerUpType;
  name: string;
  duration: number; // in seconds
  timeLeft: number; // in seconds
  color: string;
  icon: string;
}

export interface PlayerCharacter {
  id: 'mario' | 'luigi';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  facing: 'left' | 'right';
  isJumping: boolean;
  jumpHoldTimer: number;
  coyoteTimer: number;
  jumpBufferTimer: number;
  invincibleTimer: number;
  runFrame: number;
  animTimer: number;
  currentPlatformIndex: number;
  score: number;
  isDead: boolean;
}

export type PlatformType =
  | 'NORMAL'
  | 'MOVING_H'
  | 'MOVING_V'
  | 'BOUNCY'
  | 'CRUMBLING'
  | 'MILESTONE'
  | 'BOSS_BRIDGE'
  | 'CASTLE_FLOOR';

export interface Platform {
  id: number;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  initialX: number;
  initialY: number;
  rangeX?: number;
  rangeY?: number;
  speed?: number;
  direction?: number;
  crumbleTimer?: number;
  isCrumbled?: boolean;
  clearedMath?: boolean;
}

export interface Coin {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
  value: number;
  animFrame: number;
}

export interface QuestionBlock {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  hit: boolean;
  bounceOffset: number;
  hasCoin: boolean;
  hasPowerup?: PowerUpType;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  minX: number;
  maxX: number;
  isSquashed: boolean;
  squashTimer: number;
  type: 'goomba' | 'bouncy';
}

export interface Fireball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
}

export interface Boss {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  isGrounded: boolean;
  facing: 'left' | 'right';
  state: 'idle' | 'charging' | 'jumping' | 'spitting_fire' | 'defeated';
  attackTimer: number;
  jumpTimer: number;
  fireTimer: number;
  isVulnerable: boolean;
  fireballs: Fireball[];
  arenaStartX: number;
  axeX: number;
  axeY: number;
  bridgeCollapsed: boolean;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'square' | 'star' | 'fire';
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  alpha: number;
  vy: number;
  life: number;
}

export interface MathChallenge {
  id: string;
  platformIndex: number;
  question: string;
  expression: string;
  options: number[];
  correctAnswer: number;
  difficulty: MathDifficulty;
  explanation: string;
  operation: '+' | '-' | '×' | '÷' | 'mixed';
  rewardPowerUp: PowerUpType;
  rewardCoins: number;
  timeLimitSeconds: number; // 10 seconds!
  isBossChallenge?: boolean;
}

export interface GameStats {
  score: number;
  coins: number;
  lives: number;
  maxLives: number;
  currentPlatform: number;
  highestPlatform: number;
  mathSolvedCount: number;
  mathStreak: number;
  highestStreak: number;
  timeSeconds: number;
  bossDefeated: boolean;
}
