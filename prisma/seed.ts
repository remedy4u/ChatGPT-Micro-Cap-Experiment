import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-repair' },
    update: {},
    create: { slug: 'demo-repair', name: 'Demo Repair Tenant' }
  });

  await prisma.quoteRule.createMany({
    data: [
      { tenantId: tenant.id, applianceType: 'washing_machine', symptomCluster: 'not_spinning', baseLow: 120, baseHigh: 260, confidence: 0.78 },
      { tenantId: tenant.id, applianceType: 'refrigerator', symptomCluster: 'not_cooling', baseLow: 180, baseHigh: 420, confidence: 0.68 }
    ],
    skipDuplicates: true
  });

  await prisma.partPrice.createMany({
    data: [
      { tenantId: tenant.id, partName: 'Drain Pump', applianceType: 'washing_machine', price: 85 },
      { tenantId: tenant.id, partName: 'Compressor Relay', applianceType: 'refrigerator', price: 140 }
    ],
    skipDuplicates: true
  });

  console.log('Seed complete');
}

main().finally(async () => prisma.$disconnect());
