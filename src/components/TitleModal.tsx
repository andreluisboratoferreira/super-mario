import React from 'react';
import { GameMode, MathDifficulty } from '../types/game';
import { Play, Sparkles, Volume2, Trophy, Users, User, Globe, ArrowRight } from 'lucide-react';

interface TitleModalProps {
  onStart: () => void;
  gameMode: GameMode;
  onSelectGameMode: (m: GameMode) => void;
  onOpenOnlineModal: () => void;
  mathDifficulty: MathDifficulty;
  onSelectDifficulty: (d: MathDifficulty) => void;
  highScore: number;
}

export const TitleModal: React.FC<TitleModalProps> = ({
  onStart,
  gameMode,
  onSelectGameMode,
  onOpenOnlineModal,
  mathDifficulty,
  onSelectDifficulty,
  highScore,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-500/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border-4 border-amber-400 pixel-shadow-lg p-5 sm:p-6 text-center text-slate-800 dark:text-slate-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-3xl animate-bounce" style={{ animationDuration: '1.2s' }}>🔴</span>
          <span className="text-4xl animate-spin" style={{ animationDuration: '8s' }}>⭐</span>
          <span className="text-3xl animate-bounce" style={{ animationDuration: '1.5s' }}>🟢</span>
        </div>

        <div className="font-pixel text-[10px] text-amber-500 tracking-widest uppercase mb-1">
          Aventura Cooperativa · 300 Fases
        </div>
        <h1 className="font-outfit font-black text-2xl sm:text-3xl text-slate-900 dark:text-white uppercase tracking-tight leading-tight mb-2">
          Super Salto <span className="text-red-500">Mario</span> & <span className="text-emerald-500">Luigi</span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-4">
          Conquiste as <strong className="text-amber-600 dark:text-amber-400">300 fases</strong> para enfrentar o <strong className="text-red-600">Chefão Bowser</strong>! Resolva os desafios matemáticos em <strong className="text-amber-500">10 segundos</strong>. Se cair no abismo, <strong className="text-rose-500">volta ao início do mapa</strong>!
        </p>

        {/* 3 Game Modes: 1P, 2P Local (Same PC), 2P Online (Different PCs) */}
        <div className="mb-4 text-left">
          <label className="block text-[11px] font-pixel text-slate-500 dark:text-slate-400 uppercase mb-2">
            Escolha Como Jogar:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* 1 Player */}
            <button
              onClick={() => onSelectGameMode('1P')}
              className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                gameMode === '1P'
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="text-xl mb-1">🔴</div>
              <div className="text-xs font-bold font-outfit">1 Jogador</div>
              <div className="text-[10px] opacity-75">Mario Solo</div>
            </button>

            {/* 2P Local (Same PC/Celular) */}
            <button
              onClick={() => onSelectGameMode('2P_LOCAL')}
              className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                gameMode === '2P_LOCAL'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="text-xl mb-1">🔴🟢</div>
              <div className="text-xs font-bold font-outfit">Mesmo PC/Celular</div>
              <div className="text-[10px] opacity-75">WASD + Setas</div>
            </button>

            {/* 2P Online (Different PCs) */}
            <button
              onClick={() => {
                onSelectGameMode('2P_ONLINE');
                onOpenOnlineModal();
              }}
              className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                gameMode === '2P_ONLINE'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="text-xl mb-1">🌐</div>
              <div className="text-xs font-bold font-outfit">PCs Diferentes</div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Câmeras Próprias!</div>
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-left text-xs">
          <div className="bg-amber-50 dark:bg-slate-800 p-2.5 rounded-xl border border-amber-200 dark:border-slate-700">
            <span className="text-lg block mb-0.5">⏱️ 10s</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Matemática</div>
            <div className="text-[10px] text-slate-500">Responda antes do tempo</div>
          </div>
          <div className="bg-red-50 dark:bg-slate-800 p-2.5 rounded-xl border border-red-200 dark:border-slate-700">
            <span className="text-lg block mb-0.5">💀 Abismo</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Volta ao Início</div>
            <div className="text-[10px] text-slate-500">Caiu = recomeça fase 0</div>
          </div>
          <div className="bg-yellow-50 dark:bg-slate-800 p-2.5 rounded-xl border border-yellow-200 dark:border-slate-700">
            <span className="text-lg block mb-0.5">👑 Fase 300</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Chefão Bowser</div>
            <div className="text-[10px] text-slate-500">Derrote o Boss para zerar</div>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-4 text-left">
          <label className="block text-[11px] font-pixel text-slate-500 dark:text-slate-400 uppercase mb-2">
            Nível dos Desafios:
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'adaptativo', label: 'Adaptativo' },
              { id: 'facil', label: 'Fácil' },
              { id: 'medio', label: 'Médio' },
              { id: 'dificil', label: 'Desafio' },
            ].map((diff) => (
              <button
                key={diff.id}
                onClick={() => onSelectDifficulty(diff.id as MathDifficulty)}
                className={`py-1.5 px-1 text-xs font-bold rounded-lg border-2 transition-all cursor-pointer truncate ${
                  mathDifficulty === diff.id
                    ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {diff.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start Game Button */}
        {gameMode === '2P_ONLINE' ? (
          <button
            onClick={onOpenOnlineModal}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-outfit text-lg font-black rounded-2xl pixel-shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer mb-2"
          >
            <Globe className="w-6 h-6" />
            <span>CRIAR / ENTRAR EM SALA ONLINE</span>
          </button>
        ) : (
          <button
            onClick={onStart}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-outfit text-xl font-black rounded-2xl pixel-shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer mb-2"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>INICIAR JOGO LOCAL</span>
          </button>
        )}

        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-pixel">
          Mario: [A, D, Espaço] · Luigi: [⬅️, ➡️, ⬆️]
        </div>
      </div>
    </div>
  );
};
