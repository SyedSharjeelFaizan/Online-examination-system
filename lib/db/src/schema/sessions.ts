import { pgTable, text, serial, timestamp, boolean, integer, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sessionStatusEnum = pgEnum("session_status", ["ONGOING", "SUBMITTED", "FLAGGED", "FORCE_SUBMITTED"]);

export const studentExamSessionsTable = pgTable("student_exam_sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  examId: integer("exam_id").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull().defaultNow(),
  endTime: timestamp("end_time", { withTimezone: true }),
  status: sessionStatusEnum("status").notNull().default("ONGOING"),
  tabSwitchCount: integer("tab_switch_count").notNull().default(0),
  voiceModeUsed: boolean("voice_mode_used").notNull().default(false),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
});

export const studentAnswersTable = pgTable("student_answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  questionId: integer("question_id").notNull(),
  selectedOptionId: integer("selected_option_id"),
  codeSubmission: text("code_submission"),
  language: text("language"),
  scoreObtained: decimal("score_obtained", { precision: 6, scale: 2 }).notNull().default("0"),
  testCasesPassed: integer("test_cases_passed").notNull().default(0),
  testCasesTotal: integer("test_cases_total").notNull().default(0),
  timeTakenSeconds: integer("time_taken_seconds"),
  isMarkedReview: boolean("is_marked_review").notNull().default(false),
  lastSavedAt: timestamp("last_saved_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSessionSchema = createInsertSchema(studentExamSessionsTable).omit({ id: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type StudentExamSession = typeof studentExamSessionsTable.$inferSelect;

export const insertAnswerSchema = createInsertSchema(studentAnswersTable).omit({ id: true });
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type StudentAnswer = typeof studentAnswersTable.$inferSelect;
