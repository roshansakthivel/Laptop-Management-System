import express from "express";
import { prismaClient as prisma } from "../db/index.js"; 

const laptopRouter = express.Router();

laptopRouter.post("/laptop", async (req, res) => {
  const { brand, model, serialNumber, status, purchaseDate } = req.body;

  if (!brand || !model || !serialNumber || !purchaseDate) {
    return res.status(400).json({ error: "Brand, model, serial number, and purchase date are required" });
  }

  try {
    const newLaptop = await prisma.laptop.create({
      data: {
        brand,
        model,
        serialNumber,
        status: status || "AVAILABLE", 
        purchaseDate,
      },
    });

    res.status(201).json({
      message: "Laptop added successfully",
      laptop: newLaptop,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});


laptopRouter.post("/unassign-laptop", async (req, res) => {
  const { laptopId, status } = req.body;

  // Validate input
  if (!laptopId) {
    return res.status(400).json({ error: "Laptop ID is required" });
  }

  const validStatuses = ['AVAILABLE', 'MAINTENANCE'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Status must be either 'AVAILABLE' or 'MAINTENANCE'" });
  }

  try {
    // First, remove or update the relevant assignment
    const assignment = await prisma.assignment.findFirst({
      where: {
        laptopId: parseInt(laptopId), // Assuming laptopId is an integer
        returnedAt: null, // Only unassign active assignments
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: "No active assignment found for this laptop." });
    }

    // Update the assignment's `returnedAt` field
    await prisma.assignment.update({
      where: { id: assignment.id },
      data: {
        returnedAt: new Date(), // Mark the assignment as returned
      },
    });

    // Next, update the laptop's status and remove the employee association
    const updatedLaptop = await prisma.laptop.update({
      where: {
        id: parseInt(laptopId),
      },
      data: {
        status: status || 'AVAILABLE', // Default to 'AVAILABLE' if not provided
      },
    });

    res.status(200).json({
      message: `Laptop unassigned successfully and set to ${updatedLaptop.status}`,
      laptop: updatedLaptop,
    });
  } catch (error) {
    console.error("Error unassigning laptop:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



laptopRouter.get("/laptop/:laptopId", async (req, res) => {
  const { laptopId } = req.params;

  if (!laptopId) {
    return res.status(400).json({ error: "Laptop ID is required" });
  }

  try {
    // Fetch laptop assignment from the assignment table
    const laptopAssignment = await prisma.assignment.findFirst({
      where: {
        laptopId: parseInt(laptopId), // Assuming laptopId is an integer in the assignment table
      },
      include: {
        // Include related data from the laptop and employee tables
        laptop: true, // Laptop details (if your assignment table has a relation to the laptop table)
        employee: true, // Employee details (if your assignment table has a relation to the employee table)
      },
    });

    if (!laptopAssignment) {
      return res.status(404).json({ error: "Laptop assignment not found" });
    }

    res.status(200).json(laptopAssignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});



laptopRouter.post("/assign", async (req, res) => {
  const { laptopId, employeeId } = req.body;

  if (!laptopId || !employeeId) {
    return res.status(400).json({
      error: "Laptop ID and employee ID are required",
    });
  }

  try {
    // Find the employee by ID
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return res.status(404).json({
        error: "Employee not found",
      });
    }

    // Find the laptop by ID
    const laptop = await prisma.laptop.findUnique({
      where: { id: laptopId },
    });

    if (!laptop) {
      return res.status(404).json({
        error: "Laptop not found",
      });
    }

    if (laptop.status !== "AVAILABLE") {
      return res.status(400).json({
        error: "Laptop is not available for assignment",
      });
    }

    const assignment = await prisma.assignment.create({
      data: {
        laptopId: laptop.id,
        employeeId: employee.id,
        assignedAt: new Date(),
      },
    });

    // Update the laptop status
    await prisma.laptop.update({
      where: { id: laptop.id },
      data: { status: "ASSIGNED" },
    });

    res.status(200).json({
      message: "Laptop assigned successfully",
      assignment,
    });
  } catch (error) {unass
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});



laptopRouter.get("/laptops", async (req, res) => {
    try {
      const laptops = await prisma.laptop.findMany();
      res.status(200).json(laptops);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
});

laptopRouter.get("/laptops/assigned", async (req, res) => {
  try {
    const assignedLaptops = await prisma.assignment.findMany({
      where: {
        returnedAt: null, 
        laptop: {
          status: "ASSIGNED" 
        }
      },
      include: {
        laptop: true, 
        employee: true,
      },
    });

    res.status(200).json(assignedLaptops);
  } catch (error) {
    console.error("Error fetching assigned laptops:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


laptopRouter.get("/laptops/available", async (req, res) => {
  try {
    const availableLaptops = await prisma.laptop.findMany({
      where: {
        status: "AVAILABLE", 
      },
    });

    res.status(200).json(availableLaptops);
  } catch (error) {
    console.error("Error fetching available laptops:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


laptopRouter.get("/laptops/maintenance", async (req, res) => {
  try {
    const maintenanceLaptops = await prisma.laptop.findMany({
      where: {
        status: "MAINTENANCE", 
      },
    });

    res.status(200).json(maintenanceLaptops);
  } catch (error) {
    console.error("Error fetching available laptops:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



laptopRouter.get("/laptop-find/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const laptop = await prisma.laptop.findUnique({
      where: { id: parseInt(id) },
    });

    if (!laptop) {
      return res.status(404).json({ error: "Laptop not found" });
    }

    res.status(200).json({ laptop });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});





laptopRouter.put("/laptop/:id", async (req, res) => {
  const { id } = req.params;
  const { brand, model, serialNumber, status, purchaseDate } = req.body;

  try {
    const existingLaptop = await prisma.laptop.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingLaptop) {
      return res.status(404).json({ error: "Laptop not found" });
    }

    const updatedLaptop = await prisma.laptop.update({
      where: { id: parseInt(id) },
      data: {
        brand: brand || existingLaptop.brand,
        model: model || existingLaptop.model,
        serialNumber: serialNumber || existingLaptop.serialNumber,
        status: status || existingLaptop.status,
        purchaseDate: purchaseDate || existingLaptop.purchaseDate,
      },
    });

    res.status(200).json({
      message: "Laptop updated successfully",
      laptop: updatedLaptop,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

laptopRouter.delete("/laptop/:id", async (req, res) => {
    const { id } = req.params;
  
    try {
      const existingLaptop = await prisma.laptop.findUnique({
        where: { id: parseInt(id) },
      });
  
      if (!existingLaptop) {
        return res.status(404).json({ error: "Laptop not found" });
      }
  
      await prisma.laptop.delete({
        where: { id: parseInt(id) },
      });
  
      res.status(200).json({
        message: "Laptop deleted successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
});



export default laptopRouter;
