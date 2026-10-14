type DemoRole = "ADMIN" | "STUDENT";
type DemoExamStatus = "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED";

type DemoUser = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: DemoRole;
  rollNumber: string | null;
  department: string | null;
  semester: number | null;
  isActive: boolean;
  createdAt: string;
};

type DemoExam = {
  id: number;
  title: string;
  subject: string;
  department: string | null;
  semester: number | null;
  durationMinutes: number;
  totalMarks: number;
  scheduledAt: string;
  examType: "MCQ" | "CODING" | "MIXED";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  isAdaptive: boolean;
  voiceModeEnabled: boolean;
  negativeMarking: boolean;
  negativeMarksValue: number;
  status: DemoExamStatus;
  createdBy: number;
  createdAt: string;
  questionCount: number;
  syllabusText?: string | null;
};

type DemoResultAnswer = {
  questionId: number;
  questionText: string;
  questionType: "MCQ" | "CODING";
  scoreObtained: number;
  maxMarks: number;
  testCasesPassed: number | null;
  testCasesTotal: number | null;
};

type DemoResult = {
  id: number;
  studentId: number;
  examId: number;
  sessionId: number;
  totalScore: number;
  mcqScore: number;
  codingScore: number;
  percentage: number;
  grade: string;
  isPublished: boolean;
  submittedAt: string;
  answers: DemoResultAnswer[];
};

type DemoNotification = {
  id: number;
  title: string;
  message: string;
  targetType: "ALL" | "STUDENT" | "ADMIN";
  targetId: number | null;
  isRead: boolean;
  scheduledAt: string | null;
  sentAt: string | null;
  createdBy: number;
  createdAt: string;
};

const demoUsers: DemoUser[] = [
  {
    id: 1,
    name: "Prof. Raj Kumar",
    email: "admin@examforge.com",
    password: "admin123",
    role: "ADMIN",
    rollNumber: null,
    department: "Computer Science",
    semester: null,
    isActive: true,
    createdAt: "2026-04-10T09:00:00.000Z",
  },
  {
    id: 2,
    name: "Arjun Sharma",
    email: "arjun@student.com",
    password: "student123",
    role: "STUDENT",
    rollNumber: "CS2021001",
    department: "Computer Science",
    semester: 5,
    isActive: true,
    createdAt: "2026-04-11T09:00:00.000Z",
  },
  {
    id: 3,
    name: "Priya Patel",
    email: "priya@student.com",
    password: "student123",
    role: "STUDENT",
    rollNumber: "CS2021002",
    department: "Computer Science",
    semester: 5,
    isActive: true,
    createdAt: "2026-04-11T09:30:00.000Z",
  },
  {
    id: 4,
    name: "Rahul Singh",
    email: "rahul@student.com",
    password: "student123",
    role: "STUDENT",
    rollNumber: "CS2021003",
    department: "Computer Science",
    semester: 3,
    isActive: true,
    createdAt: "2026-04-11T10:00:00.000Z",
  },
];

const demoExams: DemoExam[] = [
  {
    id: 1,
    title: "Data Structures Mid-Semester",
    subject: "Data Structures",
    department: "Computer Science",
    semester: 5,
    durationMinutes: 90,
    totalMarks: 100,
    scheduledAt: "2026-04-18T09:00:00.000Z",
    examType: "MCQ",
    difficulty: "MEDIUM",
    isAdaptive: false,
    voiceModeEnabled: false,
    negativeMarking: true,
    negativeMarksValue: 0.25,
    status: "PUBLISHED",
    createdBy: 1,
    createdAt: "2026-04-12T08:00:00.000Z",
    questionCount: 3,
    syllabusText:
      "Unit 1: Arrays and Strings\nUnit 2: Linked Lists\nUnit 3: Stacks and Queues\nUnit 4: Trees and Graphs",
  },
  {
    id: 2,
    title: "Python Programming Assessment",
    subject: "Programming",
    department: "Computer Science",
    semester: 3,
    durationMinutes: 120,
    totalMarks: 50,
    scheduledAt: "2026-04-19T10:00:00.000Z",
    examType: "CODING",
    difficulty: "EASY",
    isAdaptive: false,
    voiceModeEnabled: false,
    negativeMarking: false,
    negativeMarksValue: 0,
    status: "PUBLISHED",
    createdBy: 1,
    createdAt: "2026-04-12T09:00:00.000Z",
    questionCount: 1,
    syllabusText:
      "Write clean Python functions.\nPractice recursion and basic problem solving.",
  },
  {
    id: 3,
    title: "Algorithms Adaptive Test",
    subject: "Algorithms",
    department: "Computer Science",
    semester: 5,
    durationMinutes: 60,
    totalMarks: 80,
    scheduledAt: "2026-04-20T11:00:00.000Z",
    examType: "MIXED",
    difficulty: "HARD",
    isAdaptive: true,
    voiceModeEnabled: true,
    negativeMarking: false,
    negativeMarksValue: 0,
    status: "DRAFT",
    createdBy: 1,
    createdAt: "2026-04-13T11:00:00.000Z",
    questionCount: 4,
    syllabusText: "Adaptive mixed-format assessment covering algorithms and problem solving.",
  },
];

