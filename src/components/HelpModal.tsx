import React from 'react';
import { MathDifficulty } from '../types/game';
import { X, Award, Shield, Zap, Sparkles } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  mathDifficulty: MathDifficulty;
  onSelectDifficulty: (d: MathDifficulty) => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  mathDifficulty,
  onSelectDifficulty,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border-4 border-amber-400 pixel-shadow-lg overflow-hidden text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3.5 text-white flex items-center justify-between border-b-4 border-blue-700">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍄</span>
            <h2 className="font-outfit font-extrabold text-lg">Como Jogar & Regras</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Controls */}
          <div>
            <h3 className="text-xs font-pixel text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
              Controles Multiplayer
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg border border-red-200 dark:border-red-900/50">
                <span className="font-bold block text-red-600 dark:text-red-400 mb-0.5">🔴 Jogador 1 (Mario)</span>
                <span className="text-slate-700 dark:text-slate-300"><strong>A / D:</strong> Mover</span>
                <br />
                <span className="text-slate-700 dark:text-slate-300"><strong>Espaço / W:</strong> Pular</span>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                <span className="font-bold block text-emerald-600 dark:text-emerald-400 mb-0.5">🟢 Jogador 2 (Luigi)</span>
                <span className="text-slate-700 dark:text-slate-300"><strong>⬅️ ➡️:</strong> Mover</span>
                <br />
                <span className="text-slate-700 dark:text-slate-300"><strong>⬆️ / Enter:</strong> Pular</span>
              </div>
            </div>
          </div>

          {/* Gameplay Rules */}
          <div>
            <h3 className="text-xs font-pixel text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
              Regras Principais
            </h3>
            <ul className="text-xs space-y-2 text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">1.</span>
                <span><strong>Caiu no abismo = Início do Mapa!</strong> Se cair no abismo, você morre, perde 1 vida e retorna imediatamente à Plataforma 0.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">2.</span>
                <span><strong>Desafio de Matemática com 10 segundos:</strong> Nos portais, você tem apenas 10 segundos para responder e ganhar poderes e vidas!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 font-bold">3.</span>
                <span><strong>300 Fases & Chefão Bowser:</strong> Alcance a fase 300 para zerar o jogo em uma batalha épica contra o Chefão! Corte a corrente com o Machado dourado para vencê-lo!</span>
              </li>
            </ul>
          </div>

          {/* Difficulty Selection */}
          <div>
            <h3 className="text-xs font-pixel text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
              Dificuldade Matemática
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'adaptativo', label: 'Adaptativo', desc: 'Aumenta conforme avança' },
                { id: 'facil', label: 'Fácil', desc: 'Soma e subtração' },
                { id: 'medio', label: 'Médio', desc: 'Tabuadas e dezenas' },
                { id: 'dificil', label: 'Desafio', desc: 'Expressões e divisões' },
              ].map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => onSelectDifficulty(diff.id as MathDifficulty)}
                  className={`p-2.5 rounded-lg border-2 text-left transition-all cursor-pointer ${
                    mathDifficulty === diff.id
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">{diff.label}</div>
                  <div className="text-[10px] opacity-75">{diff.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
          >
            Voltar ao Jogo
          </button>
        </div>
      </div>
    </div>
  );
};
