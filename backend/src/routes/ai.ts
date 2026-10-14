import { Router } from "express";
import { requireAuth, getCurrentUser } from "../lib/auth";
import { logger } from "../lib/logger";

const router: Router = Router();

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Return stub response if no API key
    return JSON.stringify([]);
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert Computer Science professor. Generate exam questions for CSE students. Always respond ONLY with a valid JSON array. No preamble, no markdown, no explanation." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  let content = data.choices?.[0]?.message?.content ?? "[]";
  // Strip markdown code fences if present
  content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return content;
}

function buildMcqPrompt(syllabusText: string, topic: string, difficulty: string, count: number, subject: string): string {
  return `Generate ${count} ${difficulty} MCQ questions on the topic "${topic}" from this syllabus for ${subject}:
${syllabusText}

Return a JSON array where each item has:
{
  "questionText": "...",
  "questionType": "MCQ",
  "difficulty": "${difficulty}",
  "topic": "${topic}",
  "subject": "${subject}",
  "options": [
    { "label": "A", "text": "...", "isCorrect": false },
    { "label": "B", "text": "...", "isCorrect": true },
    { "label": "C", "text": "...", "isCorrect": false },
    { "label": "D", "text": "...", "isCorrect": false }
  ],
  "explanation": "..."
}`;
}

function buildCodingPrompt(syllabusText: string, topic: string, difficulty: string, count: number, subject: string): string {
  return `Generate ${count} ${difficulty} coding problems on the topic "${topic}" from this syllabus for ${subject}:
${syllabusText}

Return a JSON array where each item has:
{
  "questionText": "Problem statement with constraints...",
  "questionType": "CODING",
  "topic": "${topic}",
  "subject": "${subject}",
  "difficulty": "${difficulty}",
  "sampleInput": "...",
  "sampleOutput": "...",
  "testCases": [
    { "input": "...", "expectedOutput": "...", "isHidden": false },
    { "input": "...", "expectedOutput": "...", "isHidden": true }
  ],
  "explanation": "..."
}`;
}

function getStubQuestions(questionType: string, count: number, topic: string, subject: string, difficulty: string) {
  const questions = [];
  for (let i = 1; i <= count; i++) {
    if (questionType === "MCQ") {
      questions.push({
        questionText: `Sample ${difficulty} MCQ #${i} on ${topic} (${subject})`,
        questionType: "MCQ",
        difficulty,
        topic,
        subject,
        explanation: "This is a stub question generated without an OpenAI API key.",
        options: [
          { label: "A", text: "Option A", isCorrect: false },
          { label: "B", text: "Option B (Correct)", isCorrect: true },
          { label: "C", text: "Option C", isCorrect: false },
          { label: "D", text: "Option D", isCorrect: false },
        ],
        testCases: [],
        sampleInput: null,
        sampleOutput: null,
      });
    } else {
      questions.push({
        questionText: `Sample ${difficulty} coding problem #${i} on ${topic} (${subject}): Write a function that solves this problem.`,
        questionType: "CODING",
        difficulty,
        topic,
        subject,
        explanation: "This is a stub question generated without an OpenAI API key.",
        options: [],
        testCases: [
          { input: "5", expectedOutput: "25", isHidden: false },
          { input: "10", expectedOutput: "100", isHidden: true },
        ],
        sampleInput: "5",
        sampleOutput: "25",
      });
    }
  }
  return questions;
}

router.post("/v1/admin/ai/generate-questions", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const { syllabusText, subject, topic, difficulty, questionType, count } = req.body;

  if (!syllabusText || !subject || !topic || !difficulty || !questionType || !count) {
    res.status(400).json({ message: "All fields required" }); return;
  }

  if (!process.env.OPENAI_API_KEY) {
    logger.warn("OPENAI_API_KEY not set, returning stub questions");
    res.json({ questions: getStubQuestions(questionType, count, topic, subject, difficulty) });
    return;
  }

  try {
    const prompt = questionType === "MCQ"
      ? buildMcqPrompt(syllabusText, topic, difficulty, count, subject)
      : buildCodingPrompt(syllabusText, topic, difficulty, count, subject);

    const raw = await callOpenAI(prompt);
    const questions = JSON.parse(raw);

    res.json({ questions: questions.map((q: Record<string, unknown>) => ({ ...q, isAiGenerated: true })) });
  } catch (err) {
    logger.error({ err }, "AI generation failed");
    res.json({ questions: getStubQuestions(questionType, count, topic, subject, difficulty) });
  }
});

router.post("/v1/admin/ai/regenerate", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const { syllabusText, subject, topic, difficulty, questionType } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    res.json({ questions: getStubQuestions(questionType ?? "MCQ", 1, topic ?? "General", subject ?? "CS", difficulty ?? "MEDIUM") });
    return;
  }

  try {
    const prompt = questionType === "MCQ"
      ? buildMcqPrompt(syllabusText, topic, difficulty, 1, subject)
      : buildCodingPrompt(syllabusText, topic, difficulty, 1, subject);

    const raw = await callOpenAI(prompt);
    const questions = JSON.parse(raw);
    res.json({ questions: questions.map((q: Record<string, unknown>) => ({ ...q, isAiGenerated: true })) });
  } catch (err) {
    logger.error({ err }, "AI regeneration failed");
    res.json({ questions: getStubQuestions(questionType ?? "MCQ", 1, topic ?? "General", subject ?? "CS", difficulty ?? "MEDIUM") });
  }
});

export default router;
