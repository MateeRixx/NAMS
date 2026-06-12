import prisma from '@newsflow/database';

export interface CreateUserData {
  email?: string;
  phone?: string;
  firebaseUid: string;
  firstName: string;
  lastName: string;
  role: string;
  agencyId: string;
}

export async function createUser(data: CreateUserData) {
  return prisma.user.create({ data: data as never });
}

export async function findUserByFirebaseUid(firebaseUid: string) {
  return prisma.user.findUnique({ where: { firebaseUid } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findFirst({ where: { email } });
}

export async function findUserByPhone(phone: string) {
  return prisma.user.findFirst({ where: { phone } });
}
