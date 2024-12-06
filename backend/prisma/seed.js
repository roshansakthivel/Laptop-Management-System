import {prismaClient as prisma} from '../src/db/index.js'


async function main() {
  const employees = await prisma.employee.createMany({
    data: [
      { name: 'Alice Johnson', email: 'alice@example.com', password: 'password123', department: 'HR', role: 'EMPLOYEE' },
      { name: 'Bob Smith', email: 'bob@example.com', password: 'password123', department: 'IT', role: 'EMPLOYEE' },
      { name: 'Charlie Brown', email: 'charlie@example.com', password: 'password123', department: 'Finance', role: 'ADMIN' },
    ],
  });

  // Seed laptops
  const laptops = await prisma.laptop.createMany({
    data: [
      { brand: 'Dell', model: 'XPS 13', serialNumber: 'SN001', status: 'AVAILABLE', purchaseDate: new Date('2022-01-15') },
      { brand: 'Apple', model: 'MacBook Air', serialNumber: 'SN002', status: 'ASSIGNED', purchaseDate: new Date('2021-11-20') },
      { brand: 'HP', model: 'Pavilion', serialNumber: 'SN003', status: 'MAINTENANCE', purchaseDate: new Date('2023-05-10') },
    ],
  });

  // Seed assignments
  const assignments = await prisma.assignment.createMany({
    data: [
      { laptopId: 2, employeeId: 1, assignedAt: new Date('2023-01-01') },
      { laptopId: 3, employeeId: 2, assignedAt: new Date('2023-02-15'), returnedAt: null },
    ],
  });

  // Seed maintenance
  const maintenanceRecords = await prisma.maintenance.createMany({
    data: [
      { laptopId: 3, description: 'Screen replacement', status: 'MAINTENANCE', cost: 200.0, loggedAt: new Date('2023-07-01') },
    ],
  });

  // Seed issues
  const issues = await prisma.issue.createMany({
    data: [
      { laptopId: 1, employeeId: 1, description: 'Battery issue', priority: 'MEDIUM', status: 'AVAILABLE', reportedAt: new Date('2023-06-15') },
    ],
  });

  // Seed laptop requests
  const laptopRequests = await prisma.laptopRequest.createMany({
    data: [
      { employeeId: 2, description: 'Requesting a high-performance laptop', requestedAt: new Date('2023-08-01') },
    ],
  });

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
