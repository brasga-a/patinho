import type { ColumnDef } from "@tanstack/react-table";

export type Task = {
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
  tags: { id: string; name: string; color: string }[];
};

// Columns são usadas apenas para tipagem e estrutura do data-table
// O rendering visual é feito pelo TaskCard no data-table.tsx
export const columns: ColumnDef<Task>[] = [
  {
    accessorKey: "id",
    header: "Id",
  },
];
