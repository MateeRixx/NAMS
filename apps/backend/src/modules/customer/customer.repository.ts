import prisma from '@newsflow/database';
import type {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryParams,
  CreateAddressDto,
  UpdateAddressDto,
} from './customer.types.js';

export async function createCustomer(
  data: CreateCustomerDto & { agencyId: string; customerCode: string }
) {
  return prisma.customer.create({ data: data as never });
}

export async function findCustomerById(id: string, agencyId: string) {
  return prisma.customer.findFirst({
    where: { id, agencyId, deletedAt: null },
  });
}

export async function findCustomerByPhone(phone: string, agencyId: string) {
  return prisma.customer.findFirst({
    where: { phone, agencyId, deletedAt: null },
  });
}

export async function findCustomerByEmail(email: string, agencyId: string) {
  return prisma.customer.findFirst({
    where: { email, agencyId, deletedAt: null },
  });
}

export async function findCustomerByCode(customerCode: string, agencyId: string) {
  return prisma.customer.findFirst({
    where: { customerCode, agencyId, deletedAt: null },
  });
}

export async function updateCustomer(id: string, agencyId: string, data: UpdateCustomerDto) {
  return prisma.customer.update({
    where: { id },
    data: data as never,
  });
}

export async function softDeleteCustomer(id: string, agencyId: string, deletedBy: string) {
  return prisma.customer.update({
    where: { id },
    data: { deletedAt: new Date(), deletedBy },
  });
}

export async function listCustomers(params: CustomerQueryParams & { agencyId: string }) {
  const search = params.search ?? undefined;
  const status = params.status ?? undefined;
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const { agencyId } = params;

  const where: Record<string, unknown> = { agencyId, deletedAt: null };

  if (status) {
    where['status'] = status;
  }

  if (search) {
    where['OR'] = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
      { customerCode: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where: where as never,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where: where as never }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createAddress(
  data: CreateAddressDto & { agencyId: string; customerId: string }
) {
  return prisma.address.create({ data: data as never });
}

export async function findAddressById(id: string, agencyId: string) {
  return prisma.address.findFirst({
    where: { id, agencyId },
  });
}

export async function listAddressesByCustomer(customerId: string, agencyId: string) {
  return prisma.address.findMany({
    where: { customerId, agencyId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateAddress(id: string, _agencyId: string, data: UpdateAddressDto) {
  return prisma.address.update({
    where: { id },
    data: data as never,
  });
}

export async function deleteAddress(id: string, _agencyId: string) {
  return prisma.address.delete({
    where: { id },
  });
}

export async function unsetPrimaryAddresses(customerId: string, agencyId: string) {
  return prisma.address.updateMany({
    where: { customerId, agencyId, isPrimary: true },
    data: { isPrimary: false },
  });
}

export async function getNextCustomerCode(agencyId: string): Promise<string> {
  const lastCustomer = await prisma.customer.findFirst({
    where: { agencyId },
    orderBy: { customerCode: 'desc' },
    select: { customerCode: true },
  });

  if (!lastCustomer) {
    return 'CUST-0001';
  }

  const num = parseInt(lastCustomer.customerCode.replace('CUST-', ''), 10);
  return `CUST-${String(num + 1).padStart(4, '0')}`;
}
