import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const [tenants, users, sites, productions, inventories, materialInwards, scraps, overheads, challans, vehicles] = await Promise.all([
  prisma.tenant.findMany({ select: { id: true, name: true, subscriptionPlan: true, status: true } }),
  prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } }),
  prisma.site.findMany({ select: { id: true, name: true, location: true, status: true } }),
  prisma.production.count(),
  prisma.inventory.count(),
  prisma.materialInward.count(),
  prisma.scrap.count(),
  prisma.overheadEntry.count(),
  prisma.challan.count(),
  prisma.vehicle.count(),
]);

console.log(JSON.stringify({
  tables: {
    tenantsCount: tenants.length,
    usersCount: users.length,
    sitesCount: sites.length,
    productions,
    inventories,
    materialInwards,
    scraps,
    overheads,
    challans,
    vehicles,
  },
  tenants,
  users,
  sites,
}, null, 2));

await prisma.$disconnect();

