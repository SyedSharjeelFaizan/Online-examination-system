import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { createHmac, randomBytes } from "crypto";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

const { Pool } = pg;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = createHmac("sha256", salt).update(password).digest("hex");
  return `${salt}:${hash}`;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function main() {
  console.log("Seeding database...");

  // Check if admin already exists
  const existingAdmin = await db.select().from(schema.usersTable).where(eq(schema.usersTable.email, "admin@examforge.com")).limit(1);

  let adminId: number;
  if (existingAdmin.length === 0) {
    const [admin] = await db.insert(schema.usersTable).values({
      name: "Prof. Raj Kumar",
      email: "admin@examforge.com",
      passwordHash: await hashPassword("admin123"),
      role: "ADMIN",
      department: "Computer Science",
    }).returning();
    adminId = admin.id;
    console.log("Created admin:", admin.email);
  } else {
    // Update role to ADMIN if needed
    await db.update(schema.usersTable).set({ role: "ADMIN", name: "Prof. Raj Kumar" }).where(eq(schema.usersTable.email, "admin@examforge.com"));
    adminId = existingAdmin[0].id;
    console.log("Admin already exists, updated role to ADMIN");
  }

  // Seed students
  const studentData = [
    { name: "Arjun Sharma", email: "arjun@student.com", rollNumber: "CS2021001", department: "Computer Science", semester: 5 },
    { name: "Priya Patel", email: "priya@student.com", rollNumber: "CS2021002", department: "Computer Science", semester: 5 },
    { name: "Rahul Singh", email: "rahul@student.com", rollNumber: "CS2021003", department: "Computer Science", semester: 3 },
  ];

  for (const s of studentData) {
    const exists = await db.select().from(schema.usersTable).where(eq(schema.usersTable.email, s.email)).limit(1);
    if (exists.length === 0) {
      await db.insert(schema.usersTable).values({
        ...s,
        passwordHash: await hashPassword("student123"),
        role: "STUDENT",
      });
      console.log("Created student:", s.email);
    }
  }

  // Seed exams
  const existingExams = await db.select().from(schema.examsTable).limit(1);
  if (existingExams.length === 0) {
    const [mcqExam] = await db.insert(schema.examsTable).values({
      title: "Data Structures Mid-Semester",
      subject: "Data Structures",
      department: "Computer Science",
      semester: 5,
      durationMinutes: 90,
      totalMarks: 100,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      examType: "MCQ",
      difficulty: "MEDIUM",
      isAdaptive: false,
      voiceModeEnabled: false,
      negativeMarking: true,
      negativeMarksValue: "0.25",
      status: "PUBLISHED",
      createdBy: adminId,
    }).returning();

    const [codingExam] = await db.insert(schema.examsTable).values({
      title: "Python Programming Assessment",
      subject: "Programming",
      department: "Computer Science",
      semester: 3,
      durationMinutes: 120,
      totalMarks: 50,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      examType: "CODING",
      difficulty: "EASY",
      isAdaptive: false,
      voiceModeEnabled: false,
      negativeMarking: false,
      negativeMarksValue: "0",
      status: "PUBLISHED",
      createdBy: adminId,
    }).returning();

    const [adaptiveExam] = await db.insert(schema.examsTable).values({
      title: "Algorithms Adaptive Test",
      subject: "Algorithms",
      department: "Computer Science",
      semester: 5,
      durationMinutes: 60,
      totalMarks: 80,
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      examType: "MIXED",
      difficulty: "HARD",
      isAdaptive: true,
      voiceModeEnabled: true,
      negativeMarking: false,
      negativeMarksValue: "0",
      status: "DRAFT",
      createdBy: adminId,
    }).returning();

    console.log("Created exams:", mcqExam.id, codingExam.id, adaptiveExam.id);

    // Add MCQ questions for Data Structures exam
    const mcqQs = [
      {
        questionText: "Which data structure uses LIFO (Last In First Out) principle?",
        options: [
          { text: "Queue", correct: false, label: "A" },
          { text: "Stack", correct: true, label: "B" },
          { text: "Linked List", correct: false, label: "C" },
          { text: "Tree", correct: false, label: "D" },
        ]
      },
      {
        questionText: "What is the time complexity of binary search?",
        options: [
          { text: "O(n)", correct: false, label: "A" },
          { text: "O(n²)", correct: false, label: "B" },
          { text: "O(log n)", correct: true, label: "C" },
          { text: "O(1)", correct: false, label: "D" },
        ]
      },
      {
        questionText: "Which traversal of a Binary Search Tree gives elements in sorted order?",
        options: [
          { text: "Preorder", correct: false, label: "A" },
          { text: "Postorder", correct: false, label: "B" },
          { text: "Level order", correct: false, label: "C" },
          { text: "Inorder", correct: true, label: "D" },
        ]
      },
    ];

    for (let i = 0; i < mcqQs.length; i++) {
      const qData = mcqQs[i];
      const [q] = await db.insert(schema.questionsTable).values({
        examId: mcqExam.id,
        questionText: qData.questionText,
        questionType: "MCQ",
        difficulty: "MEDIUM",
        marks: Math.floor(100 / mcqQs.length),
        topic: "Data Structures",
        subject: "Data Structures",
        isAiGenerated: false,
        orderIndex: i + 1,
      }).returning();

      for (const opt of qData.options) {
        await db.insert(schema.mcqOptionsTable).values({
          questionId: q.id,
          optionText: opt.text,
          isCorrect: opt.correct,
          optionLabel: opt.label,
        });
      }
    }

    // Add coding question
    const [cq] = await db.insert(schema.questionsTable).values({
      examId: codingExam.id,
      questionText: "Write a Python function `factorial(n)` that returns the factorial of a non-negative integer n. For n=0 or n=1, return 1.",
      questionType: "CODING",
      difficulty: "EASY",
      marks: 25,
      topic: "Recursion",
      subject: "Programming",
      isAiGenerated: false,
      orderIndex: 1,
    }).returning();

    await db.insert(schema.codingTestCasesTable).values([
      { questionId: cq.id, inputData: "0", expectedOutput: "1", isHidden: false, marksWeightage: "1" },
      { questionId: cq.id, inputData: "5", expectedOutput: "120", isHidden: false, marksWeightage: "1" },
      { questionId: cq.id, inputData: "10", expectedOutput: "3628800", isHidden: true, marksWeightage: "1" },
    ]);

    // Syllabus
    await db.insert(schema.syllabusTable).values({
      examId: mcqExam.id,
      contentText: "Unit 1: Arrays and Strings\nUnit 2: Linked Lists (Singly, Doubly, Circular)\nUnit 3: Stacks and Queues\nUnit 4: Trees (BST, AVL, Heap)\nUnit 5: Graphs (BFS, DFS)\nUnit 6: Hashing and Hash Tables\nUnit 7: Sorting Algorithms (Quick, Merge, Heap)\nUnit 8: Searching (Binary Search, Linear Search)",
    });

    // Seed a notification
    await db.insert(schema.notificationsTable).values({
      title: "Welcome to ExamForge!",
      message: "Your next exam 'Data Structures Mid-Semester' is scheduled for tomorrow. Make sure to review the syllabus.",
      targetType: "ALL",
      isRead: false,
      sentAt: new Date(),
      createdBy: adminId,
    });

    console.log("Seeded questions, test cases, syllabus, and notifications.");
  } else {
    console.log("Exams already seeded, skipping.");
  }

  await pool.end();
  console.log("Done!");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
