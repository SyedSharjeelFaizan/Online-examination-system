import { Router } from "express";
import { db } from "@workspace/db";
import { resultsTable, examsTable, studentAnswersTable, questionsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, getCurrentUser } from "../lib/auth";
import { getDemoAdminDashboard, getDemoResult, getDemoStudentPerformance, getDemoStudentResults, isDbUnavailableError } from "../lib/demo";

const router: Router = Router();

router.get("/v1/analytics/student/:studentId/performance", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId);
  try {
    const results = await db.select().from(resultsTable).where(eq(resultsTable.studentId, id));

    const trend = await Promise.all(results.map(async r => {
      const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, r.examId)).limit(1);
      return {
        examTitle: exam?.title ?? "Unknown",
        percentage: parseFloat(r.percentage ?? "0"),
        submittedAt: r.submittedAt?.toISOString(),
      };
    }));

    const avgScore = results.length > 0
      ? results.reduce((sum, r) => sum + parseFloat(r.percentage ?? "0"), 0) / results.length
      : 0;

    const weakTopics = ["Arrays", "Dynamic Programming", "Graph Algorithms"];
    const aiSuggestions = [
      "Review array manipulation techniques including two-pointer and sliding window patterns.",
      "Practice dynamic programming problems on LeetCode focusing on memoization vs tabulation.",
      "Study BFS/DFS graph traversal algorithms with hands-on coding exercises.",
    ];

    res.json({
      studentId: id,
      totalExams: results.length,
      averageScore: avgScore,
      trend,
      weakTopics,
      aiSuggestions,
    });
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;
    res.json(getDemoStudentPerformance(id));
  }
});

router.get("/v1/analytics/exam/:examId/overview", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.examId) ? req.params.examId[0] : req.params.examId);
  const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, id)).limit(1);
  if (!exam) { res.status(404).json({ message: "Exam not found" }); return; }

  const results = await db.select().from(resultsTable).where(eq(resultsTable.examId, id));

  const scores = results.map(r => parseFloat(r.percentage ?? "0"));
  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const passRate = scores.length > 0 ? (scores.filter(s => s >= 50).length / scores.length) * 100 : 0;

  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const r of results) {
    const g = r.grade[0] as "A" | "B" | "C" | "D" | "F";
    if (g in gradeDistribution) gradeDistribution[g]++;
  }

  res.json({
    examId: id,
    examTitle: exam.title,
    totalStudents: results.length,
    averageScore: avg,
    passRate,
    gradeDistribution,
    topScore: scores.length > 0 ? Math.max(...scores) : 0,
    lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
  });
});

router.get("/v1/admin/analytics/dashboard", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  try {
    const allStudents = await db.select().from(usersTable);
    const totalStudents = allStudents.filter(u => u.role === "STUDENT").length;

    const allExams = await db.select().from(examsTable);
    const totalExams = allExams.length;
    const activeExams = allExams.filter(e => e.status === "ONGOING" || e.status === "PUBLISHED").length;

    const allResults = await db.select().from(resultsTable);
    const totalResults = allResults.length;

    const recentExams = allExams.slice(-5).reverse();
    const recentExamsFormatted = await Promise.all(recentExams.map(async e => {
      const qs = await db.select().from(questionsTable).where(eq(questionsTable.examId, e.id));
      return {
        id: e.id, title: e.title, subject: e.subject, department: e.department, semester: e.semester,
        durationMinutes: e.durationMinutes, totalMarks: e.totalMarks, scheduledAt: e.scheduledAt?.toISOString(),
        examType: e.examType, difficulty: e.difficulty, isAdaptive: e.isAdaptive, voiceModeEnabled: e.voiceModeEnabled,
        negativeMarking: e.negativeMarking, negativeMarksValue: parseFloat(e.negativeMarksValue ?? "0"),
        status: e.status, createdBy: e.createdBy, createdAt: e.createdAt?.toISOString(), questionCount: qs.length,
      };
    }));

    const examsByStatus = {
      DRAFT: allExams.filter(e => e.status === "DRAFT").length,
      PUBLISHED: allExams.filter(e => e.status === "PUBLISHED").length,
      ONGOING: allExams.filter(e => e.status === "ONGOING").length,
      COMPLETED: allExams.filter(e => e.status === "COMPLETED").length,
    };

    res.json({
      totalStudents, totalExams, activeExams, totalResults,
      recentExams: recentExamsFormatted, examsByStatus,
    });
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;
    res.json(getDemoAdminDashboard());
  }
});

