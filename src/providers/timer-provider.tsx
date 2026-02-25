"use client";

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const STORAGE_KEY_PREFIX = "task-timer-";
const LAST_ACTIVE_KEY = "last-active-timer";
const ONE_HOUR_MS = 60 * 60 * 1000;

interface TimerState {
  taskId: string;
  taskTitle: string;
  elapsedSeconds: number;
  isRunning: boolean;
  lastUpdated: number;
}

interface TimerContextType {
  activeTimerId: string | null;
  registerTimer: (
    taskId: string,
    taskTitle: string,
    initialSeconds: number,
    onComplete?: (taskId: string, elapsedSeconds: number) => void,
  ) => {
    isRunning: boolean;
    elapsedSeconds: number;
    start: () => void;
    pause: () => void;
    reset: () => void;
    complete: () => void;
    updateElapsed: (seconds: number) => void;
  };
  hasActiveTimer: boolean;
  getTimerState: (taskId: string) => TimerState | null;
  toggleActiveTimer: () => void;
  resetActiveTimer: () => void;
  completeActiveTimer: () => void;
  getActiveTimerState: () => TimerState | null;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Dados internos de cada timer
interface InternalTimer {
  accumulatedSeconds: number; // Segundos acumulados de sessões anteriores
  startedAt: number | null; // Timestamp de quando começou a rodar (null = pausado)
  taskTitle: string;
  lastUpdated: number;
  onComplete?: (taskId: string, elapsedSeconds: number) => void;
}

function getElapsed(timer: InternalTimer): number {
  const base = timer.accumulatedSeconds;
  if (timer.startedAt === null) return base;
  return base + Math.floor((Date.now() - timer.startedAt) / 1000);
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const timersRef = useRef<Map<string, InternalTimer>>(new Map());

  // Carregar timers salvos do localStorage ao iniciar
  useEffect(() => {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith(STORAGE_KEY_PREFIX),
    );
    let lastActiveTimerId: string | null = null;

    for (const key of keys) {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const data = JSON.parse(saved);
          const taskId = key.replace(STORAGE_KEY_PREFIX, "");
          const now = Date.now();

          if (now - data.timestamp < ONE_HOUR_MS) {
            timersRef.current.set(taskId, {
              accumulatedSeconds: data.elapsedSeconds,
              startedAt: null,
              taskTitle: data.taskTitle || "Tarefa",
              lastUpdated: now,
            });
          } else {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.error("Erro ao carregar timer:", e);
      }
    }

    // Restaurar o último timer ativo
    try {
      const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
      if (lastActive && timersRef.current.has(lastActive)) {
        const timer = timersRef.current.get(lastActive);
        if (timer) {
          // Restaurar o timer como pausado (startedAt = null)
          timer.startedAt = null;
          timer.lastUpdated = Date.now();
          lastActiveTimerId = lastActive;
        }
      }
    } catch (e) {
      console.error("Erro ao restaurar timer ativo:", e);
    }

    // Atualizar o estado com o último timer ativo
    if (lastActiveTimerId) {
      setActiveTimerId(lastActiveTimerId);
    }
  }, []);

