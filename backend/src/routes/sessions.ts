import { Router } from "express";
import { db } from "@workspace/db";
import { examsTable, questionsTable, mcqOptionsTable, codingTestCasesTable, studentExamSessionsTable, studentAnswersTable, resultsTable, usersTable } from "@workspace/db";
import { eq, and, not, inArray } from "drizzle-orm";
import { requireAuth, getCurrentUser } from "../lib/auth";
import { isDbUnavailableError, startDemoExam, saveDemoAnswer, submitDemoSession, getDemoSession } from "../lib/demo";

const router: Router = Router();

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function formatQuestionForStudent(q: typeof questionsTable.$inferSelect) {
  const options = q.questionType === "MCQ"
    ? (await db.select().from(mcqOptionsTable).where(eq(mcqOptionsTable.questionId, q.id))).map(o => ({
        id: o.id, optionText: o.optionText, isCorrect: null, optionLabel: o.optionLabel
      }))
    : [];

  const visibleTestCases = q.questionType === "CODING"
    ? (await db.select().from(codingTestCasesTable).where(eq(codingTestCasesTable.questionId, q.id)))
        .filter(tc => !tc.isHidden)
        .map(tc => ({ id: tc.id, inputData: tc.inputData, expectedOutput: tc.expectedOutput, isHidden: false, marksWeightage: parseFloat(tc.marksWeightage ?? "1") }))
    : [];

  return {
    id: q.id, examId: q.examId, questionText: q.questionText, questionType: q.questionType,
    difficulty: q.difficulty, marks: q.marks, topic: q.topic, subject: q.subject,
    isAiGenerated: q.isAiGenerated, orderIndex: q.orderIndex, options, testCases: visibleTestCases,
  };
}

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

router.post("/v1/exam/start", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current) { res.status(401).json({ message: "Unauthorized" }); return; }

  const { examId } = req.body;
  try {
    const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, examId)).limit(1);
    if (!exam) { res.status(404).json({ message: "Exam not found" }); return; }
    if (exam.status !== "PUBLISHED") { res.status(400).json({ message: "Exam is not available" }); return; }

    // Check for existing session
    const existing = await db.select().from(studentExamSessionsTable)
      .where(and(eq(studentExamSessionsTable.studentId, current.id), eq(studentExamSessionsTable.examId, examId)))
      .limit(1);

    if (existing.length > 0 && existing[0].status === "ONGOING") {
      // Resume
      const session = existing[0];
      const elapsed = Math.floor((Date.now() - (session.startTime?.getTime() ?? 0)) / 1000);
      const timeRemaining = Math.max(0, exam.durationMinutes * 60 - elapsed);

      const qs = await db.select().from(questionsTable).where(eq(questionsTable.examId, examId));
      const questions = await Promise.all(qs.map(q => formatQuestionForStudent(q)));

      const saved = await db.select().from(studentAnswersTable).where(eq(studentAnswersTable.sessionId, session.id));
      res.json({
        sessionId: session.id, examId: session.examId, questions, timeRemainingSeconds: timeRemaining,
        savedAnswers: saved.map(a => ({ questionId: a.questionId, selectedOptionId: a.selectedOptionId, codeSubmission: a.codeSubmission, language: a.language, isMarkedReview: a.isMarkedReview })),
        status: session.status,
      });
      return;
    }

    if (existing.length > 0) {
      res.status(400).json({ message: "Exam already completed" }); return;
    }

    const [session] = await db.insert(studentExamSessionsTable).values({
      studentId: current.id,
      examId,
      startTime: new Date(),
      status: "ONGOING",
      tabSwitchCount: 0,
      voiceModeUsed: false,
      currentQuestionIndex: 0,
    }).returning();

    const qs = await db.select().from(questionsTable).where(eq(questionsTable.examId, examId));
    const shuffled = exam.isAdaptive
      ? qs.filter(q => q.difficulty === "MEDIUM").slice(0, 1)
      : shuffle(qs);

    const questions = await Promise.all(shuffled.map(q => formatQuestionForStudent(q)));

    res.status(201).json({
      sessionId: session.id, examId, questions,
      timeRemainingSeconds: exam.durationMinutes * 60,
      savedAnswers: [],
      status: "ONGOING",
    });
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;
    
    const demoStart = startDemoExam(current.id, examId);
    if (!demoStart) { res.status(404).json({ message: "Exam not found" }); return; }
    res.status(201).json(demoStart);
  }
});

