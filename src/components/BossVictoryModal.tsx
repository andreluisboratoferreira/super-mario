import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameStats } from '../types/game';
import { Trophy, Crown, Sparkles, RotateCcw, Star } from 'lucide-react';

interface BossVictoryModalProps {
  stats: GameStats;
  highScore: number;
  onRestart: () => void;
}

export const BossVictoryModal: React.FC<BossVictoryModalProps> = ({
  stats,
  highScore,
  onRestart,
}) => {
  useEffect(() => {
    // Launch fireworks confetti
    const duration = 4000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ef4444', '#22c55e', '#facc15', '#3b82f6'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ef4444', '#22c55e', '#facc15', '#3b82f6'],
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border-4 border-yellow-400 pixel-shadow-lg overflow-hidden text-slate-800 dark:text-slate-100 text-center">
        {/* Victory Royal Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-6 py-5 text-slate-950 border-b-4 border-yellow-600 relative overflow-hidden">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Crown className="w-8 h-8 text-amber-900 animate-bounce" />
            <span className="font-pixel text-xs tracking-widest uppercase font-bold text-amber-950">
              300 FASES COMPLETADAS!
            </span>
            <Crown className="w-8 h-8 text-amber-900 animate-bounce" />
          </div>
          <h1 className="font-outfit font-black text-3xl sm:text-4xl uppercase tracking-tight text-white drop-shadow-md">
            VOCÊ ZEROU O JOGO!
          </h1>
          <p className="text-xs font-bold text-amber-950 mt-1">
            O Chefão foi derrotado e o Reino dos Números foi salvo!
          </p>
        </div>

        <div className="p-6">
          {/* Mario & Luigi Celebration Icons */}
          <div className="flex items-center justify-center gap-6 my-2">
            <div className="flex flex-col items-center">
              <span className="text-4xl animate-bounce" style={{ animationDuration: '1s' }}>🔴</span>
              <span className="font-pixel text-[11px] font-bold text-red-500 mt-1">MARIO</span>
            </div>
            <div className="text-3xl font-black text-amber-400">✨ & ✨</div>
            <div className="flex flex-col items-center">
              <span className="text-4xl animate-bounce" style={{ animationDuration: '1.2s' }}>🟢</span>
              <span className="font-pixel text-[11px] font-bold text-emerald-500 mt-1">LUIGI</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 my-5">
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-pixel text-slate-500 uppercase block mb-1">
                Pontuação Final
              </span>
              <span className="font-outfit text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {stats.score}
              </span>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-pixel text-slate-500 uppercase block mb-1">
                Fases Superadas
              </span>
              <span className="font-outfit text-2xl font-black text-amber-500 tabular-nums">
                300 / 300 🏆
              </span>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-pixel text-slate-500 uppercase block mb-1">
                Moedas Coletadas
              </span>
              <span className="font-outfit text-xl font-bold text-yellow-500">
                🪙 {stats.coins}
              </span>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-pixel text-slate-500 uppercase block mb-1">
                Desafios em 10s
              </span>
              <span className="font-outfit text-xl font-bold text-emerald-500">
                {stats.mathSolvedCount} Acertos
              </span>
            </div>
          </div>

          {/* Restart Button */}
          <button
            onClick={onRestart}
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl font-outfit text-xl font-black shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-transform transform active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-6 h-6" />
            <span>Jogar Novamente</span>
          </button>
        </div>
      </div>
    </div>
  );
};
