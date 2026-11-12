import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { MathChallenge, PowerUpType } from '../types/game';
import { sound } from '../services/sound';
import { Sparkles, Heart, Clock, Award, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface MathChallengeModalProps {
  challenge: MathChallenge;
  streak: number;
  onSolve: (success: boolean, rewardPowerUp: PowerUpType, rewardCoins: number) => void;
}

const POWERUP_DETAILS: Record<PowerUpType, { name: string; desc: string; icon: string; color: string }> = {
  SUPER_JUMP: {
    name: 'Super Salto',
    desc: 'Salte 40% mais alto por 20 segundos!',
    icon: '🦘',
    color: 'from-blue-500 to-indigo-600',
  },
  COIN_MAGNET: {
    name: 'Ímã de Moedas',
    desc: 'Atrai moedas automaticamente até você!',
    icon: '🧲',
    color: 'from-amber-400 to-orange-500',
  },
  STAR_SHIELD: {
    name: 'Escudo Estrela',
    desc: 'Invencibilidade temporária e brilho estelar!',
    icon: '⭐',
    color: 'from-yellow-300 to-amber-500',
  },
  DOUBLE_COINS: {
    name: 'Moedas em Dobro',
    desc: 'Todas as moedas valem o dobro de pontos!',
    icon: '💰',
    color: 'from-emerald-400 to-teal-600',
  },
  NONE: {
    name: 'Sem Poder',
    desc: 'Bônus normal',
    icon: '✨',
    color: 'from-slate-400 to-slate-600',
  },
};

export const MathChallengeModal: React.FC<MathChallengeModalProps> = ({
  challenge,
  streak,
  onSolve,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);

  // 10 Seconds Countdown Timer!
  const totalTime = challenge.timeLimitSeconds || 10;
  const [timeLeft, setTimeLeft] = useState<number>(totalTime);
  const lastSecondRef = useRef<number>(totalTime);

  const powerupInfo = POWERUP_DETAILS[challenge.rewardPowerUp] || POWERUP_DETAILS.COIN_MAGNET;

  // Countdown timer loop
  useEffect(() => {
    if (isAnswered) return;

    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      const remaining = Math.max(0, totalTime - elapsed);
      setTimeLeft(remaining);

      // Play tick sound on whole seconds
      const currentInt = Math.ceil(remaining);
      if (currentInt !== lastSecondRef.current && currentInt <= 10 && currentInt > 0) {
        lastSecondRef.current = currentInt;
        sound.playTimerTick();
      }

      if (remaining <= 0) {
        clearInterval(interval);
        handleTimeout();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isAnswered, totalTime]);

  const handleTimeout = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    setIsTimedOut(true);
    setIsCorrect(false);
    sound.playMathFail();
  };

  const handleSelectOption = (option: number) => {
    if (isAnswered) return;

    setSelectedOption(option);
    setIsAnswered(true);

    const correct = option === challenge.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      sound.playMathSuccess();
      try {
        confetti({
          particleCount: 75,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#facc15', '#22c55e', '#3b82f6', '#ec4899'],
        });
      } catch {}
    } else {
      sound.playMathFail();
    }
  };

  const handleContinue = () => {
    onSolve(isCorrect, challenge.rewardPowerUp, challenge.rewardCoins);
  };

  // Keyboard shortcut support (1, 2, 3, 4 and Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAnswered) {
        if (e.key === '1' && challenge.options[0] !== undefined) handleSelectOption(challenge.options[0]);
        if (e.key === '2' && challenge.options[1] !== undefined) handleSelectOption(challenge.options[1]);
        if (e.key === '3' && challenge.options[2] !== undefined) handleSelectOption(challenge.options[2]);
        if (e.key === '4' && challenge.options[3] !== undefined) handleSelectOption(challenge.options[3]);
      } else {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleContinue();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, challenge, isCorrect]);

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));
  const isUrgent = timeLeft <= 3.5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border-4 border-amber-400 pixel-shadow-lg overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Retro Header Banner */}
        <div className={`px-6 py-4 text-white flex items-center justify-between border-b-4 ${
          challenge.isBossChallenge
            ? 'bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 border-red-700'
            : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 border-amber-600'
        }`}>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-yellow-200 animate-spin" style={{ animationDuration: '6s' }} />
            <div>
              <span className="font-pixel text-[10px] tracking-wider text-yellow-200 uppercase block">
                {challenge.isBossChallenge ? '⚔️ DESAFIO DO CHEFÃO BOWSER' : '⚡ DESAFIO MATEMÁTICO'}
              </span>
              <h2 className="font-outfit font-black text-xl leading-tight">
                Plataforma {challenge.platformIndex} / 300
              </h2>
            </div>
          </div>

          {streak > 0 && (
            <div className="flex items-center gap-1.5 bg-black/25 px-3 py-1 rounded-full text-xs font-bold text-yellow-200">
              <span>🔥</span>
              <span>Combo x{streak}</span>
            </div>
          )}
        </div>

        {/* 10-Second Countdown Timer Bar */}
        {!isAnswered && (
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 relative overflow-hidden border-b border-slate-300 dark:border-slate-700">
            <div
              className={`h-full transition-all duration-75 ${
                isUrgent
                  ? 'bg-red-500 animate-pulse'
                  : timeLeft <= 6
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Content Area */}
        <div className="p-6">
          {!isAnswered ? (
            <>
              {/* Timer Pill */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍄</span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Mario & Luigi Cooperativo
                  </span>
                </div>

                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-pixel text-xs border ${
                  isUrgent
                    ? 'bg-red-100 text-red-600 border-red-300 animate-bounce'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeLeft.toFixed(1)}s</span>
                </div>
              </div>

              {/* Question Box */}
              <div className="bg-sky-50 dark:bg-slate-800/80 rounded-2xl p-5 mb-5 border-2 border-sky-200 dark:border-slate-700 text-center">
                <span className="text-[11px] font-pixel text-sky-700 dark:text-sky-300 uppercase tracking-wider block mb-2">
                  Resolva antes dos 10 segundos acabarem!
                </span>
                <div className="font-outfit text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-wide my-1">
                  {challenge.expression} = <span className="text-amber-500">?</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {challenge.question}
                </p>
              </div>

              {/* Options Grid (4 options) */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {challenge.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(opt)}
                    className="group relative flex items-center justify-center gap-2 py-4 px-4 bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-900/40 border-2 border-slate-300 dark:border-slate-700 hover:border-amber-400 rounded-2xl font-outfit text-2xl font-black text-slate-800 dark:text-slate-100 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <span className="absolute left-3 top-2 text-[10px] font-pixel text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      [{idx + 1}]
                    </span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-pixel">
                <span>Atalho: 1, 2, 3, 4</span>
                <span>⏱️ Máximo 10s</span>
              </div>
            </>
          ) : (
            /* Result Feedback View */
            <div className="text-center py-2 animate-in zoom-in-95 duration-200">
              {isCorrect ? (
                <>
                  <div className="inline-flex p-3 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mb-3">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-black font-outfit text-emerald-600 dark:text-emerald-400 mb-1">
                    Excelente! Resposta Certa!
                  </h3>
                  <div className="inline-block bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold mb-3 border border-emerald-200 dark:border-emerald-800">
                    ⚡ Resolvido em {(totalTime - timeLeft).toFixed(1)}s (+{Math.round(timeLeft * 20)} pts de agilidade!)
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    {challenge.explanation}
                  </p>

                  {/* Reward Card */}
                  <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 dark:from-slate-800 dark:to-slate-800/80 border-2 border-emerald-300 dark:border-emerald-700/60 rounded-2xl p-4 mb-5 text-left">
                    <span className="text-[10px] font-pixel text-emerald-700 dark:text-emerald-300 uppercase block mb-2">
                      Recompensas Desbloqueadas:
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-200 dark:border-slate-700">
                        <span className="text-xl block mb-0.5">🪙</span>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          +{challenge.rewardCoins} Moedas
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-200 dark:border-slate-700">
                        <Heart className="w-5 h-5 text-red-500 fill-red-500 mx-auto mb-0.5" />
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          +1 Vida Extra
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-200 dark:border-slate-700">
                        <span className="text-xl block mb-0.5">{powerupInfo.icon}</span>
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">
                          {powerupInfo.name}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="inline-flex p-3 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 mb-3">
                    <XCircle className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-black font-outfit text-red-600 dark:text-red-400 mb-1">
                    {isTimedOut ? 'Tempo Esgotado! ⏰' : 'Resposta Incorreta!'}
                  </h3>
                  <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl p-4 mb-4 text-left">
                    <div className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                      A resposta correta era: <strong className="text-lg underline">{challenge.correctAnswer}</strong>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {challenge.explanation}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    {isTimedOut
                      ? 'Os 10 segundos acabaram! Vocês perderam 1 vida, mas continuem firmes!'
                      : 'Vocês perderam 1 vida, mas não desistam! Rumo à fase 300!'}
                  </p>
                </>
              )}

              {/* Action Button */}
              <button
                onClick={handleContinue}
                className={`w-full py-3.5 px-6 rounded-2xl font-outfit text-lg font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${
                  isCorrect
                    ? 'bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20'
                    : 'bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20'
                }`}
              >
                <span>Continuar Aventura</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