const demoResults: DemoResult[] = [
  {
    id: 1,
    studentId: 2,
    examId: 1,
    sessionId: 101,
    totalScore: 78,
    mcqScore: 78,
    codingScore: 0,
    percentage: 78,
    grade: "B+",
    isPublished: true,
    submittedAt: "2026-04-15T10:30:00.000Z",
    answers: [
      {
        questionId: 11,
        questionText: "Which data structure uses LIFO principle?",
        questionType: "MCQ",
        scoreObtained: 33,
        maxMarks: 33,
        testCasesPassed: null,
        testCasesTotal: null,
      },
      {
        questionId: 12,
        questionText: "What is the time complexity of binary search?",
        questionType: "MCQ",
        scoreObtained: 33,
        maxMarks: 33,
        testCasesPassed: null,
        testCasesTotal: null,
      },
      {
        questionId: 13,
        questionText: "Which traversal gives sorted BST output?",
        questionType: "MCQ",
        scoreObtained: 12,
        maxMarks: 34,
        testCasesPassed: null,
        testCasesTotal: null,
      },
    ],
  },
  {
    id: 2,
    studentId: 3,
    examId: 1,
    sessionId: 102,
    totalScore: 91,
    mcqScore: 91,
    codingScore: 0,
    percentage: 91,
    grade: "A",
    isPublished: true,
    submittedAt: "2026-04-15T10:35:00.000Z",
    answers: [],
  },
  {
    id: 3,
    studentId: 4,
    examId: 2,
    sessionId: 103,
    totalScore: 42,
    mcqScore: 0,
    codingScore: 42,
    percentage: 84,
    grade: "A-",
    isPublished: true,
    submittedAt: "2026-04-16T12:15:00.000Z",
    answers: [
      {
        questionId: 21,
        questionText: "Write a Python function factorial(n).",
        questionType: "CODING",
        scoreObtained: 42,
        maxMarks: 50,
        testCasesPassed: 2,
        testCasesTotal: 3,
      },
    ],
  },
];

let demoNotifications: DemoNotification[] = [
  {
    id: 1,
    title: "Welcome to ExamForge",
    message: "Use the seeded demo credentials to explore the platform.",
    targetType: "ALL",
    targetId: null,
    isRead: false,
    scheduledAt: null,
    sentAt: "2026-04-15T08:00:00.000Z",
    createdBy: 1,
    createdAt: "2026-04-15T08:00:00.000Z",
  },
  {
    id: 2,
    title: "Upcoming Data Structures Exam",
    message: "The Data Structures Mid-Semester opens tomorrow morning.",
    targetType: "STUDENT",
    targetId: 2,
    isRead: false,
    scheduledAt: null,
    sentAt: "2026-04-16T08:30:00.000Z",
    createdBy: 1,
    createdAt: "2026-04-16T08:30:00.000Z",
  },
];

export function isDbUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Failed query") ||
    message.includes("ECONNREFUSED") ||
    message.includes("connect") ||
    message.includes("does not exist") ||
    message.includes("relation")
  );
}

