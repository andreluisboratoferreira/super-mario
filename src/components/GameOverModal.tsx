import React from 'react';
import { GameStats } from '../types/game';
import { RotateCcw, Trophy, Award, Sparkles } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  highScore: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  highScore,
  onRestart,
}) => {
  const isNewRecord = stats.score > 0 && stats.score >= highScore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border-4 border-red-500 pixel-shadow-lg overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Banner */}
        <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 text-white text-center border-b-4 border-red-700">
          <div className="font-pixel text-xs text-yellow-300 mb-1">Mamma Mia!</div>
          <h2 className="font-outfit font-black text-2xl tracking-wide uppercase">
            Fim de Jogo!
          </h2>
        </div>

        <div className="p-6">
          {/* New Record Banner if applicable */}
          {isNewRecord && (
            <div className="mb-4 bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-400 rounded-xl p-3 flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300 font-extrabold text-sm animate-bounce">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>NOVO RECORDE PESSOAL!</span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] font-pixel text-slate-500 uppercase block mb-1">
                Pontuação
              </span>
              <span className="font-outfit text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {stats.score}
              </span>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] font-pixel text-slate-500 uppercase block mb-1">
                Melhor Recorde
              </span>
              <span className="font-outfit text-2xl font-black text-amber-500 tabular-nums">
                {Math.max(stats.score, highScore)}
              </span>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] font-pixel text-slate-500 uppercase block mb-1">
                Plataforma Máx.
              </span>
              <span className="font-outfit text-xl font-bold text-sky-600 dark:text-sky-400">
                #{stats.highestPlatform}
              </span>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] font-pixel text-slate-500 uppercase block mb-1">
                Moedas
              </span>
              <span className="font-outfit text-xl font-bold text-yellow-500">
                🪙 {stats.coins}
              </span>
            </div>

            <div className="col-span-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-800/80 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-pixel text-emerald-700 dark:text-emerald-400 uppercase block">
                  Desafios Matemáticos
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {stats.mathSolvedCount} resolvidos (Combo Máx: x{stats.highestStreak})
                </span>
              </div>
              <div className="text-2xl">🎓</div>
            </div>
          </div>

          {/* Play Again Button */}
          <button
            onClick={onRestart}
            className="w-full py-3.5 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-outfit text-lg font-bold shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-transform transform active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Jogar Novamente</span>
          </button>
        </div>
      </div>
    </div>
  );
};
