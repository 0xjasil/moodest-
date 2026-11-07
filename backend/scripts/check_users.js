const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_35uLPtbZrDnw@ep-proud-voice-b85vkqhq-pooler.c-14.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
    }
  }
});

async function check() {
  const users = await prisma.user.findMany();
  console.log('Total users in DB:', users.length);
  for (const u of users) {
    const isDefaultMatch = await bcrypt.compare('MoodestAdminSecurePassword2026!', u.passwordHash);
    console.log(JSON.stringify({
      id: u.id,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      passwordMatchesDefault: isDefaultMatch
    }));
  }
}

check()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    return prisma.$disconnect();
  });

