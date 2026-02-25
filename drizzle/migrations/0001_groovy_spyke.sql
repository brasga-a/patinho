CREATE TABLE "task_tags" (
	"task_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "task_tags_task_id_tag_id_pk" PRIMARY KEY("task_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "task_tags" ("task_id", "tag_id") SELECT "id", "tag_id" FROM "tasks" WHERE "tag_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_tag_id_tags_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "tag_id";
