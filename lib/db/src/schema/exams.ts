import { pgTable, text, serial, timestamp, boolean, integer, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const examTypeEnum = pgEnum("exam_type", ["MCQ", "CODING", "MIXED"]);
export const difficultyEnum = pgEnum("difficulty", ["EASY", "MEDIUM", "HARD"]);
export const examStatusEnum = pgEnum("exam_status", ["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED"]);

export const examsTable = pgTable("exams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  department: text("department"),
  semester: integer("semester"),
  durationMinutes: integer("duration_minutes").notNull(),
  totalMarks: integer("total_marks").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  examType: examTypeEnum("exam_type").notNull(),
  difficulty: difficultyEnum("difficulty"),
  isAdaptive: boolean("is_adaptive").notNull().default(false),
  voiceModeEnabled: boolean("voice_mode_enabled").notNull().default(false),
  negativeMarking: boolean("negative_marking").notNull().default(false),
  negativeMarksValue: decimal("negative_marks_value", { precision: 4, scale: 2 }).notNull().default("0"),
  status: examStatusEnum("status").notNull().default("DRAFT"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertExamSchema = createInsertSchema(examsTable).omit({ id: true, createdAt: true });
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof examsTable.$inferSelect;
