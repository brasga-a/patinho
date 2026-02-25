'use client'

import { completeTask, updateTaskStatus } from "@/app/actions/tasks"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { tasks } from "@/database/schemas/tasks"
import { CheckCircle2, Clock, Pause, Play } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

type Task = typeof tasks.$inferSelect & {
  tags: { id: string; name: string; color: string }[]
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <div className="space-y-4">
      {tasks.length === 0 && (
        <div className="text-center text-muted-foreground py-10">
          Nenhuma tarefa encontrada.
        </div>
      )}
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  )
}

function TaskItem({ task }: { task: Task }) {
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

  const toggleTimer = () => {
    if (isTimerRunning) {
      if (timerRef.current) clearInterval(timerRef.current)
      setIsTimerRunning(false)
      // Save progress (optional implementation for pause)
    } else {
      setIsTimerRunning(true)
      setStatus("in_progress")
      // Optimistic update
      updateTaskStatus(task.id, "in_progress")

      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h > 0 ? `${h}h ` : ''}${m}m ${s}s`
  }

  const handleComplete = async (finalDuration: number, correctItems?: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsTimerRunning(false)

    try {
      await completeTask(task.id, {
        durationSeconds: finalDuration,
        correctItems
      })
      toast.success("Tarefa concluída!")
      setStatus("done")
      router.refresh()
    } catch (error) {
      toast.error("Erro ao concluir tarefa")
    }
  }

  return (
    <Card className={`transition-all ${status === 'done' ? 'opacity-60' : ''}`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </span>
            {task.tags.map((tag) => (
              <Badge key={tag.id} style={{ backgroundColor: tag.color }} className="text-[10px] h-5 px-1.5">
                {tag.name}
              </Badge>
            ))}
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 uppercase">
              {task.type === 'question_set' ? 'Lista' : task.type === 'simple' ? 'Simples' : 'Outro'}
            </Badge>
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
          )}
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
            <Clock className="w-3 h-3" />
            {formatTime(elapsedSeconds)}
            {task.totalItems && (
              <span>• {task.totalItems} questões</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status !== 'done' && (
            <>
              <Button
                variant={isTimerRunning ? "destructive" : "secondary"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={toggleTimer}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>

              <CompletionDialog
                task={task}
                currentDuration={elapsedSeconds}
                onConfirm={handleComplete}
              >
                <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-green-500 text-green-500 hover:text-green-600 hover:bg-green-50">
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              </CompletionDialog>
            </>
          )}
          {status === 'done' && (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function CompletionDialog({
  task,
  currentDuration,
  onConfirm,
  children
}: {
  task: Task,
  currentDuration: number,
  onConfirm: (duration: number, correct?: number) => void,
  children: React.ReactNode
}) {
  const [durationInput, setDurationInput] = useState(Math.round(currentDuration / 60).toString())
  const [correctInput, setCorrectInput] = useState("")
  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    const durationMinutes = parseInt(durationInput) || 0
    const durationSeconds = durationMinutes * 60
    const correct = task.type === 'question_set' ? parseInt(correctInput) : undefined

    onConfirm(durationSeconds, correct)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Concluir Tarefa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tempo total (minutos)</Label>
            <Input
              type="number"
              value={durationInput}
              onChange={(e) => setDurationInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              O timer marcou {Math.floor(currentDuration / 60)}m {currentDuration % 60}s. Ajuste se necessário.
            </p>
          </div>

          {task.type === 'question_set' && (
            <div className="space-y-2">
              <Label>Acertos (de {task.totalItems} questões)</Label>
              <Input
                type="number"
                max={task.totalItems || 9999}
                value={correctInput}
                onChange={(e) => setCorrectInput(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleConfirm}>Concluir</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
