import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, createToken, hashPassword, verifyPassword, getCurrentUser } from "../lib/auth";
import { authenticateDemoUser, getDemoUserById, isDbUnavailableError, listDemoStudents, toPublicUser, registerDemoStudent } from "../lib/demo";

const router: Router = Router();

router.post("/v1/auth/register", async (req, res): Promise<void> => {
  const { name, email, password, rollNumber, department, semester } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ success: false, status: 400, message: "Name, email, and password are required", timestamp: new Date().toISOString() });
    return;
  }

  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ success: false, status: 400, message: "Email already registered", timestamp: new Date().toISOString() });
      return;
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(usersTable).values({
      name,
      email,
      passwordHash,
      role: "STUDENT",
      rollNumber: rollNumber ?? null,
      department: department ?? null,
      semester: semester ?? null,
    }).returning();

    const token = createToken({ userId: user.id, email: user.email, role: user.role });
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, rollNumber: user.rollNumber, department: user.department, semester: user.semester, isActive: user.isActive, createdAt: user.createdAt?.toISOString() },
    });
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;

    const demoUser = registerDemoStudent({ name, email, password, rollNumber: rollNumber ?? null, department: department ?? null, semester: semester ?? null });
    if (!demoUser) {
      res.status(400).json({ success: false, status: 400, message: "Email already registered", timestamp: new Date().toISOString() });
      return;
    }

    const token = createToken({ userId: demoUser.id, email: demoUser.email, role: demoUser.role });
    res.status(201).json({
      token,
      user: toPublicUser(demoUser),
    });
  }
});

router.post("/v1/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ success: false, status: 400, message: "Email and password required", timestamp: new Date().toISOString() });
    return;
  }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ success: false, status: 401, message: "Invalid credentials", timestamp: new Date().toISOString() });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, status: 401, message: "Invalid credentials", timestamp: new Date().toISOString() });
      return;
    }

    const token = createToken({ userId: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, rollNumber: user.rollNumber, department: user.department, semester: user.semester, isActive: user.isActive, createdAt: user.createdAt?.toISOString() },
    });
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;

    const demoUser = authenticateDemoUser(email, password);
    if (!demoUser) {
      res.status(401).json({ success: false, status: 401, message: "Invalid credentials", timestamp: new Date().toISOString() });
      return;
    }

    const token = createToken({ userId: demoUser.id, email: demoUser.email, role: demoUser.role });
    res.json({
      token,
      user: toPublicUser(demoUser),
    });
  }
});

router.get("/v1/auth/me", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current) { res.status(401).json({ message: "Unauthorized" }); return; }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, current.id)).limit(1);
    if (!user) { res.status(404).json({ message: "User not found" }); return; }

    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, rollNumber: user.rollNumber, department: user.department, semester: user.semester, isActive: user.isActive, createdAt: user.createdAt?.toISOString() });
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;

    const demoUser = getDemoUserById(current.id);
    if (!demoUser) { res.status(404).json({ message: "User not found" }); return; }
    res.json(toPublicUser(demoUser));
  }
});

router.patch("/v1/auth/profile", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current) { res.status(401).json({ message: "Unauthorized" }); return; }

  const { name, department, semester } = req.body;
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name) updates.name = name;
  if (department != null) updates.department = department;
  if (semester != null) updates.semester = semester;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, current.id)).returning();
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, rollNumber: user.rollNumber, department: user.department, semester: user.semester, isActive: user.isActive, createdAt: user.createdAt?.toISOString() });
});

// Admin: list students
router.get("/v1/admin/students", requireAuth, async (req, res): Promise<void> => {
  const current = getCurrentUser(req);
  if (!current || current.role !== "ADMIN") { res.status(403).json({ message: "Forbidden" }); return; }

  const { department, semester } = req.query;
  try {
    const students = await db.select().from(usersTable);
    const filtered = students.filter(s => {
      if (s.role !== "STUDENT") return false;
      if (department && s.department !== department) return false;
      if (semester && s.semester !== Number(semester)) return false;
      return true;
    });

    res.json(filtered.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, rollNumber: u.rollNumber, department: u.department, semester: u.semester, isActive: u.isActive, createdAt: u.createdAt?.toISOString() })));
  } catch (error) {
    if (!isDbUnavailableError(error)) throw error;

    res.json(
      listDemoStudents({
        department: typeof department === "string" ? department : undefined,
        semester: typeof semester === "string" ? Number(semester) : undefined,
      }),
    );
  }
});

export default router;