export function toPublicUser(user: DemoUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    rollNumber: user.rollNumber,
    department: user.department,
    semester: user.semester,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export function authenticateDemoUser(email: string, password: string) {
  const user = demoUsers.find((candidate) => candidate.email === email);
  if (!user || user.password !== password) return null;
  return user;
}

export function registerDemoStudent(input: Omit<DemoUser, "id" | "role" | "isActive" | "createdAt">) {
  const existing = demoUsers.find((candidate) => candidate.email === input.email);
  if (existing) return null;

  const nextId = demoUsers.reduce((max, user) => Math.max(max, user.id), 0) + 1;
  const user: DemoUser = {
    ...input,
    id: nextId,
    role: "STUDENT",
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  demoUsers.push(user);
  return user;
}

export function getDemoUserById(id: number) {
  return demoUsers.find((user) => user.id === id) ?? null;
}

export function listDemoStudents(filters?: { department?: string; semester?: number }) {
  return demoUsers
    .filter((user) => user.role === "STUDENT")
    .filter((user) => {
      if (filters?.department && user.department !== filters.department) return false;
      if (filters?.semester && user.semester !== filters.semester) return false;
      return true;
    })
    .map(toPublicUser);
}

export function listDemoStudentExams() {
  return demoExams.filter((exam) => exam.status !== "DRAFT");
}

export function getDemoStudentExam(examId: number) {
  return demoExams.find((exam) => exam.id === examId) ?? null;
}

export function listDemoAdminExams(adminId: number, filters?: { status?: string; department?: string; semester?: number }) {
  return demoExams
    .filter((exam) => exam.createdBy === adminId)
    .filter((exam) => {
      if (filters?.status && exam.status !== filters.status) return false;
      if (filters?.department && exam.department !== filters.department) return false;
      if (filters?.semester && exam.semester !== filters.semester) return false;
      return true;
    });
}

type DemoExamInput = {
  title: string;
  subject: string;
  department?: string | null;
  semester?: number | null;
  durationMinutes: number;
  totalMarks: number;
  scheduledAt: string;
  examType: "MCQ" | "CODING" | "MIXED";
  difficulty?: "EASY" | "MEDIUM" | "HARD" | null;
  isAdaptive?: boolean;
  voiceModeEnabled?: boolean;
  negativeMarking?: boolean;
  negativeMarksValue?: number;
  status?: DemoExamStatus;
  createdBy: number;
  questionCount?: number;
  syllabusText?: string | null;
};

export function createDemoExam(input: DemoExamInput) {
  const nextId = demoExams.reduce((max, exam) => Math.max(max, exam.id), 0) + 1;
  const exam: DemoExam = {
    id: nextId,
    title: input.title,
    subject: input.subject,
    department: input.department ?? null,
    semester: input.semester ?? null,
    durationMinutes: input.durationMinutes,
    totalMarks: input.totalMarks,
    scheduledAt: input.scheduledAt,
    examType: input.examType,
    difficulty: input.difficulty ?? "MEDIUM",
    isAdaptive: input.isAdaptive ?? false,
    voiceModeEnabled: input.voiceModeEnabled ?? false,
    negativeMarking: input.negativeMarking ?? false,
    negativeMarksValue: input.negativeMarksValue ?? 0,
    status: input.status ?? "DRAFT",
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    questionCount: input.questionCount ?? 0,
    syllabusText: input.syllabusText ?? null,
  };

  demoExams.push(exam);
  return exam;
}

export function getDemoAdminExam(examId: number, adminId: number) {
  return demoExams.find((exam) => exam.id === examId && exam.createdBy === adminId) ?? null;
}

export function updateDemoExam(examId: number, adminId: number, updates: Partial<DemoExamInput>) {
  const index = demoExams.findIndex((exam) => exam.id === examId && exam.createdBy === adminId);
  if (index === -1) return null;

  const current = demoExams[index];
  const next: DemoExam = {
    ...current,
    title: updates.title ?? current.title,
    subject: updates.subject ?? current.subject,
    department: updates.department ?? current.department,
    semester: updates.semester ?? current.semester,
    durationMinutes: updates.durationMinutes ?? current.durationMinutes,
    totalMarks: updates.totalMarks ?? current.totalMarks,
    scheduledAt: updates.scheduledAt ?? current.scheduledAt,
    examType: updates.examType ?? current.examType,
    difficulty: updates.difficulty ?? current.difficulty,
    isAdaptive: updates.isAdaptive ?? current.isAdaptive,
    voiceModeEnabled: updates.voiceModeEnabled ?? current.voiceModeEnabled,
    negativeMarking: updates.negativeMarking ?? current.negativeMarking,
    negativeMarksValue: updates.negativeMarksValue ?? current.negativeMarksValue,
    status: updates.status ?? current.status,
    questionCount: updates.questionCount ?? current.questionCount,
    syllabusText: updates.syllabusText ?? current.syllabusText ?? null,
  };

  demoExams[index] = next;
  return next;
}

export function deleteDemoExam(examId: number, adminId: number): boolean {
  const index = demoExams.findIndex((exam) => exam.id === examId && exam.createdBy === adminId);
  if (index === -1) return false;
  demoExams.splice(index, 1);
  return true;
}

export function getDemoAdminDashboard() {
  const adminExams = demoExams.filter((exam) => exam.createdBy === 1);
  return {
    totalStudents: demoUsers.filter((user) => user.role === "STUDENT").length,
    totalExams: adminExams.length,
    activeExams: adminExams.filter((exam) => exam.status === "ONGOING" || exam.status === "PUBLISHED").length,
    totalResults: demoResults.length,
    recentExams: [...adminExams].reverse().slice(0, 5),
    examsByStatus: {
      DRAFT: adminExams.filter((exam) => exam.status === "DRAFT").length,
      PUBLISHED: adminExams.filter((exam) => exam.status === "PUBLISHED").length,
      ONGOING: adminExams.filter((exam) => exam.status === "ONGOING").length,
      COMPLETED: adminExams.filter((exam) => exam.status === "COMPLETED").length,
    },
  };
}

export function getDemoStudentResults(studentId: number) {
  return demoResults
    .filter((result) => result.studentId === studentId)
    .map((result) => {
      const exam = demoExams.find((candidate) => candidate.id === result.examId);
      const student = demoUsers.find((candidate) => candidate.id === result.studentId);
      return {
        id: result.id,
        studentId: result.studentId,
        examId: result.examId,
        sessionId: result.sessionId,
        totalScore: result.totalScore,
        mcqScore: result.mcqScore,
        codingScore: result.codingScore,
        percentage: result.percentage,
        grade: result.grade,
        isPublished: result.isPublished,
        submittedAt: result.submittedAt,
        examTitle: exam?.title ?? null,
        studentName: student?.name ?? null,
      };
    });
}

export function getDemoStudentPerformance(studentId: number) {
  const results = demoResults.filter((result) => result.studentId === studentId);
  const trend = results.map((result) => {
    const exam = demoExams.find((candidate) => candidate.id === result.examId);
    return {
      examTitle: exam?.title ?? "Unknown",
      percentage: result.percentage,
      submittedAt: result.submittedAt,
    };
  });
  const averageScore = results.length
    ? Math.round(results.reduce((sum, result) => sum + result.percentage, 0) / results.length)
    : 0;

  return {
    studentId,
    totalExams: results.length,
    averageScore,
    trend,
    weakTopics: ["Dynamic Programming", "Graphs", "Recursion"],
    aiSuggestions: [
      "Revise recursion with a few short coding drills before the next programming assessment.",
      "Spend 20 minutes on graph traversal problems to build confidence with BFS and DFS.",
      "Revisit time complexity patterns so you can choose the fastest approach more consistently.",
    ],
  };
}

export function getDemoResult(resultId: number) {
  const result = demoResults.find((candidate) => candidate.id === resultId);
  if (!result) return null;

  const exam = demoExams.find((candidate) => candidate.id === result.examId);
  const student = demoUsers.find((candidate) => candidate.id === result.studentId);

  return {
    id: result.id,
    studentId: result.studentId,
    examId: result.examId,
    sessionId: result.sessionId,
    totalScore: result.totalScore,
    mcqScore: result.mcqScore,
    codingScore: result.codingScore,
    percentage: result.percentage,
    grade: result.grade,
    isPublished: result.isPublished,
    submittedAt: result.submittedAt,
    examTitle: exam?.title ?? null,
    studentName: student?.name ?? null,
    answers: result.answers,
  };
}

export function listDemoNotifications(current: { id: number; role: string }) {
  return demoNotifications
    .filter((notification) => {
      if (notification.targetType === "ALL") return true;
      if (notification.targetType === "ADMIN") return current.role === "ADMIN";
      if (notification.targetType === "STUDENT") {
        return current.role === "STUDENT" && (notification.targetId == null || notification.targetId === current.id);
      }
      return false;
    })
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

export function markDemoNotificationRead(notificationId: number) {
  const index = demoNotifications.findIndex((notification) => notification.id === notificationId);
  if (index === -1) return null;
  demoNotifications[index] = { ...demoNotifications[index], isRead: true };
  return demoNotifications[index];
}

export function listDemoAdminNotifications() {
  return [...demoNotifications].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

let nextDemoSessionId = 1000;
const demoSessions = new Map<number, any>();

export function startDemoExam(studentId: number, examId: number) {
  const exam = getDemoStudentExam(examId);
  if (!exam) return null;
  
  const sessionId = nextDemoSessionId++;
  const session = {
    id: sessionId,
    studentId,
    examId,
    status: "ONGOING",
    startTime: new Date().toISOString(),
    answers: [] as any[]
  };
  demoSessions.set(sessionId, session);
  
  return {
    sessionId,
    examId,
    questions: [
      {
        id: 11, examId, questionText: "Which data structure uses LIFO principle?", questionType: "MCQ", difficulty: "EASY", marks: 33, topic: "Basics", subject: exam.subject, isAiGenerated: false, orderIndex: 1,
        options: [{ id: 111, optionText: "Stack", isCorrect: null, optionLabel: "A" }, { id: 112, optionText: "Queue", isCorrect: null, optionLabel: "B" }],
        testCases: []
      },
      {
        id: 12, examId, questionText: "Write a function to return true.", questionType: "CODING", difficulty: "MEDIUM", marks: 33, topic: "Basics", subject: exam.subject, isAiGenerated: false, orderIndex: 2,
        options: [],
        testCases: [{ id: 121, inputData: "()", expectedOutput: "true", isHidden: false, marksWeightage: 1 }]
      }
    ],
    timeRemainingSeconds: exam.durationMinutes * 60,
    savedAnswers: [],
    status: "ONGOING"
  };
}

export function saveDemoAnswer(sessionId: number, answerData: any) {
  const session = demoSessions.get(sessionId);
  if (session) {
    const existing = session.answers.find((a: any) => a.questionId === answerData.questionId);
    if (existing) {
      Object.assign(existing, answerData);
    } else {
      session.answers.push(answerData);
    }
  }
}

export function submitDemoSession(studentId: number, sessionId: number) {
  const session = demoSessions.get(sessionId);
  if (!session) return null;
  
  const exam = getDemoStudentExam(session.examId);
  if (!exam) return null;

  session.status = "SUBMITTED";
  
  let mcqScore = 0;
  let codingScore = 0;
  
  const mcqAns = session.answers.find((a: any) => a.questionId === 11);
  if (mcqAns?.selectedOptionId === 111) mcqScore += 33;
  
  const codeAns = session.answers.find((a: any) => a.questionId === 12);
  if (codeAns?.codeSubmission && codeAns.codeSubmission.toLowerCase().includes("true")) codingScore += 33;

  const totalScore = mcqScore + codingScore;
  const percentage = Math.round((totalScore / 66) * 100);
  
  const resultId = demoResults.length + 1;
  const result: DemoResult = {
    id: resultId,
    studentId,
    examId: session.examId,
    sessionId,
    totalScore,
    mcqScore,
    codingScore,
    percentage,
    grade: percentage > 80 ? "A" : percentage > 60 ? "B" : "C",
    isPublished: true,
    submittedAt: new Date().toISOString(),
    answers: []
  };
  demoResults.push(result);
  
  return { resultId, totalScore, percentage, grade: result.grade, autoSubmitted: false };
}

export function getDemoSession(sessionId: number) {
  const session = demoSessions.get(sessionId);
  if (!session) return null;
  
  const exam = getDemoStudentExam(session.examId);
  if (!exam) return null;
  
  return {
    sessionId, examId: session.examId, 
    questions: [
      {
        id: 11, examId: session.examId, questionText: "Which data structure uses LIFO principle?", questionType: "MCQ", difficulty: "EASY", marks: 33, topic: "Basics", subject: exam.subject, isAiGenerated: false, orderIndex: 1,
        options: [{ id: 111, optionText: "Stack", isCorrect: null, optionLabel: "A" }, { id: 112, optionText: "Queue", isCorrect: null, optionLabel: "B" }],
        testCases: []
      },
      {
        id: 12, examId: session.examId, questionText: "Write a function to return true.", questionType: "CODING", difficulty: "MEDIUM", marks: 33, topic: "Basics", subject: exam.subject, isAiGenerated: false, orderIndex: 2,
        options: [],
        testCases: [{ id: 121, inputData: "()", expectedOutput: "true", isHidden: false, marksWeightage: 1 }]
      }
    ],
    timeRemainingSeconds: exam.durationMinutes * 60,
    savedAnswers: session.answers,
    status: session.status
  };
}