router.post("/v1/exam/save-answer", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current) { res.status(401).json({ message: "Unauthorized" }); return; }

  const { sessionId, questionId, selectedOptionId, codeSubmission, language, isMarkedReview, timeTakenSeconds } = req.body;

  try {
    const existing = await db.select().from(studentAnswersTable)
      .where(and(eq(studentAnswersTable.sessionId, sessionId), eq(studentAnswersTable.questionId, questionId)))
      .limit(1);

    const now = new Date();
    if (existing.length > 0) {
      await db.update(studentAnswersTable).set({
        selectedOptionId: selectedOptionId ?? null,
        codeSubmission: codeSubmission ?? null,
        language: language ?? null,
        isMarkedReview: isMarkedReview ?? false,
        timeTakenSeconds: timeTakenSeconds ?? null,
        lastSavedAt: now,
      }).where(eq(studentAnswersTable.id, existing[0].id));
    } else {
      await db.insert(studentAnswersTable).values({
        sessionId, questionId,
        selectedOptionId: selectedOptionId ?? null,
        codeSubmission: codeSubmission ?? null,
        language: language ?? null,
        isMarkedReview: isMarkedReview ?? false,
        timeTakenSeconds: timeTakenSeconds ?? null,
        lastSavedAt: now,
      });
    }

    res.json({ savedAt: now.toISOString() });
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;
    
    saveDemoAnswer(sessionId, { questionId, selectedOptionId, codeSubmission, language, isMarkedReview });
    res.json({ savedAt: new Date().toISOString() });
  }
});

router.post("/v1/exam/submit", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current) { res.status(401).json({ message: "Unauthorized" }); return; }

  const { sessionId } = req.body;

  try {
    const [session] = await db.select().from(studentExamSessionsTable).where(eq(studentExamSessionsTable.id, sessionId)).limit(1);
    if (!session) { res.status(404).json({ message: "Session not found" }); return; }

    const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, session.examId)).limit(1);
    if (!exam) { res.status(404).json({ message: "Exam not found" }); return; }

    await db.update(studentExamSessionsTable).set({ status: "SUBMITTED", endTime: new Date() }).where(eq(studentExamSessionsTable.id, sessionId));

    const answers = await db.select().from(studentAnswersTable).where(eq(studentAnswersTable.sessionId, sessionId));
    const questions = await db.select().from(questionsTable).where(eq(questionsTable.examId, session.examId));

    let mcqScore = 0;
    let codingScore = 0;

    for (const ans of answers) {
      const q = questions.find(q => q.id === ans.questionId);
      if (!q) continue;

      if (q.questionType === "MCQ" && ans.selectedOptionId) {
        const [opt] = await db.select().from(mcqOptionsTable).where(eq(mcqOptionsTable.id, ans.selectedOptionId)).limit(1);
        const multiplier = q.difficulty === "HARD" ? 2 : q.difficulty === "MEDIUM" ? 1.5 : 1;
        if (opt?.isCorrect) {
          const earned = exam.isAdaptive ? q.marks * multiplier : q.marks;
          mcqScore += earned;
          await db.update(studentAnswersTable).set({ scoreObtained: String(earned) }).where(eq(studentAnswersTable.id, ans.id));
        } else if (exam.negativeMarking) {
          mcqScore -= parseFloat(exam.negativeMarksValue ?? "0");
        }
      }
    }

    const totalScore = Math.max(0, mcqScore + codingScore);
    const percentage = exam.totalMarks > 0 ? (totalScore / exam.totalMarks) * 100 : 0;
    const grade = calculateGrade(percentage);

    const [result] = await db.insert(resultsTable).values({
      studentId: current.id,
      examId: session.examId,
      sessionId,
      totalScore: String(totalScore),
      mcqScore: String(Math.max(0, mcqScore)),
      codingScore: String(codingScore),
      percentage: String(percentage),
      grade,
      isPublished: false,
      submittedAt: new Date(),
    }).returning();

    res.json({ resultId: result.id, totalScore, percentage, grade, autoSubmitted: false });
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;
    
    const demoResult = submitDemoSession(current.id, sessionId);
    if (!demoResult) { res.status(404).json({ message: "Session not found" }); return; }
    res.json(demoResult);
  }
});

