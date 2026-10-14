import { Router } from "express";
import { db } from "@workspace/db";
import { questionsTable, mcqOptionsTable, codingTestCasesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, getCurrentUser } from "../lib/auth";

const router: Router = Router();

async function formatQuestion(q: typeof questionsTable.$inferSelect, showCorrect = true) {
  const options = q.questionType === "MCQ"
    ? await db.select().from(mcqOptionsTable).where(eq(mcqOptionsTable.questionId, q.id))
    : [];
  const testCases = q.questionType === "CODING"
    ? await db.select().from(codingTestCasesTable).where(eq(codingTestCasesTable.questionId, q.id))
    : [];

  return {
    id: q.id,
    examId: q.examId,
    questionText: q.questionText,
    questionType: q.questionType,
    difficulty: q.difficulty,
    marks: q.marks,
    topic: q.topic,
    subject: q.subject,
    isAiGenerated: q.isAiGenerated,
    orderIndex: q.orderIndex,
    options: options.map(o => ({
      id: o.id,
      optionText: o.optionText,
      isCorrect: showCorrect ? o.isCorrect : null,
      optionLabel: o.optionLabel,
    })),
    testCases: testCases.map(tc => ({
      id: tc.id,
      inputData: tc.inputData,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden,
      marksWeightage: parseFloat(tc.marksWeightage ?? "1"),
    })),
  };
}

router.get("/v1/admin/questions", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const { subject, questionType, difficulty, examId } = req.query;
  const all = await db.select().from(questionsTable);

  const filtered = all.filter(q => {
    if (subject && q.subject !== subject) return false;
    if (questionType && q.questionType !== questionType) return false;
    if (difficulty && q.difficulty !== difficulty) return false;
    if (examId && q.examId !== Number(examId)) return false;
    return true;
  });

  const result = await Promise.all(filtered.map(q => formatQuestion(q)));
  res.json(result);
});

router.post("/v1/admin/questions", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const { examId, questionText, questionType, difficulty, marks, topic, subject, isAiGenerated, options, testCases } = req.body;

  const [q] = await db.insert(questionsTable).values({
    examId: examId ?? null,
    questionText,
    questionType,
    difficulty: difficulty ?? "MEDIUM",
    marks,
    topic: topic ?? null,
    subject: subject ?? null,
    isAiGenerated: isAiGenerated ?? false,
  }).returning();

  if (questionType === "MCQ" && options?.length) {
    for (const opt of options) {
      await db.insert(mcqOptionsTable).values({
        questionId: q.id,
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
        optionLabel: opt.optionLabel,
      });
    }
  }

  if (questionType === "CODING" && testCases?.length) {
    for (const tc of testCases) {
      await db.insert(codingTestCasesTable).values({
        questionId: q.id,
        inputData: tc.inputData,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden ?? true,
        marksWeightage: String(tc.marksWeightage ?? 1),
      });
    }
  }

  res.status(201).json(await formatQuestion(q));
});

router.put("/v1/admin/questions/:questionId", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.questionId) ? req.params.questionId[0] : req.params.questionId);
  const { questionText, difficulty, marks, topic, subject } = req.body;

  const updates: Partial<typeof questionsTable.$inferInsert> = {};
  if (questionText) updates.questionText = questionText;
  if (difficulty) updates.difficulty = difficulty;
  if (marks) updates.marks = marks;
  if (topic != null) updates.topic = topic;
  if (subject != null) updates.subject = subject;

  const [q] = await db.update(questionsTable).set(updates).where(eq(questionsTable.id, id)).returning();
  if (!q) { res.status(404).json({ message: "Question not found" }); return; }

  res.json(await formatQuestion(q));
});

router.delete("/v1/admin/questions/:questionId", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.questionId) ? req.params.questionId[0] : req.params.questionId);
  await db.delete(mcqOptionsTable).where(eq(mcqOptionsTable.questionId, id));
  await db.delete(codingTestCasesTable).where(eq(codingTestCasesTable.questionId, id));
  await db.delete(questionsTable).where(eq(questionsTable.id, id));
  res.sendStatus(204);
});

router.post("/v1/admin/questions/bulk-import", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const { questions } = req.body;
  if (!Array.isArray(questions)) { res.status(400).json({ message: "questions must be array" }); return; }

  let count = 0;
  for (const qdata of questions) {
    const [q] = await db.insert(questionsTable).values({
      examId: qdata.examId ?? null,
      questionText: qdata.questionText,
      questionType: qdata.questionType,
      difficulty: qdata.difficulty ?? "MEDIUM",
      marks: qdata.marks,
      topic: qdata.topic ?? null,
      subject: qdata.subject ?? null,
      isAiGenerated: qdata.isAiGenerated ?? false,
    }).returning();

    if (qdata.options?.length) {
      for (const opt of qdata.options) {
        await db.insert(mcqOptionsTable).values({ questionId: q.id, optionText: opt.optionText, isCorrect: opt.isCorrect, optionLabel: opt.optionLabel });
      }
    }
    count++;
  }

  res.status(201).json({ count });
});

router.get("/v1/admin/questions/:questionId/testcases", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.questionId) ? req.params.questionId[0] : req.params.questionId);
  const tcs = await db.select().from(codingTestCasesTable).where(eq(codingTestCasesTable.questionId, id));
  res.json(tcs.map(tc => ({ id: tc.id, inputData: tc.inputData, expectedOutput: tc.expectedOutput, isHidden: tc.isHidden, marksWeightage: parseFloat(tc.marksWeightage ?? "1") })));
});

router.post("/v1/admin/questions/:questionId/testcases", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.questionId) ? req.params.questionId[0] : req.params.questionId);
  const { inputData, expectedOutput, isHidden, marksWeightage } = req.body;

  const [tc] = await db.insert(codingTestCasesTable).values({
    questionId: id,
    inputData,
    expectedOutput,
    isHidden: isHidden ?? true,
    marksWeightage: String(marksWeightage ?? 1),
  }).returning();

  res.status(201).json({ id: tc.id, inputData: tc.inputData, expectedOutput: tc.expectedOutput, isHidden: tc.isHidden, marksWeightage: parseFloat(tc.marksWeightage ?? "1") });
});

router.delete("/v1/admin/testcases/:testCaseId", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.testCaseId) ? req.params.testCaseId[0] : req.params.testCaseId);
  await db.delete(codingTestCasesTable).where(eq(codingTestCasesTable.id, id));
  res.sendStatus(204);
});

export default router;
