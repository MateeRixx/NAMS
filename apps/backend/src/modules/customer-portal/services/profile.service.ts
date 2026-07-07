import { NotFoundError } from '@newsflow/shared';
import prisma from '@newsflow/database';

export async function getProfile(
  customerId: string,
  agencyId: string
): Promise<{
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
}> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  return {
    id: customer.id,
    customerCode: customer.customerCode,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    email: customer.email,
  };
}

export async function getOnboardingStatus(
  customerId: string,
  agencyId: string
): Promise<{ completed: boolean }> {
  const address = await prisma.address.findFirst({
    where: { customerId, agencyId, isPrimary: true },
  });
  return { completed: !!address };
}

export async function listAddresses(
  customerId: string,
  agencyId: string
): Promise<
  {
    id: string;
    houseNumber: string;
    street: string;
    landmark: string | null;
    area: string;
    city: string;
    state: string;
    postalCode: string;
    isPrimary: boolean;
    zone: { id: string; name: string } | null;
  }[]
> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  const addresses = await prisma.address.findMany({
    where: { customerId, agencyId },
    include: { deliveryZone: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return addresses.map((a) => ({
    id: a.id,
    houseNumber: a.houseNumber,
    street: a.street,
    floor: a.floor,
    landmark: a.landmark,
    area: a.area,
    city: a.city,
    state: a.state,
    postalCode: a.postalCode,
    isPrimary: a.isPrimary,
    zone: a.deliveryZone ? { id: a.deliveryZone.id, name: a.deliveryZone.name } : null,
  }));
}

export async function createAddress(
  customerId: string,
  agencyId: string,
  data: {
    houseNumber: string;
    street: string;
    floor?: string;
    landmark?: string;
    area: string;
    city: string;
    state: string;
    postalCode: string;
    zoneId?: string;
    isPrimary?: boolean;
  }
): Promise<{ id: string }> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  const address = await prisma.address.create({
    data: {
      agencyId,
      customerId,
      houseNumber: data.houseNumber,
      street: data.street,
      floor: data.floor ?? null,
      landmark: data.landmark ?? null,
      area: data.area,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      zoneId: data.zoneId ?? null,
      isPrimary: data.isPrimary ?? false,
    },
  });

  if (data.isPrimary) {
    await prisma.address.updateMany({
      where: { customerId, id: { not: address.id } },
      data: { isPrimary: false },
    });
  }

  return { id: address.id };
}

export async function updateAddress(
  addressId: string,
  customerId: string,
  agencyId: string,
  data: {
    houseNumber?: string;
    street?: string;
    floor?: string | null;
    landmark?: string | null;
    area?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    zoneId?: string | null;
    isPrimary?: boolean;
  }
): Promise<{ id: string }> {
  const address = await prisma.address.findFirst({
    where: { id: addressId, customerId, agencyId },
  });
  if (!address) throw new NotFoundError('Address');

  await prisma.address.update({
    where: { id: addressId },
    data: {
      ...(data.houseNumber !== undefined && { houseNumber: data.houseNumber }),
      ...(data.street !== undefined && { street: data.street }),
      ...(data.floor !== undefined && { floor: data.floor }),
      ...(data.landmark !== undefined && { landmark: data.landmark }),
      ...(data.area !== undefined && { area: data.area }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.state !== undefined && { state: data.state }),
      ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
      ...(data.zoneId !== undefined && { zoneId: data.zoneId }),
      ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
    },
  });

  if (data.isPrimary) {
    await prisma.address.updateMany({
      where: { customerId, id: { not: addressId } },
      data: { isPrimary: false },
    });
  }

  return { id: addressId };
}

export async function deleteAddress(
  addressId: string,
  customerId: string,
  agencyId: string
): Promise<void> {
  const address = await prisma.address.findFirst({
    where: { id: addressId, customerId, agencyId },
  });
  if (!address) throw new NotFoundError('Address');

  await prisma.address.delete({ where: { id: addressId } });
}

export async function updateProfile(
  customerId: string,
  agencyId: string,
  data: { firstName?: string; lastName?: string; email?: string | null }
): Promise<{ id: string; firstName: string; lastName: string; email: string | null }> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.email !== undefined && { email: data.email }),
    },
  });

  return {
    id: updated.id,
    firstName: updated.firstName,
    lastName: updated.lastName,
    email: updated.email,
  };
}
