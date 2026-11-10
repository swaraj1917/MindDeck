
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: "demo@minddeck.local",
    },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@minddeck.local",
      password: "temporary-demo-password",
      settings: {
        create: {},
      },
    },
  });

  console.log("Demo user ready:", user.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