router.get("/v1/exam/session/:sessionId", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current) { res.status(401).json({ message: "Unauthorized" }); return; }

  const id = parseInt(Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId);
  try {
    const [session] = await db.select().from(studentExamSessionsTable).where(eq(studentExamSessionsTable.id, id)).limit(1);
    if (!session) { res.status(404).json({ message: "Session not found" }); return; }

    const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, session.examId)).limit(1);
    if (!exam) { res.status(404).json({ message: "Exam not found" }); return; }

    const elapsed = Math.floor((Date.now() - (session.startTime?.getTime() ?? 0)) / 1000);
    const timeRemaining = Math.max(0, exam.durationMinutes * 60 - elapsed);

    const qs = await db.select().from(questionsTable).where(eq(questionsTable.examId, session.examId));
    const questions = await Promise.all(qs.map(q => formatQuestionForStudent(q)));

    const saved = await db.select().from(studentAnswersTable).where(eq(studentAnswersTable.sessionId, id));

    res.json({
      sessionId: session.id, examId: session.examId, questions, timeRemainingSeconds: timeRemaining,
      savedAnswers: saved.map(a => ({ questionId: a.questionId, selectedOptionId: a.selectedOptionId, codeSubmission: a.codeSubmission, language: a.language, isMarkedReview: a.isMarkedReview })),
      status: session.status,
    });
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;
    
    const demoSession = getDemoSession(id);
    if (!demoSession) { res.status(404).json({ message: "Session not found" }); return; }
    res.json(demoSession);
  }
});

router.post("/v1/exam/flag-violation", requireAuth, async (req, res): Promise<void> => {
  const { sessionId } = req.body;
  try {
    const [session] = await db.select().from(studentExamSessionsTable).where(eq(studentExamSessionsTable.id, sessionId)).limit(1);
    if (!session) { res.status(404).json({ message: "Session not found" }); return; }

    const newCount = (session.tabSwitchCount ?? 0) + 1;
    await db.update(studentExamSessionsTable).set({ tabSwitchCount: newCount }).where(eq(studentExamSessionsTable.id, sessionId));

    if (newCount >= 3) {
      // Auto-submit
      await db.update(studentExamSessionsTable).set({ status: "FORCE_SUBMITTED", endTime: new Date() }).where(eq(studentExamSessionsTable.id, sessionId));
      res.json({ tabSwitchCount: newCount, autoSubmitted: true, resultId: null });
      return;
    }

    res.json({ tabSwitchCount: newCount, autoSubmitted: false });
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;
    res.json({ tabSwitchCount: 0, autoSubmitted: false });
  }
});

router.get("/v1/exam/adaptive-next", requireAuth, async (req, res): Promise<void> => {
  const { sessionId, lastCorrect } = req.query;
  const sid = parseInt(String(sessionId));
  const wasCorrect = String(lastCorrect) === "true";

  try {
    const [session] = await db.select().from(studentExamSessionsTable).where(eq(studentExamSessionsTable.id, sid)).limit(1);
    if (!session) { res.status(404).json({ message: "Session not found" }); return; }

    const answered = await db.select().from(studentAnswersTable).where(eq(studentAnswersTable.sessionId, sid));
    const answeredIds = answered.map(a => a.questionId);

    const allQs = await db.select().from(questionsTable).where(eq(questionsTable.examId, session.examId));
    const remaining = allQs.filter(q => !answeredIds.includes(q.id));

    if (remaining.length === 0) {
      res.status(404).json({ message: "No more questions" }); return;
    }

    const target = remaining[Math.floor(Math.random() * remaining.length)];
    const options = target.questionType === "MCQ"
      ? (await db.select().from(mcqOptionsTable).where(eq(mcqOptionsTable.questionId, target.id))).map(o => ({ id: o.id, optionText: o.optionText, isCorrect: null, optionLabel: o.optionLabel }))
      : [];

    res.json({
      id: target.id, examId: target.examId, questionText: target.questionText, questionType: target.questionType,
      difficulty: target.difficulty, marks: target.marks, topic: target.topic, subject: target.subject,
      isAiGenerated: target.isAiGenerated, orderIndex: target.orderIndex, options, testCases: [],
    });
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;
    res.status(404).json({ message: "No more questions in demo mode" });
  }
});

router.get("/v1/admin/exam-monitor/:examId", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.examId) ? req.params.examId[0] : req.params.examId);
  try {
    const sessions = await db.select().from(studentExamSessionsTable)
      .where(and(eq(studentExamSessionsTable.examId, id), eq(studentExamSessionsTable.status, "ONGOING")));

    const result = await Promise.all(sessions.map(async s => {
      const [student] = await db.select().from(usersTable).where(eq(usersTable.id, s.studentId)).limit(1);
      return {
        sessionId: s.id,
        studentId: s.studentId,
        studentName: student?.name ?? "Unknown",
        startTime: s.startTime?.toISOString(),
        tabSwitchCount: s.tabSwitchCount,
        status: s.status,
        currentQuestionIndex: s.currentQuestionIndex,
      };
    }));

    res.json(result);
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;
    res.json([]); // Return empty list for demo exam monitor
  }
});

export default router;
