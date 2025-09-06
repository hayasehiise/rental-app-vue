import { PrismaClient, Role } from "@prisma/client";
import type { RentalType } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.info("Start Seeding Data");
  const users = [
    {
      name: "Super Admin",
      email: "super@admin.com",
      password: "superadmin",
      role: Role.SUPER_ADMIN,
    },
    {
      name: "Staff Admin",
      email: "staff@admin.com",
      password: "staffadmin",
      role: Role.STAFF_ADMIN,
    },
    {
      name: "Finance Admin",
      email: "finance@admin.com",
      password: "financeadmin",
      role: Role.FINANCE_ADMIN,
    },
    {
      name: "Member User",
      email: "member@gmail.com",
      password: "membertest",
      role: Role.MEMBER,
    },
    {
      name: "Guest User",
      email: "guest@gmail.com",
      password: "guesttest",
      role: Role.GUEST,
    },
  ];
  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);

    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        password: hashed,
        role: u.role,
      },
    });
  }

  console.info("Seed Admin Sudah Selesai");

  const types: RentalType[] = ["LAPANGAN", "GEDUNG", "KENDARAAN"];

  for (let i = 1; i <= 50; i++) {
    await prisma.rental.create({
      data: {
        name: `Rental ${i}`,
        type: types[i % types.length],
        description: `ini deskripsi untuk Rental ${i}`,
      },
    });
  }

  console.info("Data Rental Selesai di seed");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
