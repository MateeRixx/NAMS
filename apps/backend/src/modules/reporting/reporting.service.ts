import prisma from '@newsflow/database';

export async function getDashboardStats(agencyId: string) {
  const [
    customers,
    activeCustomers,
    products,
    subscriptions,
    activeSubscriptions,
    pausedSubscriptions,
    complaints,
    pendingComplaints,
    invoices,
    paidInvoices,
    overdueInvoices,
    totalRevenue,
    outstandingAmount,
    deliveryZones,
    lastMonthCustomers,
  ] = await Promise.all([
    prisma.customer.count({ where: { agencyId, deletedAt: null } }),
    prisma.customer.count({ where: { agencyId, deletedAt: null, status: 'ACTIVE' } }),
    prisma.product.count({ where: { agencyId } }),
    prisma.subscription.count({ where: { agencyId } }),
    prisma.subscription.count({ where: { agencyId, status: 'ACTIVE' } }),
    prisma.subscription.count({ where: { agencyId, status: 'PAUSED' } }),
    prisma.complaint.count({ where: { agencyId } }),
    prisma.complaint.count({ where: { agencyId, status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
    prisma.invoice.count({ where: { agencyId } }),
    prisma.invoice.count({ where: { agencyId, status: 'PAID' } }),
    prisma.invoice.count({ where: { agencyId, status: 'OVERDUE' } }),
    prisma.invoice.aggregate({ where: { agencyId, status: 'PAID' }, _sum: { totalAmount: true } }),
    prisma.invoice.aggregate({
      where: { agencyId, status: { in: ['PENDING', 'OVERDUE'] } },
      _sum: { totalAmount: true },
    }),
    prisma.deliveryZone.count({ where: { agencyId } }),
    prisma.customer.count({
      where: {
        agencyId,
        deletedAt: null,
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1) },
      },
    }),
  ]);

  return {
    customers,
    activeCustomers,
    products,
    subscriptions,
    activeSubscriptions,
    pausedSubscriptions,
    complaints,
    pendingComplaints,
    invoices,
    paidInvoices,
    overdueInvoices,
    totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
    outstandingAmount: Number(outstandingAmount._sum.totalAmount ?? 0),
    deliveryZones,
    newCustomersThisMonth: lastMonthCustomers,
  };
}

export async function getRevenueReport(
  agencyId: string,
  filters: { year?: number; month?: number; productId?: string }
) {
  const where: Record<string, unknown> = { agencyId, status: { in: ['PAID', 'GENERATED', 'OVERDUE'] } };
  if (filters.year) where['billingYear'] = filters.year;
  if (filters.month) where['billingMonth'] = filters.month;

  const invoices = await prisma.invoice.findMany({
    where: where as never,
    orderBy: [{ billingYear: 'desc' }, { billingMonth: 'desc' }],
  });

  const byMonth: Record<string, { month: number; year: number; total: number; count: number; paid: number }> = {};
  for (const inv of invoices) {
    const key = `${inv.billingYear}-${String(inv.billingMonth).padStart(2, '0')}`;
    if (!byMonth[key]) {
      byMonth[key] = { month: inv.billingMonth, year: inv.billingYear, total: 0, count: 0, paid: 0 };
    }
    byMonth[key].total += Number(inv.totalAmount);
    byMonth[key].count += 1;
    if (inv.status === 'PAID') byMonth[key].paid += Number(inv.totalAmount);
  }

  const monthly = Object.values(byMonth).sort((a, b) =>
    a.year !== b.year ? b.year - a.year : b.month - a.month
  );

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  const totalPaid = invoices.filter((i) => i.status === 'PAID').reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  const outstandingInvoices = invoices.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE');
  const outstanding = outstandingInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

  return { totalRevenue, totalPaid, outstanding, totalInvoices: invoices.length, monthly };
}

export async function getProductReport(agencyId: string) {
  const products = await prisma.product.findMany({
    where: { agencyId },
    include: {
      subscriptions: {
        select: { id: true, status: true, startDate: true },
      },
    },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    basePrice: Number(p.basePrice),
    isActive: p.isActive,
    totalSubscribers: p.subscriptions.length,
    activeSubscribers: p.subscriptions.filter((s) => s.status === 'ACTIVE').length,
  }));
}

