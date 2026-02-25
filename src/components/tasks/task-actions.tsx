'use client'

import { completeTask, updateTaskStatus } from "@/app/actions/tasks"
import { tasks } from "@/database/schemas/tasks"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

type Task = typeof tasks.$inferSelect

interface TaskActionsProps {
  task: Task
  onDurationChange?: (duration: number) => void
}

export function TaskActions({ task, onDurationChange }: TaskActionsProps) {
  const [status, setStatus] = useState(task.status)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(task.durationSeconds || 0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (onDurationChange) {
      onDurationChange(elapsedSeconds)
    }
  }, [elapsedSeconds, onDurationChange])

  const toggleTimer = () => {
    if (isTimerRunning) {
      if (timerRef.current) clearInterval(timerRef.current)
      setIsTimerRunning(false)
    } else {
      setIsTimerRunning(true)
      setStatus("in_progress")
      updateTaskStatus(task.id, "in_progress")

      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    }
  }

  const handleComplete = async (finalDuration: number, correct?: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsTimerRunning(false)

    try {
      await completeTask(task.id, {
        durationSeconds: finalDuration,
        correctItems: correct
      })
      toast.success("Tarefa concluída!")
      setStatus("done")
      router.refresh()
    } catch (error) {
      toast.error("Erro ao concluir tarefa")
    }
  }

  // ... (This component Logic was mostly merged into TaskList.tsx for simplicity in previous step. 
  // Creating this file as a standalone if needed later, but for now TaskList handles it.
  // I will skip fully implementing this duplicate logic unless requested to decouple.
  // Instead, I'll provide a hook or utility if needed. 
  // Actually, I merged this into TaskList in the previous step, so this file might be redundant.
  // I will write a simple export to avoid errors if I import it elsewhere, or just delete logic.)

  return null // Logic moved to TaskList for better state co-location in this simple version
}

// Re-exporting CompletionDialog from here or TaskList to be cleaner?
// For now, I'll leave TaskList self-contained for the "List" view.
