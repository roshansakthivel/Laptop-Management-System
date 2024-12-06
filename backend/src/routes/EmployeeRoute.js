import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prismaClient as prisma } from "../db/index.js";
import { authenticateToken } from "../middleware.js";

const employeeRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
const ALLOWED_ROLES = ["ADMIN", "EMPLOYEE"];

const generateToken = (employee) => {
  return jwt.sign(
    {
      id: employee.id,
      email: employee.email,
      role: employee.role,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};

employeeRouter.post("/signup", async (req, res) => {
  const { name, email, password, department, role } = req.body;

  if (!name || !email || !password || !department || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const existingEmployee = await prisma.employee.findUnique({
      where: { email },
    });
    if (existingEmployee) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await prisma.employee.create({
      data: {
        name,
        email,
        department,
        role,
        password: hashedPassword,
      },
    });

    const token = generateToken(newEmployee);

    res.status(201).json({
      message: "Employee created successfully",
      token,
      role: newEmployee.role
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

employeeRouter.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { email },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(employee);

    res.status(200).json({
      message: "Login successful",
      employee: { id: employee.id, email: employee.email, role: employee.role },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});


employeeRouter.get("/employees", async (req, res) => {
  try {
    const employees = await prisma.employee.findMany();
    res.status(200).json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

employeeRouter.post("/assign-laptop",authenticateToken, async (req, res) => {
  const { laptopId, employeeId } = req.body;

  if (!laptopId || !employeeId) {
    return res.status(400).json({ error: "Laptop ID and Employee ID are required" });
  }

  try {
    const laptop = await prisma.laptop.findUnique({
      where: { id: laptopId },
    });

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!laptop) {
      return res.status(404).json({ error: "Laptop not found" });
    }

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    const assignment = await prisma.assignment.create({
      data: {
        laptopId,
        employeeId,
        assignedAt: new Date(),
      },
    });

    await prisma.laptop.update({
      where: { id: laptopId },
      data: {
        status: "ASSIGNED", 
      },
    });

    res.status(201).json({
      message: "Laptop assigned successfully",
      assignment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

employeeRouter.get("/employee/:employeeId/laptops",authenticateToken, async (req, res) => {
  const { employeeId } = req.params;

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
      include: {
        assignments: {
          include: {
            laptop: true,
          },
        },
      },
    });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const laptopsAssigned = employee.assignments.map((assignment) => assignment.laptop);

    res.status(200).json(laptopsAssigned);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});



export default employeeRouter;