  const saveTimerToStorage = useCallback(
    (taskId: string, timer: InternalTimer) => {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${taskId}`,
        JSON.stringify({
          elapsedSeconds: getElapsed(timer),
          taskTitle: timer.taskTitle,
          timestamp: Date.now(),
        }),
      );
      // Salvar qual timer estava ativo
      if (timer.startedAt !== null) {
        localStorage.setItem(LAST_ACTIVE_KEY, taskId);
      }
    },
    [],
  );

  const clearTimerFromStorage = useCallback((taskId: string) => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${taskId}`);
    localStorage.removeItem(LAST_ACTIVE_KEY);
  }, []);

  // Pausar todos os timers exceto o especificado
  const pauseOtherTimers = useCallback(
    (exceptTaskId: string) => {
      timersRef.current.forEach((timer, taskId) => {
        if (taskId !== exceptTaskId && timer.startedAt !== null) {
          // Consolidar tempo antes de pausar
          timer.accumulatedSeconds = getElapsed(timer);
          timer.startedAt = null;
          timer.lastUpdated = Date.now();
          saveTimerToStorage(taskId, timer);
        }
      });
    },
    [saveTimerToStorage],
  );

  const registerTimer = useCallback(
    (
      taskId: string,
      taskTitle: string,
      initialSeconds: number = 0,
      onComplete?: (taskId: string, elapsedSeconds: number) => void,
    ) => {
      // Verificar se já existe timer salvo
      const savedKey = `${STORAGE_KEY_PREFIX}${taskId}`;
      let startSeconds = initialSeconds;

      try {
        const saved = localStorage.getItem(savedKey);
        if (saved) {
          const data = JSON.parse(saved);
          const now = Date.now();
          if (now - data.timestamp < ONE_HOUR_MS) {
            startSeconds = data.elapsedSeconds;
          } else {
            localStorage.removeItem(savedKey);
          }
        }
      } catch (e) {
        console.error("Erro ao carregar timer salvo:", e);
      }

      // Inicializar ou atualizar o timer no ref
      if (!timersRef.current.has(taskId)) {
        timersRef.current.set(taskId, {
          accumulatedSeconds: startSeconds,
          startedAt: null,
          taskTitle,
          lastUpdated: Date.now(),
          onComplete,
        });
      } else {
        // Atualizar callback mesmo que o timer já exista
        const existing = timersRef.current.get(taskId);
        if (existing) existing.onComplete = onComplete;
      }

      const timer = timersRef.current.get(taskId);
      if (!timer) {
        throw new Error("Timer registration failed");
      }

      const start = () => {
        pauseOtherTimers(taskId);

        if (timer.startedAt === null) {
          timer.startedAt = Date.now();
          timer.lastUpdated = Date.now();
          setActiveTimerId(taskId);
        }
      };

      const pause = () => {
        if (timer.startedAt !== null) {
          timer.accumulatedSeconds = getElapsed(timer);
          timer.startedAt = null;
          timer.lastUpdated = Date.now();
          saveTimerToStorage(taskId, timer);

          if (activeTimerId === taskId) {
            setActiveTimerId(null);
          }
        }
      };

      const reset = () => {
        timer.accumulatedSeconds = initialSeconds;
        timer.startedAt = null;
        timer.lastUpdated = Date.now();
        clearTimerFromStorage(taskId);

        if (activeTimerId === taskId) {
          setActiveTimerId(null);
        }
      };

      const complete = () => {
        const elapsed = getElapsed(timer);
        timer.accumulatedSeconds = elapsed;
        timer.startedAt = null;
        timer.lastUpdated = Date.now();

        clearTimerFromStorage(taskId);
        timersRef.current.delete(taskId);

        if (activeTimerId === taskId) {
          setActiveTimerId(null);
        }
      };

      const updateElapsed = (seconds: number) => {
        timer.accumulatedSeconds = seconds;
        timer.startedAt = null;
        timer.lastUpdated = Date.now();
      };

      return {
        isRunning: timer.startedAt !== null,
        elapsedSeconds: getElapsed(timer),
        start,
        pause,
        reset,
        complete,
        updateElapsed,
      };
    },
    [
      activeTimerId,
      pauseOtherTimers,
      saveTimerToStorage,
      clearTimerFromStorage,
    ],
  );

  const getTimerState = useCallback((taskId: string): TimerState | null => {
    const timer = timersRef.current.get(taskId);
    if (!timer) return null;

    return {
      taskId,
      taskTitle: timer.taskTitle,
      elapsedSeconds: getElapsed(timer),
      isRunning: timer.startedAt !== null,
      lastUpdated: timer.lastUpdated,
    };
  }, []);

  const getActiveTimerState = useCallback((): TimerState | null => {
    if (!activeTimerId) return null;
    return getTimerState(activeTimerId);
  }, [activeTimerId, getTimerState]);

  const toggleActiveTimer = useCallback(() => {
    if (!activeTimerId) return;
    const timer = timersRef.current.get(activeTimerId);
    if (!timer) return;

    if (timer.startedAt !== null) {
      // Pausar
      timer.accumulatedSeconds = getElapsed(timer);
      timer.startedAt = null;
      timer.lastUpdated = Date.now();
      saveTimerToStorage(activeTimerId, timer);
    } else {
      // Iniciar
      timer.startedAt = Date.now();
      timer.lastUpdated = Date.now();
    }
  }, [activeTimerId, saveTimerToStorage]);

  const resetActiveTimer = useCallback(() => {
    if (!activeTimerId) return;
    const timer = timersRef.current.get(activeTimerId);
    if (!timer) return;

    timer.accumulatedSeconds = 0;
    timer.startedAt = null;
    timer.lastUpdated = Date.now();
    clearTimerFromStorage(activeTimerId);
  }, [activeTimerId, clearTimerFromStorage]);

  const completeActiveTimer = useCallback(() => {
    if (!activeTimerId) return;
    const timer = timersRef.current.get(activeTimerId);
    if (!timer) return;

    const elapsed = getElapsed(timer);
    timer.accumulatedSeconds = elapsed;
    timer.startedAt = null;
    timer.lastUpdated = Date.now();

    // Chamar callback de conclusão se registrado
    if (timer.onComplete) {
      timer.onComplete(activeTimerId, elapsed);
    }

    clearTimerFromStorage(activeTimerId);
    timersRef.current.delete(activeTimerId);
    setActiveTimerId(null);
  }, [activeTimerId, clearTimerFromStorage]);

  return (
    <TimerContext.Provider
      value={{
        activeTimerId,
        registerTimer,
        hasActiveTimer: !!activeTimerId,
        getTimerState,
        toggleActiveTimer,
        resetActiveTimer,
        completeActiveTimer,
        getActiveTimerState,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}
