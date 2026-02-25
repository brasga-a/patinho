/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";

import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Calendar,
  CheckCircle2,
  Clock3,
  Filter,
  Pause,
  Play,
  PlusCircle,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  completeTask,
  deleteTask,
  updateTaskStatus,
} from "@/app/actions/tasks";
import { TaskForm } from "@/components/tasks/task-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTimer } from "@/providers/timer-provider";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

type Task = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: string;
  type: string;
  totalItems: number | null;
  correctItems: number | null;
  durationSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  tags: {
    id: string;
    name: string;
    color: string;
  }[];
};

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const hasActiveFilters =
    statusFilter !== "all" || typeFilter !== "all" || tagFilter !== "all";

  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setTagFilter("all");
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const tasks = table.getRowModel().rows.map((row) => row.original as Task);

  const uniqueTags = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; color: string }>();
    for (const task of tasks) {
      for (const tag of task.tags) {
        if (!seen.has(tag.id)) {
          seen.set(tag.id, tag);
        }
      }
    }
    return Array.from(seen.values());
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (typeFilter !== "all" && task.type !== typeFilter) return false;
      if (tagFilter !== "all") {
        if (tagFilter === "none" && task.tags.length > 0) return false;
        if (tagFilter !== "none" && !task.tags.some((t) => t.id === tagFilter))
          return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !task.title.toLowerCase().includes(q) &&
          !task.description?.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [tasks, statusFilter, typeFilter, tagFilter, searchQuery]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-2">
        <TaskDialog />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon-lg" className="gap-2 relative">
              <Filter className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="todo">A fazer</SelectItem>
                  <SelectItem value="in_progress">Em progresso</SelectItem>
                  <SelectItem value="done">Concluídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="simple">Simples</SelectItem>
                  <SelectItem value="question_set">
                    Lista de Questões
                  </SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Tag</Label>
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as tags</SelectItem>
                  <SelectItem value="none">Sem tag</SelectItem>
                  {uniqueTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={clearFilters}
              >
                <X className="w-3 h-3 mr-1.5" />
                Remover filtros
              </Button>
            )}
          </PopoverContent>
        </Popover>

        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>
      {filteredTasks.length ? (
        filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
      ) : (
        <div className="text-center text-muted-foreground py-10">
          Nenhuma tarefa encontrada.
        </div>
      )}
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const [status, setStatus] = useState(task.status);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(
    task.durationSeconds || 0,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [correctInput, setCorrectInput] = useState("");
  const [correctError, setCorrectError] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const router = useRouter();
  const { registerTimer, activeTimerId, getTimerState } = useTimer();
  const timerRef = useRef<ReturnType<typeof registerTimer> | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Callback chamado pelo floating island ao concluir
  const handleFloatingComplete = useCallback(
    async (_taskId: string, elapsed: number) => {
      try {
        await completeTask(task.id, {
          durationSeconds: elapsed,
        });
        toast.success("Tarefa concluída!");
        setStatus("done");
        router.refresh();
      } catch {
        toast.error("Erro ao concluir tarefa");
      }
    },
    [task.id, router],
  );

  // Registrar o timer ao montar o componente
  useEffect(() => {
    timerRef.current = registerTimer(
      task.id,
      task.title,
      task.durationSeconds || 0,
      handleFloatingComplete,
    );

    // Sincronizar o estado visual com o estado global do timer (lê valores vivos do ref)
    syncIntervalRef.current = setInterval(() => {
      const live = getTimerState(task.id);
      if (live) {
        setIsTimerRunning(live.isRunning);
        setElapsedSeconds(live.elapsedSeconds);
      }
    }, 100);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [task.id, task.title, task.durationSeconds, registerTimer, getTimerState]);

  const toggleTimer = () => {
    if (!timerRef.current) return;

    if (isTimerRunning) {
      timerRef.current.pause();
      setIsTimerRunning(false);
    } else {
      setStatus("in_progress");
      updateTaskStatus(task.id, "in_progress");
      timerRef.current.start();
      setIsTimerRunning(true);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h.toString().padStart(2, "0")}:` : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleComplete = async () => {
    // Validar acertos obrigatórios para question_set
    if (task.type === "question_set" && !correctInput.trim()) {
      setCorrectError("Informe os acertos para concluir a tarefa");
      return;
    }

    // Validar que acertos não pode ser maior que o total
    if (task.type === "question_set" && task.totalItems) {
      const correctValue = parseInt(correctInput);
      if (correctValue > task.totalItems) {
        setCorrectError(`Acertos não pode ser maior que ${task.totalItems}`);
        return;
      }
    }

    if (timerRef.current) {
      timerRef.current.complete();
    }
    setIsTimerRunning(false);

    const correctItems =
      task.type === "question_set" ? parseInt(correctInput) : undefined;

    try {
      await completeTask(task.id, {
        durationSeconds: elapsedSeconds,
        correctItems,
      });
      toast.success("Tarefa concluída!");
      setStatus("done");
      setCorrectInput("");
      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Erro ao concluir tarefa");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
      toast.success("Tarefa excluída!");
      setDialogOpen(false);
      setDeleteConfirmOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Erro ao excluir tarefa");
    }
  };

  const accuracy =
    task.totalItems && task.correctItems
      ? Math.round((task.correctItems / task.totalItems) * 100)
      : null;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger>
        <Card
          className={`transition-all cursor-pointer mt-2 hover:shadow-md p-2 ${status === "done" ? "opacity-60" : ""} ${isTimerRunning ? "border-primary/50" : ""}`}
        >
          <CardContent className="flex items-center justify-between px-2">
            <div className="flex flex-col flex-1 pr-5 items-start justify-center truncate">
              <div className="flex items-center justify-center gap-2">
                <span
                  className={`font-medium ${status === "done" ? "line-through text-muted-foreground" : ""}`}
                >
                  {task.title}
                </span>
                {task.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                ))}
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 truncate">
                  {task.description}
                </p>
              )}
              <div className="flex items-center mt-1 gap-2 text-xs text-muted-foreground">
                <Badge
                  variant="outline"
                  className="text-[10px] rounded-sm! h-5 px-1.5 uppercase"
                >
                  {task.type === "question_set"
                    ? "Lista"
                    : task.type === "simple"
                      ? "Simples"
                      : "Outro"}
                </Badge>
                <span className="text-muted-foreground">
                  {formatDate(task.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 font-mono text-sm tabular-nums ${isTimerRunning ? "text-primary" : "text-muted-foreground"}`}
              >
                {isTimerRunning && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                )}
                {!isTimerRunning && status !== "done" && (
                  <Clock3 className="w-3.5 h-3.5" />
                )}
                {status === "done" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                )}
                <span className="font-medium">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className={
                status === "done" ? "line-through text-muted-foreground" : ""
              }
            >
              {task.title}
            </span>
            {status === "done" && (
              <Badge variant="default" className="bg-green-500">
                Concluída
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Descrição */}
          {task.description && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Descrição</Label>
              <p className="text-sm leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Informações principais em grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Tipo */}
            <div className="space-y-1">
              <Label className="text-muted-foreground flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tipo
              </Label>
              <Badge variant="outline" className="uppercase">
                {task.type === "question_set"
                  ? "Lista de Questões"
                  : task.type === "simple"
                    ? "Tarefa Simples"
                    : task.type}
              </Badge>
            </div>

            {/* Tags */}
            {task.tags.length > 0 && (
              <div className="space-y-1">
                <Label className="text-muted-foreground flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Tags
                </Label>
                <div className="flex flex-wrap gap-1">
                  {task.tags.map((tag) => (
                    <Badge key={tag.id} style={{ backgroundColor: tag.color }}>
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Data de criação */}
            <div className="space-y-1">
              <Label className="text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Criada em
              </Label>
              <p className="text-sm">{formatDate(task.createdAt)}</p>
            </div>

            {/* Última atualização */}
            <div className="space-y-1">
              <Label className="text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Última atualização
              </Label>
              <p className="text-sm">{formatDate(task.updatedAt)}</p>
            </div>

            {/* Tempo total */}
            <div className="space-y-1">
              <Label className="text-muted-foreground flex items-center gap-1">
                <Clock3 className="w-3 h-3" /> Tempo registrado
              </Label>
              <p className="text-sm font-medium">
                {formatTime(elapsedSeconds)}
              </p>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label className="text-muted-foreground">Status</Label>
              <p className="text-sm font-medium capitalize">
                {status === "done"
                  ? "Concluída"
                  : status === "in_progress"
                    ? "Em progresso"
                    : status}
              </p>
            </div>
          </div>

          {task.type === "question_set" &&
            task.totalItems &&
            status === "done" && (
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <Label className="text-muted-foreground">Resultados</Label>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{task.totalItems}</p>
                    <p className="text-xs text-muted-foreground">
                      Total de questões
                    </p>
                  </div>
                  {task.correctItems !== null && (
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {task.correctItems}
                      </p>
                      <p className="text-xs text-muted-foreground">Acertos</p>
                    </div>
                  )}
                  {accuracy !== null && (
                    <div>
                      <p
                        className={`text-2xl font-bold ${accuracy >= 70 ? "text-green-600" : accuracy >= 50 ? "text-yellow-600" : "text-red-600"}`}
                      >
                        {accuracy}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Taxa de acerto
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Data de conclusão */}
          {task.completedAt && (
            <div className="space-y-1">
              <Label className="text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Concluída em
              </Label>
              <p className="text-sm">{formatDate(task.completedAt)}</p>
            </div>
          )}

          {/* Ações no dialog */}
          {status !== "done" && (
            <div className="space-y-4 pt-4 border-t">
              {/* Input de acertos (obrigatório para question_set) */}
              {task.type === "question_set" && (
                <div className="space-y-2">
                  <Label className={correctError ? "text-red-500" : ""}>
                    Acertos (de {task.totalItems} questões)
                  </Label>
                  <Input
                    type="number"
                    max={task.totalItems || 9999}
                    value={correctInput}
                    onChange={(e) => {
                      setCorrectInput(e.target.value);
                      setCorrectError("");
                    }}
                    className={
                      correctError ? "border-red-500 focus:border-red-500" : ""
                    }
                    placeholder="Digite o número de acertos"
                  />
                  {correctError && (
                    <p className="text-sm text-red-500">{correctError}</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant={isTimerRunning ? "destructive" : "default"}
                  className="flex-1"
                  onClick={toggleTimer}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" /> Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" /> Iniciar
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="flex-1 border-green-500 text-green-500 hover:text-green-600 hover:bg-green-50"
                  onClick={handleComplete}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Concluir
                </Button>
              </div>
            </div>
          )}

          {/* Botão Deletar */}
          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Excluir tarefa
            </Button>
          </div>

          {/* Dialog de confirmação de delete */}
          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excluir tarefa</DialogTitle>
              </DialogHeader>
              <p className="py-4">
                Tem certeza que deseja excluir a tarefa{" "}
                <span className="font-medium">&quot;{task.title}&quot;</span>?
                Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmOpen(false)}
                >
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Excluir
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TaskDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={"outline"} size={"icon-lg"} />}>
        <PlusCircle />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>Nova tarefa</DialogHeader>
        {open && <TaskForm />}
      </DialogContent>
    </Dialog>
  );
}
