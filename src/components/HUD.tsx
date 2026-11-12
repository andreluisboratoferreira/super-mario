import React from 'react';
import { GameMode, GameStats, PowerUp } from '../types/game';
import { Heart, Volume2, VolumeX, Music, Music2, Pause, Play, HelpCircle, FastForward, Globe, Video } from 'lucide-react';

interface HUDProps {
  stats: GameStats;
  gameMode: GameMode;
  myOnlineRole?: 'mario' | 'luigi';
  onlineRoomId?: string | null;
  activePowerUp: PowerUp | null;
  isMuted: boolean;
  isMusicMuted: boolean;
  isPaused: boolean;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onTogglePause: () => void;
  onOpenHelp: () => void;
  onWarpToBoss: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  gameMode,
  myOnlineRole = 'mario',
  onlineRoomId,
  activePowerUp,
  isMuted,
  isMusicMuted,
  isPaused,
  onToggleMute,
  onToggleMusic,
  onTogglePause,
  onOpenHelp,
  onWarpToBoss,
}) => {
  const formattedScore = stats.score.toString().padStart(6, '0');
  const formattedCoins = stats.coins.toString().padStart(2, '0');

  const nextMilestone = Math.min(300, Math.ceil((stats.currentPlatform + 1) / 10) * 10);
  const platformsToNext = Math.max(0, nextMilestone - stats.currentPlatform);
  const milestoneProgress = Math.min(100, Math.max(0, (stats.currentPlatform / 300) * 100));

  const isOnline = gameMode === '2P_ONLINE';

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none select-none p-2 sm:p-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-2">
        {/* Top Stats Strip */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 bg-slate-900/85 backdrop-blur-md text-white px-3 sm:px-6 py-2.5 rounded-2xl border border-white/20 pixel-shadow pointer-events-auto">
          {/* Players Badge & Camera Indicator */}
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <>
                <div className="flex items-center gap-1 bg-red-600/80 px-2 py-1 rounded-lg border border-red-400">
                  <span className="text-xs">🔴</span>
                  <span className="font-pixel text-[9px] text-white">MARIO</span>
                </div>

                {gameMode === '2P_LOCAL' && (
                  <div className="flex items-center gap-1 bg-emerald-600/80 px-2 py-1 rounded-lg border border-emerald-400">
                    <span className="text-xs">🟢</span>
                    <span className="font-pixel text-[9px] text-white">LUIGI</span>
                  </div>
                )}
              </>
            ) : (
              /* Online Mode Indicator with Individual Camera Status */
              <div className="flex items-center gap-1.5">
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                  myOnlineRole === 'mario'
                    ? 'bg-red-600/90 border-red-400 text-white'
                    : 'bg-emerald-600/90 border-emerald-400 text-white'
                }`}>
                  <span className="text-xs">{myOnlineRole === 'mario' ? '🔴' : '🟢'}</span>
                  <span className="font-pixel text-[9px]">
                    VOCÊ: {myOnlineRole === 'mario' ? 'MARIO' : 'LUIGI'}
                  </span>
                  <span title="Câmera individual ativa" className="inline-flex items-center">
                    <Video className="w-3 h-3 ml-0.5 text-yellow-300" />
                  </span>
                </div>

                {onlineRoomId && (
                  <div className="hidden sm:flex items-center gap-1 bg-blue-900/80 text-blue-200 px-2 py-1 rounded-lg border border-blue-400 font-pixel text-[9px]">
                    <Globe className="w-3 h-3 text-sky-400" />
                    <span>SALA: {onlineRoomId}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Score */}
          <div className="hidden sm:block">
            <div className="text-[9px] font-pixel text-yellow-300 uppercase tracking-widest">
              PONTOS
            </div>
            <div className="font-pixel text-xs sm:text-base text-white tracking-wider tabular-nums">
              {formattedScore}
            </div>
          </div>

          {/* Coins */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-base sm:text-xl animate-bounce" style={{ animationDuration: '2s' }}>
              🪙
            </span>
            <div>
              <div className="text-[8px] sm:text-[9px] font-pixel text-amber-300">
                MOEDAS
              </div>
              <div className="font-pixel text-xs sm:text-base text-yellow-400 tabular-nums">
                x{formattedCoins}
              </div>
            </div>
          </div>

          {/* Platform Milestone Track towards Boss at 300 */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-pixel text-emerald-300">
              <span>FASE {stats.currentPlatform} / 300</span>
              {stats.currentPlatform >= 300 ? (
                <span className="text-red-400 animate-pulse">👑 BOSS!</span>
              ) : (
                <span className="text-amber-400">🏁</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-16 sm:w-32 h-2 bg-slate-700 rounded-full overflow-hidden border border-white/20">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 transition-all duration-300"
                  style={{ width: `${milestoneProgress}%` }}
                />
              </div>
              <span className="text-[8px] font-pixel text-yellow-300 hidden md:inline">
                {stats.currentPlatform >= 300
                  ? 'CHEFÃO'
                  : platformsToNext === 0
                  ? 'DESAFIO 10s!'
                  : `-${platformsToNext}`}
              </span>
            </div>
          </div>

          {/* Lives (Hearts) */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {Array.from({ length: stats.maxLives }).map((_, idx) => (
              <Heart
                key={idx}
                className={`w-3.5 h-3.5 sm:w-5 sm:h-5 transition-transform ${
                  idx < stats.lives
                    ? 'text-red-500 fill-red-500 scale-100'
                    : 'text-slate-600 fill-slate-800 scale-90 opacity-60'
                }`}
              />
            ))}
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {stats.currentPlatform < 300 && (
              <button
                onClick={onWarpToBoss}
                title="Pular para a Fase 300 (Chefão Bowser)"
                className="px-2 py-1 bg-amber-500/80 hover:bg-amber-500 text-slate-950 font-pixel text-[8px] rounded-lg border border-amber-300 transition-colors flex items-center gap-1"
              >
                <FastForward className="w-3 h-3" />
                <span className="hidden lg:inline">BOSS 300</span>
              </button>
            )}

            <button
              onClick={onToggleMute}
              title={isMuted ? 'Ativar Efeitos' : 'Mutar Efeitos'}
              className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-600 transition-colors"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
            <button
              onClick={onToggleMusic}
              title={isMusicMuted ? 'Tocar Música' : 'Pausar Música'}
              className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-600 transition-colors"
            >
              {isMusicMuted ? <Music className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-50" /> : <Music2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
            </button>
            <button
              onClick={onTogglePause}
              title={isPaused ? 'Continuar' : 'Pausar'}
              className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-600 transition-colors"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
            <button
              onClick={onOpenHelp}
              title="Instruções & Teclas"
              className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-600 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Active Powerup Banner */}
        {activePowerUp && activePowerUp.timeLeft > 0 && (
          <div className="self-center flex items-center gap-2 bg-amber-500/90 text-slate-950 font-bold px-3 py-1 rounded-full border border-amber-300 pixel-shadow text-xs animate-pulse">
            <span className="text-sm">{activePowerUp.icon}</span>
            <span>{activePowerUp.name}</span>
            <span className="font-pixel text-[10px] bg-slate-900 text-yellow-300 px-1.5 py-0.5 rounded">
              {Math.ceil(activePowerUp.timeLeft)}s
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
