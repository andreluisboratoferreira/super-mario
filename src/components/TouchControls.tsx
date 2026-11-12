import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';

interface TouchControlsProps {
  onLeftStart: () => void;
  onLeftEnd: () => void;
  onRightStart: () => void;
  onRightEnd: () => void;
  onJumpStart: () => void;
  onJumpEnd: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onLeftStart,
  onLeftEnd,
  onRightStart,
  onRightEnd,
  onJumpStart,
  onJumpEnd,
}) => {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 px-4 sm:px-8 pointer-events-none select-none flex items-center justify-between">
      {/* Directional Pad */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            onLeftStart();
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            onLeftEnd();
          }}
          onPointerLeave={(e) => {
            e.preventDefault();
            onLeftEnd();
          }}
          onPointerCancel={(e) => {
            e.preventDefault();
            onLeftEnd();
          }}
          aria-label="Mover para esquerda"
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-900/80 active:bg-amber-500/90 hover:bg-slate-800/90 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-white active:scale-95 transition-transform pixel-shadow cursor-pointer select-none"
        >
          <ArrowLeft className="w-8 h-8 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            onRightStart();
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            onRightEnd();
          }}
          onPointerLeave={(e) => {
            e.preventDefault();
            onRightEnd();
          }}
          onPointerCancel={(e) => {
            e.preventDefault();
            onRightEnd();
          }}
          aria-label="Mover para direita"
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-900/80 active:bg-amber-500/90 hover:bg-slate-800/90 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-white active:scale-95 transition-transform pixel-shadow cursor-pointer select-none"
        >
          <ArrowRight className="w-8 h-8 stroke-[2.5]" />
        </button>
      </div>

      {/* Jump Button */}
      <div className="pointer-events-auto">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            onJumpStart();
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            onJumpEnd();
          }}
          onPointerLeave={(e) => {
            e.preventDefault();
            onJumpEnd();
          }}
          onPointerCancel={(e) => {
            e.preventDefault();
            onJumpEnd();
          }}
          aria-label="Pular"
          className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-red-600/90 active:bg-red-500 hover:bg-red-600 backdrop-blur-md border-4 border-amber-300 flex flex-col items-center justify-center text-white active:scale-90 transition-transform pixel-shadow cursor-pointer select-none"
        >
          <ArrowUp className="w-8 h-8 -mb-1 stroke-[3]" />
          <span className="font-pixel text-[9px] tracking-wider text-yellow-200">
            PULAR
          </span>
        </button>
      </div>
    </div>
  );
};
