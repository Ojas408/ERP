
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const user = await prisma.user.create({
      data: {
        email: 'test_reg123@test.com',
        password: 'hashedpassword',
        name: 'test',
        role: 'admin',
        tenant: {
          create: {
            name: 'test tenant',
          }
        }
      },
      include: { tenant: true }
    });
    console.log('Success:', user);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();

