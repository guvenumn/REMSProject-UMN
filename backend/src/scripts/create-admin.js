// Path: /var/www/rems/backend/scripts/create-admin.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const readline = require("readline");

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function createSuperAdmin() {
  try {
    console.log("Creating Super Admin Account");

    // Prompt for admin details
    const email = await askQuestion("Enter email: ");
    const name = await askQuestion("Enter name: ");
    const password = await askQuestion("Enter password: ");

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "ADMIN",
        phone: (await askQuestion("Enter phone (optional): ")) || null,
      },
    });

    console.log(`Admin created successfully: ${admin.name} (${admin.email})`);
  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

createSuperAdmin();
