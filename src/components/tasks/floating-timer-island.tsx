"use client";

import { Button } from "@/components/ui/button";
import { useTimer } from "@/providers/timer-provider";
import { CheckCircle2, Clock, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

export function FloatingTimerIsland() {
  const {
    hasActiveTimer,
    getActiveTimerState,
    toggleActiveTimer,
    resetActiveTimer,
    completeActiveTimer,
  } = useTimer();

  const [timerState, setTimerState] = useState(getActiveTimerState());

  // Atualizar o estado do timer ativo periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerState(getActiveTimerState());
    }, 100);

    return () => clearInterval(interval);
  }, [getActiveTimerState]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}:` : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Estado vazio - sempre visível mas minimizado quando não há timer
  if (!hasActiveTimer || !timerState) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary m-4 rounded-md shadow-2xl">
        <div className="flex items-center justify-center px-6 py-4 max-w-7xl mx-auto">
          <div className="text-xs text-background">
            Selecione uma tarefa para iniciar o timer
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary m-4 rounded-md shadow-2xl">
      <div className="grid grid-cols-3 px-6 py-3 max-w-7xl mx-auto">
        {/* Esquerda - Info da Tarefa (estilo YouTube Music) */}
        <div className="flex items-center gap-4 text-background">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm truncate">{timerState.taskTitle}</span>
          </div>
        </div>

        {/* Centro - Timer Grande */}
        <div className="flex items-center justify-center gap-4 text-background">
          <div className=" font-mono font-bold tabular-nums tracking-tight">
            {formatTime(timerState.elapsedSeconds)}
          </div>
        </div>

        {/* Direita - Controles */}
        <div className="flex items-center justify-end gap-2 text-background">
          {/* Reset */}
          <Button
            variant="ghost"
            size="icon"
            className="size-4 rounded-full hover:bg-muted"
            onClick={resetActiveTimer}
            title="Reiniciar timer"
          >
            <RotateCcw className="size-4" />
          </Button>

          {/* Play/Pause - Botão principal destacado */}
          <Button
            size="icon"
            className="size-5"
            variant="ghost"
            onClick={toggleActiveTimer}
          >
            {timerState.isRunning ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </Button>

          {/* Concluir */}
          <Button
            variant="ghost"
            size="icon"
            className="size-5"
            onClick={completeActiveTimer}
            title="Concluir tarefa"
          >
            <CheckCircle2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
