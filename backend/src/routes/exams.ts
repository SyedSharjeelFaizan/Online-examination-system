import { Router } from "express";
import { db } from "@workspace/db";
import { examsTable, questionsTable, mcqOptionsTable, codingTestCasesTable, syllabusTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth, getCurrentUser } from "../lib/auth";
import { createDemoExam, deleteDemoExam, getDemoAdminExam, getDemoStudentExam, isDbUnavailableError, listDemoAdminExams, listDemoStudentExams, updateDemoExam } from "../lib/demo";

const router: Router = Router();

function formatExam(exam: typeof examsTable.$inferSelect, questionCount = 0) {
  return {
    id: exam.id,
    title: exam.title,
    subject: exam.subject,
    department: exam.department,
    semester: exam.semester,
    durationMinutes: exam.durationMinutes,
    totalMarks: exam.totalMarks,
    scheduledAt: exam.scheduledAt?.toISOString(),
    examType: exam.examType,
    difficulty: exam.difficulty,
    isAdaptive: exam.isAdaptive,
    voiceModeEnabled: exam.voiceModeEnabled,
    negativeMarking: exam.negativeMarking,
    negativeMarksValue: parseFloat(exam.negativeMarksValue ?? "0"),
    status: exam.status,
    createdBy: exam.createdBy,
    createdAt: exam.createdAt?.toISOString(),
    questionCount,
  };
}

async function formatQuestion(q: typeof questionsTable.$inferSelect, showCorrect = false) {
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
    testCases: testCases
      .filter(tc => !tc.isHidden || showCorrect)
      .map(tc => ({
        id: tc.id,
        inputData: tc.inputData,
        expectedOutput: showCorrect ? tc.expectedOutput : "***",
        isHidden: tc.isHidden,
        marksWeightage: parseFloat(tc.marksWeightage ?? "1"),
      })),
  };
}

// ADMIN EXAM ENDPOINTS
router.get("/v1/admin/exams", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const { status, department, semester } = req.query;

  try {
    const allExams = await db.select().from(examsTable).where(eq(examsTable.createdBy, current.id));
    const filtered = allExams.filter(e => {
      if (status && e.status !== status) return false;
      if (department && e.department !== department) return false;
      if (semester && e.semester !== Number(semester)) return false;
      return true;
    });

    const result = await Promise.all(filtered.map(async (e) => {
      const qs = await db.select().from(questionsTable).where(eq(questionsTable.examId, e.id));
      return formatExam(e, qs.length);
    }));
    res.json(result);
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;

    res.json(listDemoAdminExams(current.id, {
      status: typeof status === "string" ? status : undefined,
      department: typeof department === "string" ? department : undefined,
      semester: typeof semester === "string" ? Number(semester) : undefined,
    }));
  }
});

router.post("/v1/admin/exams", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const { title, subject, department, semester, durationMinutes, totalMarks, scheduledAt, examType, difficulty, isAdaptive, voiceModeEnabled, negativeMarking, negativeMarksValue, questionIds, syllabusText } = req.body;

  if (!title || !subject || !durationMinutes || !totalMarks || !scheduledAt || !examType) {
    res.status(400).json({ message: "Missing required fields" }); return;
  }

  try {
    const [exam] = await db.insert(examsTable).values({
      title,
      subject,
      department: department ?? null,
      semester: semester ?? null,
      durationMinutes,
      totalMarks,
      scheduledAt: new Date(scheduledAt),
      examType,
      difficulty: difficulty ?? null,
      isAdaptive: isAdaptive ?? false,
      voiceModeEnabled: voiceModeEnabled ?? false,
      negativeMarking: negativeMarking ?? false,
      negativeMarksValue: String(negativeMarksValue ?? 0),
      status: "DRAFT",
      createdBy: current.id,
    }).returning();

    if (questionIds && Array.isArray(questionIds) && questionIds.length > 0) {
      for (const qid of questionIds) {
        await db.update(questionsTable).set({ examId: exam.id }).where(eq(questionsTable.id, qid));
      }
    }

    if (syllabusText) {
      await db.insert(syllabusTable).values({ examId: exam.id, contentText: syllabusText });
    }

    res.status(201).json(formatExam(exam, questionIds?.length ?? 0));
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;

    const exam = createDemoExam({
      title,
      subject,
      department: department ?? null,
      semester: semester ?? null,
      durationMinutes,
      totalMarks,
      scheduledAt: new Date(scheduledAt).toISOString(),
      examType,
      difficulty: difficulty ?? "MEDIUM",
      isAdaptive: isAdaptive ?? false,
      voiceModeEnabled: voiceModeEnabled ?? false,
      negativeMarking: negativeMarking ?? false,
      negativeMarksValue: Number(negativeMarksValue ?? 0),
      status: "DRAFT",
      createdBy: current.id,
      questionCount: Array.isArray(questionIds) ? questionIds.length : 0,
      syllabusText: syllabusText ?? null,
    });

    res.status(201).json(exam);
  }
});

router.get("/v1/admin/exams/:examId", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.examId) ? req.params.examId[0] : req.params.examId);
  try {
    const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, id)).limit(1);
    if (!exam) { res.status(404).json({ message: "Exam not found" }); return; }

    const qs = await db.select().from(questionsTable).where(eq(questionsTable.examId, id));
    const [syllabus] = await db.select().from(syllabusTable).where(eq(syllabusTable.examId, id)).limit(1);
    res.json({ ...formatExam(exam, qs.length), syllabusText: syllabus?.contentText ?? null });
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;

    const exam = getDemoAdminExam(id, current.id);
    if (!exam) { res.status(404).json({ message: "Exam not found" }); return; }
    res.json(exam);
  }
});

