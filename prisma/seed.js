require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const employees = [
  {
    employee_name: 'Rahul Sharma',
    employee_id: 'EMP001',
    email: 'rahul.sharma@company.com',
    joining_date: new Date('2024-01-15'),
  },
  {
    employee_name: 'Priya Patel',
    employee_id: 'EMP002',
    email: 'priya.patel@company.com',
    joining_date: new Date('2024-06-01'),
  },
  {
    employee_name: 'Amit Kumar',
    employee_id: 'EMP003',
    email: 'amit.kumar@company.com',
    joining_date: new Date('2025-03-10'),
  },
  {
    employee_name: 'Sneha Reddy',
    employee_id: 'EMP004',
    email: 'sneha.reddy@company.com',
    joining_date: new Date('2025-11-20'),
  },
  {
    employee_name: 'Vikram Singh',
    employee_id: 'EMP005',
    email: 'vikram.singh@company.com',
    joining_date: new Date('2026-05-01'),
  },
];

async function main() {
  console.log('Seeding database...');

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { employee_id: emp.employee_id },
      update: emp,
      create: emp,
    });
  }

  const allEmployees = await prisma.employee.findMany();
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  for (const emp of allEmployees) {
    const joinDate = new Date(emp.joining_date);
    if (joinDate.getFullYear() > year || (joinDate.getFullYear() === year && joinDate.getMonth() > month)) {
      continue;
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= Math.min(daysInMonth, 15); day++) {
      const dprDate = new Date(year, month, day);
      if (dprDate < joinDate) continue;

      const statuses = ['Filled', 'Filled', 'Not_Filled', 'NA', 'Holiday'];
      const status = statuses[day % statuses.length];

      await prisma.dprEntry.upsert({
        where: {
          employee_id_dpr_date: {
            employee_id: emp.id,
            dpr_date: dprDate,
          },
        },
        update: { status },
        create: {
          employee_id: emp.id,
          dpr_date: dprDate,
          status,
        },
      });
    }
  }

  console.log(`Seeded ${employees.length} employees with sample DPR entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