export async function getComplaintReport(agencyId: string) {
  const complaints = await prisma.complaint.findMany({
    where: { agencyId },
    orderBy: { createdAt: 'desc' },
  });

  const byType: Record<string, { type: string; count: number; resolved: number }> = {};
  const byStatus: Record<string, number> = {};
  let totalResolutionTime = 0;
  let resolvedCount = 0;

  for (const c of complaints) {
    if (!byType[c.type]) byType[c.type] = { type: c.type, count: 0, resolved: 0 };
    byType[c.type]!.count += 1;
    if (c.status === 'RESOLVED' || c.status === 'CLOSED') {
      byType[c.type]!.resolved += 1;
      if (c.resolvedAt) {
        totalResolutionTime += (c.resolvedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60);
        resolvedCount += 1;
      }
    }
    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
  }

  return {
    total: complaints.length,
    byType: Object.values(byType),
    byStatus,
    avgResolutionHours: resolvedCount > 0 ? Math.round(totalResolutionTime / resolvedCount) : 0,
  };
}

export async function getGrowthReport(agencyId: string) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const customers = await prisma.customer.findMany({
    where: { agencyId, deletedAt: null, createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const subscriptions = await prisma.subscription.findMany({
    where: { agencyId, createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  const monthly: Record<string, { month: string; newCustomers: number; newSubscriptions: number; cancelledSubscriptions: number }> = {};
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthly[key] = { month: key, newCustomers: 0, newSubscriptions: 0, cancelledSubscriptions: 0 };
  }

  for (const c of customers) {
    const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`;
    if (monthly[key]) monthly[key].newCustomers += 1;
  }

  for (const s of subscriptions) {
    const key = `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, '0')}`;
    if (monthly[key]) monthly[key].newSubscriptions += 1;
    if (s.status === 'CANCELLED' && s.createdAt) {
      const cancelKey = `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthly[cancelKey]) monthly[cancelKey].cancelledSubscriptions += 1;
    }
  }

  return Object.values(monthly).reverse();
}

export async function getCollectionReport(agencyId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { agencyId },
    orderBy: { generatedAt: 'desc' },
    include: { payments: true },
  });

  const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  const totalCollected = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

  const aging: Record<string, { count: number; amount: number }> = {
    '0-30': { count: 0, amount: 0 },
    '31-60': { count: 0, amount: 0 },
    '61-90': { count: 0, amount: 0 },
    '90+': { count: 0, amount: 0 },
  };

  const now = new Date();
  for (const inv of invoices) {
    if (inv.status === 'PENDING' || inv.status === 'OVERDUE') {
      const daysSinceGeneration = Math.floor(
        (now.getTime() - inv.generatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceGeneration <= 30) {
        aging['0-30']!.count += 1;
        aging['0-30']!.amount += Number(inv.totalAmount);
      } else if (daysSinceGeneration <= 60) {
        aging['31-60']!.count += 1;
        aging['31-60']!.amount += Number(inv.totalAmount);
      } else if (daysSinceGeneration <= 90) {
        aging['61-90']!.count += 1;
        aging['61-90']!.amount += Number(inv.totalAmount);
      } else {
        aging['90+']!.count += 1;
        aging['90+']!.amount += Number(inv.totalAmount);
      }
    }
  }

  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  return {
    totalBilled,
    totalCollected,
    outstanding: totalBilled - totalCollected,
    collectionRate,
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter((i) => i.status === 'PAID').length,
    pendingInvoices: invoices.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE').length,
    aging,
  };
}
