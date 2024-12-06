import express from "express";
import { prismaClient as prisma } from "../db/index.js"; 

const maintenanceRouter = express.Router();

maintenanceRouter.post("/maintenance", async (req, res) => {
  const { laptopId, description, cost, status } = req.body;

  if (!laptopId || !description || !cost || !status) {
    return res.status(400).json({ error: "Laptop ID, description, cost, and status are required" });
  }

  try {
    const maintenanceLog = await prisma.maintenance.create({
      data: {
        laptopId,
        description,
        cost,
        status,
        loggedAt: new Date(), 
      },
    });

    res.status(201).json({
      message: "Maintenance log added successfully",
      maintenanceLog,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

maintenanceRouter.get("/maintenance/:laptopId", async (req, res) => {
    const { laptopId } = req.params;
  
    try {
      const maintenanceHistory = await prisma.maintenance.findMany({
        where: { laptopId: parseInt(laptopId) },
        orderBy: {
          loggedAt: "desc", 
        },
      });
  
      if (maintenanceHistory.length === 0) {
        return res.status(404).json({ message: "No maintenance logs found for this laptop" });
      }
  
      res.status(200).json(maintenanceHistory);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
});


maintenanceRouter.post("/issues", async (req, res) => {
    const { laptopId, employeeId, description, priority, status } = req.body;
  
    if (!laptopId || !employeeId || !description || !priority || !status) {
      return res.status(400).json({ error: "Laptop ID, employee ID, description, priority, and status are required" });
    }
  
    try {
      const issueReport = await prisma.issue.create({
        data: {
          laptopId,
          employeeId,
          description,
          priority,
          status,
          reportedAt: new Date(), 
        },
      });
  
      res.status(201).json({
        message: "Issue reported successfully",
        issue: issueReport,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
});

export default maintenanceRouter;
