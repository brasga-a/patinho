/** biome-ignore-all lint/correctness/noChildrenProp: <explanation> */
/** biome-ignore-all lint/correctness/useParseIntRadix: <explanation> */
/** biome-ignore-all lint/correctness/noUnusedVariables: <explanation> */
'use client'

import { createTask } from "@/app/actions/tasks"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import * as z from "zod"
import { TagSelector } from "./tag-selector"

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Título deve ter pelo menos 2 caracteres.",
  }),
  description: z.string(),
  type: z.enum(["simple", "question_set", "other"]),
  totalItems: z.number(),
  tagIds: z.array(z.string()),
})

type TaskFormValues = z.infer<typeof formSchema>

export function TaskForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      type: "simple" as "simple" | "question_set" | "other",
      totalItems: 0 as number,
      tagIds: [] as string[],
    },
    validators: {
      onSubmit: formSchema
    },
    onSubmit: async ({ value }) => {

      // toast.message(JSON.stringify(value))

      try {
        await createTask(value)
        toast.success("Tarefa criada com sucesso!")
      } catch ( error ) {
        toast.error("Erro ao criar tarefa.")
      }
    }
  })

  const [taskType, setTaskType] = useState<TaskFormValues['type']>('simple')

  return (
      <form onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}>
        <FieldGroup className="gap-2">
          <form.Field
            name="title"
            children={( field ) => {
              const isInvalid =  field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Título</FieldLabel>
                    <Input 
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Estudar React..." 
                      autoComplete="off"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <form.Field
            name="description"
            children={( field ) => {
              const isInvalid =  field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Descrição</FieldLabel>
                    <Textarea 
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Detalhes da tarefa..."
                      className="resize-none" 
                      autoComplete="off"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
        
        <FieldGroup className="grid grid-cols-2 gap-4">
          <form.Field
            name="type"
            children={( field ) => {
              const isInvalid =  field.state.meta.isTouched && !field.state.meta.isValid
              return (
              <Field data-invalid={isInvalid}>
                <FieldLabel>Tipo de Tarefa</FieldLabel>
                <Select
                  name={field.name}
                  value={field.state.value}
                  onValueChange={(val) => {
                    field.handleChange(val as TaskFormValues['type'])
                    setTaskType(val as TaskFormValues['type'])
                  }}
                >
                    <SelectTrigger aria-invalid={isInvalid}>
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                  <SelectContent position="item-aligned">
                    <SelectItem value="simple">Simples</SelectItem>
                    <SelectItem value="question_set">Lista de Questões</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              )
            }}
          />

          { taskType === "question_set" && (
            <form.Field
              name="totalItems"
              children={( field ) => {
                const isInvalid =  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Qtd de Questões</FieldLabel>
                    <Input
                       id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(parseInt(e.target.value))}
                      aria-invalid={isInvalid}
                      placeholder="10 questões..."
                      autoComplete="off"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
          )}
        </FieldGroup>
          <form.Field
            name="tagIds"
            children={( field ) => {
              return (
                <Field>
                  <FieldLabel>Tags</FieldLabel>
                    <TagSelector
                      value={field.state.value}
                      onChange={field.handleChange}
                    />
                </Field>
              )
            }}
          />
  
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Criando..." : "Criar Tarefa"}
          </Button>
        </FieldGroup>
      </form>
  )
}
