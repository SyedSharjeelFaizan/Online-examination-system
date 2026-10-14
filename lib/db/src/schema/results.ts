import { pgTable, text, serial, timestamp, boolean, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resultsTable = pgTable("results", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  examId: integer("exam_id").notNull(),
  sessionId: integer("session_id").notNull(),
  totalScore: decimal("total_score", { precision: 6, scale: 2 }).notNull().default("0"),
  mcqScore: decimal("mcq_score", { precision: 6, scale: 2 }).notNull().default("0"),
  codingScore: decimal("coding_score", { precision: 6, scale: 2 }).notNull().default("0"),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull().default("0"),
  grade: text("grade").notNull().default("F"),
  isPublished: boolean("is_published").notNull().default(false),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertResultSchema = createInsertSchema(resultsTable).omit({ id: true });
export type InsertResult = z.infer<typeof insertResultSchema>;
export type Result = typeof resultsTable.$inferSelect;
