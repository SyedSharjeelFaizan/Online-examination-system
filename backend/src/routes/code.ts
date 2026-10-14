import { Router } from "express";
import { db } from "@workspace/db";
import { codingTestCasesTable, studentAnswersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: Router = Router();

const LANGUAGE_IDS: Record<string, number> = {
  c: 50,
  cpp: 54,
  java: 62,
  python: 71,
};

async function executeCode(code: string, language: string, input: string): Promise<{ output: string | null; error: string | null; status: string; executionTime: string | null; memoryUsed: string | null }> {
  const langId = LANGUAGE_IDS[language.toLowerCase()];
  if (!langId) {
    return { output: null, error: `Unsupported language: ${language}`, status: "Error", executionTime: null, memoryUsed: null };
  }

  const judge0Key = process.env.JUDGE0_API_KEY;
  
  if (!judge0Key) {
    // Stub: simulate execution without Judge0
    return {
      output: `[Code execution stub - Judge0 not configured]\nLanguage: ${language}\nInput: ${input || "(none)"}`,
      error: null,
      status: "Accepted",
      executionTime: "0.1",
      memoryUsed: "1024",
    };
  }

  try {
    const response = await fetch("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": judge0Key,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      },
      body: JSON.stringify({ source_code: code, language_id: langId, stdin: input ?? "" }),
    });

    const data = await response.json() as Record<string, unknown>;
    return {
      output: (data.stdout as string | null) ?? null,
      error: (data.stderr as string | null) ?? (data.compile_output as string | null) ?? null,
      status: (data.status as { description: string })?.description ?? "Unknown",
      executionTime: (data.time as string | null) ?? null,
      memoryUsed: (data.memory as string | null) ?? null,
    };
  } catch (err) {
    return { output: null, error: String(err), status: "Error", executionTime: null, memoryUsed: null };
  }
}

router.post("/v1/code/run", requireAuth, async (req, res): Promise<void> => {
  const { code, language, input } = req.body;
  if (!code || !language) { res.status(400).json({ message: "code and language required" }); return; }

  const result = await executeCode(code, language, input ?? "");
  res.json(result);
});

router.post("/v1/code/submit", requireAuth, async (req, res): Promise<void> => {
  const { code, language, questionId, sessionId } = req.body;
  if (!code || !language || !questionId || !sessionId) {
    res.status(400).json({ message: "code, language, questionId, and sessionId required" }); return;
  }

  const testCases = await db.select().from(codingTestCasesTable).where(eq(codingTestCasesTable.questionId, questionId));

  let passed = 0;
  const results = [];

  for (const tc of testCases) {
    const execResult = await executeCode(code, language, tc.inputData);
    const actualOutput = execResult.output?.trim() ?? "";
    const expectedOutput = tc.expectedOutput.trim();
    const isPassed = actualOutput === expectedOutput;
    if (isPassed) passed++;

    results.push({
      input: tc.isHidden ? "***" : tc.inputData,
      expected: tc.isHidden ? "***" : expectedOutput,
      actual: tc.isHidden ? null : actualOutput,
      passed: isPassed,
      isHidden: tc.isHidden,
    });
  }

  const total = testCases.length;
  const scoreObtained = total > 0 ? (passed / total) * 10 : 0;

  await db.update(studentAnswersTable).set({
    scoreObtained: String(scoreObtained),
    testCasesPassed: passed,
    testCasesTotal: total,
    codeSubmission: code,
    language,
  }).where(
    eq(studentAnswersTable.sessionId, sessionId)
  );

  res.json({ totalTestCases: total, passed, failed: total - passed, scoreObtained, results });
});

export default router;