router.put("/v1/admin/exams/:examId", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.examId) ? req.params.examId[0] : req.params.examId);
  const { title, subject, department, semester, durationMinutes, totalMarks, scheduledAt, examType, difficulty, isAdaptive, voiceModeEnabled, negativeMarking, negativeMarksValue, syllabusText } = req.body;

  const updates: Partial<typeof examsTable.$inferInsert> = {};
  if (title) updates.title = title;
  if (subject) updates.subject = subject;
  if (department != null) updates.department = department;
  if (semester != null) updates.semester = semester;
  if (durationMinutes) updates.durationMinutes = durationMinutes;
  if (totalMarks) updates.totalMarks = totalMarks;
  if (scheduledAt) updates.scheduledAt = new Date(scheduledAt);
  if (examType) updates.examType = examType;
  if (difficulty != null) updates.difficulty = difficulty;
  if (isAdaptive != null) updates.isAdaptive = isAdaptive;
  if (voiceModeEnabled != null) updates.voiceModeEnabled = voiceModeEnabled;
  if (negativeMarking != null) updates.negativeMarking = negativeMarking;
  if (negativeMarksValue != null) updates.negativeMarksValue = String(negativeMarksValue);

  try {
    const [exam] = await db.update(examsTable).set(updates).where(eq(examsTable.id, id)).returning();
    if (!exam) { res.status(404).json({ message: "Exam not found" }); return; }

    if (syllabusText != null) {
      const existing = await db.select().from(syllabusTable).where(eq(syllabusTable.examId, id)).limit(1);
      if (existing.length > 0) {
        await db.update(syllabusTable).set({ contentText: syllabusText }).where(eq(syllabusTable.examId, id));
      } else {
        await db.insert(syllabusTable).values({ examId: id, contentText: syllabusText });
      }
    }

    const qs = await db.select().from(questionsTable).where(eq(questionsTable.examId, id));
    res.json(formatExam(exam, qs.length));
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;

    const exam = updateDemoExam(id, current.id, {
      title,
      subject,
      department: department ?? undefined,
      semester: semester ?? undefined,
      durationMinutes: durationMinutes ?? undefined,
      totalMarks: totalMarks ?? undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      examType: examType ?? undefined,
      difficulty: difficulty ?? undefined,
      isAdaptive: isAdaptive ?? undefined,
      voiceModeEnabled: voiceModeEnabled ?? undefined,
      negativeMarking: negativeMarking ?? undefined,
      negativeMarksValue: negativeMarksValue != null ? Number(negativeMarksValue) : undefined,
      syllabusText: syllabusText ?? undefined,
    });
    if (!exam) { res.status(404).json({ message: "Exam not found" }); return; }
    res.json(exam);
  }
});

router.delete("/v1/admin/exams/:examId", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.examId) ? req.params.examId[0] : req.params.examId);
  try {
    await db.delete(examsTable).where(eq(examsTable.id, id));
    res.sendStatus(204);
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;

    const deleted = deleteDemoExam(id, current.id);
    if (!deleted) { res.status(404).json({ message: "Exam not found" }); return; }
    res.sendStatus(204);
  }
});

router.patch("/v1/admin/exams/:examId/status", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.examId) ? req.params.examId[0] : req.params.examId);
  const { status } = req.body;
  if (!status) { res.status(400).json({ message: "Status required" }); return; }

  try {
    const [exam] = await db.update(examsTable).set({ status }).where(eq(examsTable.id, id)).returning();
    if (!exam) { res.status(404).json({ message: "Exam not found" }); return; }

    const qs = await db.select().from(questionsTable).where(eq(questionsTable.examId, id));
    res.json(formatExam(exam, qs.length));
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;

    const exam = updateDemoExam(id, current.id, { status });
    if (!exam) { res.status(404).json({ message: "Exam not found" }); return; }
    res.json(exam);
  }
});

// STUDENT EXAM ENDPOINTS
router.get("/v1/student/exams", requireAuth, async (req, res): Promise<void> => {
  try {
    const exams = await db.select().from(examsTable).where(eq(examsTable.status, "PUBLISHED"));
    const result = await Promise.all(exams.map(async (e) => {
      const qs = await db.select().from(questionsTable).where(eq(questionsTable.examId, e.id));
      return formatExam(e, qs.length);
    }));
    res.json(result);
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;
    res.json(listDemoStudentExams());
  }
});

router.get("/v1/student/exams/:examId", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.examId) ? req.params.examId[0] : req.params.examId);
  try {
    const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, id)).limit(1);
    if (!exam) { res.status(404).json({ message: "Exam not found" }); return; }

    const qs = await db.select().from(questionsTable).where(eq(questionsTable.examId, id));
    const [syllabus] = await db.select().from(syllabusTable).where(eq(syllabusTable.examId, id)).limit(1);

    res.json({
      ...formatExam(exam, qs.length),
      syllabusText: syllabus?.contentText ?? null,
      questions: [],
    });
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;

    const exam = getDemoStudentExam(id);
    if (!exam) { res.status(404).json({ message: "Exam not found" }); return; }
    res.json({
      ...exam,
      syllabusText: exam.syllabusText ?? null,
      questions: [],
    });
  }
});

export default router;
