import { pgTable, text, serial, boolean, integer, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const questionTypeEnum = pgEnum("question_type", ["MCQ", "CODING"]);

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id"),
  questionText: text("question_text").notNull(),
  questionType: questionTypeEnum("question_type").notNull(),
  difficulty: text("difficulty").notNull().default("MEDIUM"),
  marks: integer("marks").notNull(),
  topic: text("topic"),
  subject: text("subject"),
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
  orderIndex: integer("order_index"),
});

export const mcqOptionsTable = pgTable("mcq_options", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  optionLabel: text("option_label").notNull(),
});

export const codingTestCasesTable = pgTable("coding_test_cases", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  inputData: text("input_data").notNull(),
  expectedOutput: text("expected_output").notNull(),
  isHidden: boolean("is_hidden").notNull().default(true),
  marksWeightage: decimal("marks_weightage", { precision: 4, scale: 2 }).notNull().default("1"),
});

export const syllabusTable = pgTable("syllabi", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull(),
  contentText: text("content_text"),
  uploadedAt: text("uploaded_at"),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;

export const insertMcqOptionSchema = createInsertSchema(mcqOptionsTable).omit({ id: true });
export type InsertMcqOption = z.infer<typeof insertMcqOptionSchema>;
export type McqOption = typeof mcqOptionsTable.$inferSelect;

export const insertTestCaseSchema = createInsertSchema(codingTestCasesTable).omit({ id: true });
export type InsertTestCase = z.infer<typeof insertTestCaseSchema>;
export type TestCase = typeof codingTestCasesTable.$inferSelect;