// Results
router.get("/v1/results/student/:studentId", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId);
  try {
    const results = await db.select().from(resultsTable).where(eq(resultsTable.studentId, id));

    const formatted = await Promise.all(results.map(async r => {
      const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, r.examId)).limit(1);
      return {
        id: r.id, studentId: r.studentId, examId: r.examId, sessionId: r.sessionId,
        totalScore: parseFloat(r.totalScore ?? "0"), mcqScore: parseFloat(r.mcqScore ?? "0"),
        codingScore: parseFloat(r.codingScore ?? "0"), percentage: parseFloat(r.percentage ?? "0"),
        grade: r.grade, isPublished: r.isPublished, submittedAt: r.submittedAt?.toISOString(),
        examTitle: exam?.title ?? null, studentName: null,
      };
    }));

    res.json(formatted);
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;
    res.json(getDemoStudentResults(id));
  }
});

router.get("/v1/results/exam/:examId", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.examId) ? req.params.examId[0] : req.params.examId);
  const results = await db.select().from(resultsTable).where(eq(resultsTable.examId, id));

  const formatted = await Promise.all(results.map(async r => {
    const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, r.examId)).limit(1);
    const [student] = await db.select().from(usersTable).where(eq(usersTable.id, r.studentId)).limit(1);
    return {
      id: r.id, studentId: r.studentId, examId: r.examId, sessionId: r.sessionId,
      totalScore: parseFloat(r.totalScore ?? "0"), mcqScore: parseFloat(r.mcqScore ?? "0"),
      codingScore: parseFloat(r.codingScore ?? "0"), percentage: parseFloat(r.percentage ?? "0"),
      grade: r.grade, isPublished: r.isPublished, submittedAt: r.submittedAt?.toISOString(),
      examTitle: exam?.title ?? null, studentName: student?.name ?? null,
    };
  }));

  res.json(formatted);
});

router.get("/v1/results/:resultId", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.resultId) ? req.params.resultId[0] : req.params.resultId);
  try {
    const [r] = await db.select().from(resultsTable).where(eq(resultsTable.id, id)).limit(1);
    if (!r) { res.status(404).json({ message: "Result not found" }); return; }

    const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, r.examId)).limit(1);
    const [student] = await db.select().from(usersTable).where(eq(usersTable.id, r.studentId)).limit(1);

    const answers = await db.select().from(studentAnswersTable).where(eq(studentAnswersTable.sessionId, r.sessionId));
    const answerDetails = await Promise.all(answers.map(async a => {
      const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, a.questionId)).limit(1);
      return {
        questionId: a.questionId,
        questionText: q?.questionText ?? "",
        questionType: q?.questionType ?? "MCQ",
        scoreObtained: parseFloat(a.scoreObtained ?? "0"),
        maxMarks: q?.marks ?? 0,
        testCasesPassed: a.testCasesPassed,
        testCasesTotal: a.testCasesTotal,
      };
    }));

    res.json({
      id: r.id, studentId: r.studentId, examId: r.examId, sessionId: r.sessionId,
      totalScore: parseFloat(r.totalScore ?? "0"), mcqScore: parseFloat(r.mcqScore ?? "0"),
      codingScore: parseFloat(r.codingScore ?? "0"), percentage: parseFloat(r.percentage ?? "0"),
      grade: r.grade, isPublished: r.isPublished, submittedAt: r.submittedAt?.toISOString(),
      examTitle: exam?.title ?? null, studentName: student?.name ?? null,
      answers: answerDetails,
    });
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;
    const result = getDemoResult(id);
    if (!result) { res.status(404).json({ message: "Result not found" }); return; }
    res.json(result);
  }
});

router.patch("/v1/admin/results/:resultId/adjust", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.resultId) ? req.params.resultId[0] : req.params.resultId);
  const { totalScore } = req.body;

  const [r] = await db.update(resultsTable).set({ totalScore: String(totalScore) }).where(eq(resultsTable.id, id)).returning();
  if (!r) { res.status(404).json({ message: "Result not found" }); return; }

  const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, r.examId)).limit(1);
  res.json({
    id: r.id, studentId: r.studentId, examId: r.examId, sessionId: r.sessionId,
    totalScore: parseFloat(r.totalScore ?? "0"), mcqScore: parseFloat(r.mcqScore ?? "0"),
    codingScore: parseFloat(r.codingScore ?? "0"), percentage: parseFloat(r.percentage ?? "0"),
    grade: r.grade, isPublished: r.isPublished, submittedAt: r.submittedAt?.toISOString(),
    examTitle: exam?.title ?? null, studentName: null,
  });
});

router.patch("/v1/admin/results/exam/:examId/publish", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.examId) ? req.params.examId[0] : req.params.examId);
  const results = await db.select().from(resultsTable).where(eq(resultsTable.examId, id));

  let published = 0;
  for (const r of results) {
    if (!r.isPublished) {
      await db.update(resultsTable).set({ isPublished: true }).where(eq(resultsTable.id, r.id));
      published++;
    }
  }

  res.json({ published });
});

export default router;
