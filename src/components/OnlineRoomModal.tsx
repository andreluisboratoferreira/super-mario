import React, { useState, useEffect } from 'react';
import { network } from '../services/network';
import { sound } from '../services/sound';
import { X, Copy, Check, Users, Globe, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface OnlineRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOnlineGame: (roomId: string, character: 'mario' | 'luigi') => void;
}

export const OnlineRoomModal: React.FC<OnlineRoomModalProps> = ({
  isOpen,
  onClose,
  onStartOnlineGame,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [selectedChar, setSelectedChar] = useState<'mario' | 'luigi'>('mario');
  const [joinCode, setJoinCode] = useState<string>('');
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [isWaitingPeer, setIsWaitingPeer] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setCreatedRoomCode(null);
      setIsWaitingPeer(false);
      setErrorMessage(null);
      return;
    }

    // Listen for peer join event
    const cleanup = network.on('MATCH_START', (data) => {
      sound.playPowerUp();
      onStartOnlineGame(data.roomId, network.myCharacter);
    });

    return () => {
      cleanup();
    };
  }, [isOpen, onStartOnlineGame]);

  if (!isOpen) return null;

  const handleCreateRoom = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await network.createRoom(selectedChar);
      setCreatedRoomCode(res.roomId);
      setIsWaitingPeer(true);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Falha ao conectar ao servidor.');
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      setErrorMessage('Digite o código da sala!');
      return;
    }
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await network.joinRoom(joinCode.trim().toUpperCase());
      setIsLoading(false);
      sound.playPowerUp();
      onStartOnlineGame(res.roomId, res.character);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Falha ao entrar na sala.');
    }
  };

  const handleCopyCode = () => {
    if (createdRoomCode) {
      navigator.clipboard.writeText(createdRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border-4 border-amber-400 pixel-shadow-lg overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 px-5 py-4 text-white flex items-center justify-between border-b-4 border-indigo-700">
          <div className="flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-sky-200 animate-spin" style={{ animationDuration: '10s' }} />
            <div>
              <span className="font-pixel text-[10px] tracking-wider text-yellow-300 uppercase block">
                Multiplayer Online
              </span>
              <h2 className="font-outfit font-black text-xl leading-tight">
                Jogar em PCs Diferentes
              </h2>
            </div>
          </div>
          <button
            onClick={() => {
              network.disconnect();
              onClose();
            }}
            className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Camera Info Callout */}
          <div className="mb-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl p-3 text-xs text-sky-900 dark:text-sky-200">
            <strong>🎥 Câmeras Independentes:</strong> Em cada PC, a câmera acompanha exclusivamente o seu personagem (Mario ou Luigi) enquanto vocês exploram juntos!
          </div>

          {!isWaitingPeer ? (
            <>
              {/* Tab selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
                <button
                  onClick={() => {
                    setTab('create');
                    setErrorMessage(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    tab === 'create'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Criar Nova Sala
                </button>
                <button
                  onClick={() => {
                    setTab('join');
                    setErrorMessage(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    tab === 'join'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Entrar com Código
                </button>
              </div>

              {errorMessage && (
                <div className="mb-4 p-2.5 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-300 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {tab === 'create' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-pixel text-slate-500 uppercase mb-2">
                      Escolha seu Personagem:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedChar('mario')}
                        className={`p-3 rounded-xl border-2 text-left cursor-pointer flex items-center gap-2.5 transition-all ${
                          selectedChar === 'mario'
                            ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 font-bold'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        <span className="text-2xl">🔴</span>
                        <div>
                          <div className="text-xs font-bold font-outfit">Mario</div>
                          <div className="text-[10px] text-slate-500">Host da Sala</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedChar('luigi')}
                        className={`p-3 rounded-xl border-2 text-left cursor-pointer flex items-center gap-2.5 transition-all ${
                          selectedChar === 'luigi'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        <span className="text-2xl">🟢</span>
                        <div>
                          <div className="text-xs font-bold font-outfit">Luigi</div>
                          <div className="text-[10px] text-slate-500">Host da Sala</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateRoom}
                    disabled={isLoading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-outfit text-base font-bold rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Criar Sala e Gerar Código</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-pixel text-slate-500 uppercase mb-2">
                      Código da Sala:
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      placeholder="Ex: A94X"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="w-full py-3 px-4 font-pixel text-lg text-center tracking-widest bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl uppercase outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleJoinRoom}
                    disabled={isLoading || !joinCode.trim()}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-outfit text-base font-bold rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Conectar na Sala</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Waiting for second player view */
            <div className="text-center py-4">
              <div className="relative inline-flex p-4 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mb-3">
                <Users className="w-10 h-10 animate-pulse" />
              </div>

              <h3 className="font-outfit font-black text-xl text-slate-900 dark:text-white mb-1">
                Sala Criada com Sucesso!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Passe este código para o outro jogador entrar do PC dele:
              </p>

              {/* Room Code Badge */}
              <div className="flex items-center justify-center gap-3 bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border-2 border-blue-400 mb-4">
                <span className="font-pixel text-3xl font-black text-blue-600 dark:text-blue-400 tracking-widest">
                  {createdRoomCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  title="Copiar Código"
                  className="p-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-200" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Aguardando o segundo jogador conectar...</span>
              </div>

              <button
                onClick={() => {
                  network.disconnect();
                  setIsWaitingPeer(false);
                  setCreatedRoomCode(null);
                }}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
              >
                Cancelar Sala
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
