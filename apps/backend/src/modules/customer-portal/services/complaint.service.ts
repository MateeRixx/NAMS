import { NotFoundError } from '@newsflow/shared';
import prisma from '@newsflow/database';
import { createAndQueueNotification } from '../../../services/notification.service.js';
import { getNextComplaintNumber } from '../../complaint/complaint.repository.js';

export async function listComplaints(
  customerId: string,
  agencyId: string
): Promise<
  {
    id: string;
    type: string;
    description: string | null;
    status: string;
    createdAt: Date;
    resolvedAt: Date | null;
  }[]
> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  const complaints = await prisma.complaint.findMany({
    where: { customerId, agencyId },
    orderBy: { createdAt: 'desc' },
  });

  return complaints.map((c) => ({
    id: c.id,
    type: c.type,
    description: c.description,
    status: c.status,
    createdAt: c.createdAt,
    resolvedAt: c.resolvedAt,
  }));
}

export async function createComplaint(
  customerId: string,
  agencyId: string,
  data: { type: string; description?: string }
): Promise<{ id: string; type: string; status: string }> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, agencyId, deletedAt: null },
  });
  if (!customer) throw new NotFoundError('Customer');

  const complaintNumber = await getNextComplaintNumber(agencyId);

  const complaint = await prisma.complaint.create({
    data: {
      agencyId,
      customerId,
      complaintNumber,
      type: data.type as never,
      description: data.description ?? null,
      status: 'PENDING',
    },
  });

  await prisma.complaintHistory.create({
    data: {
      agencyId,
      complaintId: complaint.id,
      action: 'CREATED',
      performedBy: customerId,
    },
  });

  if (customer.email) {
    createAndQueueNotification({
      agencyId,
      customerId,
      type: 'COMPLAINT_CREATED',
      channel: 'EMAIL',
      title: 'Complaint Registered',
      message: `Your complaint (${data.type}) has been registered.`,
      emailTo: customer.email,
      emailSubject: `Complaint Registered - ${data.type}`,
      templateData: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        complaintType: data.type,
      },
    }).catch(() => {});
  }

  return { id: complaint.id, type: complaint.type, status: complaint.status };
}
