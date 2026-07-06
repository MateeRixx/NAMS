import { NotFoundError, ConflictError } from '@newsflow/shared';
import prisma from '@newsflow/database';
import * as customerRepository from './customer.repository.js';
import { logAudit } from '../../services/audit.service.js';
import type {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponse,
  CustomerQueryParams,
  PaginatedResponse,
  CreateAddressDto,
  UpdateAddressDto,
  AddressResponse,
} from './customer.types.js';

function toCustomerResponse(customer: {
  id: string;
  agencyId: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): CustomerResponse {
  return {
    id: customer.id,
    agencyId: customer.agencyId,
    customerCode: customer.customerCode,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    email: customer.email,
    status: customer.status,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

function toAddressResponse(address: {
  id: string;
  agencyId: string;
  customerId: string;
  zoneId: string | null;
  houseNumber: string;
  street: string;
  landmark: string | null;
  area: string;
  city: string;
  state: string;
  postalCode: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AddressResponse {
  return {
    id: address.id,
    agencyId: address.agencyId,
    customerId: address.customerId,
    zoneId: address.zoneId,
    houseNumber: address.houseNumber,
    street: address.street,
    landmark: address.landmark,
    area: address.area,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    isPrimary: address.isPrimary,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}

export async function createCustomer(
  dto: CreateCustomerDto,
  agencyId: string
): Promise<CustomerResponse> {
  const existingPhone = await customerRepository.findCustomerByPhone(dto.phone, agencyId);
  if (existingPhone) {
    throw new ConflictError('Customer with this phone already exists');
  }

  const customerCode = dto.customerCode ?? (await customerRepository.getNextCustomerCode(agencyId));

  const customer = await customerRepository.createCustomer({
    ...dto,
    agencyId,
    customerCode,
  });
  return toCustomerResponse(customer);
}

export async function getCustomer(id: string, agencyId: string): Promise<CustomerResponse> {
  const customer = await customerRepository.findCustomerById(id, agencyId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }
  return toCustomerResponse(customer);
}

export async function updateCustomer(
  id: string,
  dto: UpdateCustomerDto,
  agencyId: string
): Promise<CustomerResponse> {
  const customer = await customerRepository.findCustomerById(id, agencyId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  if (dto.phone && dto.phone !== customer.phone) {
    const existingPhone = await customerRepository.findCustomerByPhone(dto.phone, agencyId);
    if (existingPhone) {
      throw new ConflictError('Customer with this phone already exists');
    }
  }

  const updated = await customerRepository.updateCustomer(id, agencyId, dto);
  return toCustomerResponse(updated);
}

export async function deleteCustomer(
  id: string,
  agencyId: string,
  deletedBy: string
): Promise<void> {
  const customer = await customerRepository.findCustomerById(id, agencyId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  await customerRepository.softDeleteCustomer(id, agencyId, deletedBy);

  logAudit({
    agencyId,
    userId: deletedBy,
    entityType: 'Customer',
    entityId: id,
    action: 'CUSTOMER_DELETED',
    oldValue: { firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone },
  });
}

export async function listCustomers(
  params: CustomerQueryParams,
  agencyId: string
): Promise<PaginatedResponse<CustomerResponse>> {
  const result = await customerRepository.listCustomers({ ...params, agencyId });
  return {
    ...result,
    items: result.items.map(toCustomerResponse),
  };
}

export async function getDeliverySheet(agencyId: string): Promise<{
  zones: {
    id: string;
    name: string;
    customers: {
      name: string;
      phone: string | null;
      address: string;
      area: string;
      postalCode: string;
    }[];
  }[];
  unzoned: {
    name: string;
    phone: string | null;
    address: string;
    area: string;
    postalCode: string;
  }[];
  generatedAt: string;
}> {
  const customers = await prisma.customer.findMany({
    where: { agencyId, deletedAt: null, status: 'ACTIVE' },
    include: {
      addresses: {
        where: { isPrimary: true },
        include: { deliveryZone: { select: { id: true, name: true } } },
      },
    },
    orderBy: { firstName: 'asc' },
  });

  const zoneMap = new Map<
    string,
    {
      id: string;
      name: string;
      customers: {
        name: string;
        phone: string;
        address: string;
        area: string;
        postalCode: string;
      }[];
    }
  >();
  const unzoned: {
    name: string;
    phone: string | null;
    address: string;
    area: string;
    postalCode: string;
  }[] = [];

  for (const c of customers) {
    const entry = {
      name: `${c.firstName} ${c.lastName}`.trim(),
      phone: c.phone ?? '',
      address: '',
      area: '',
      postalCode: '',
    };

    const primaryAddr = c.addresses[0];
    if (primaryAddr) {
      entry.address = [primaryAddr.houseNumber, primaryAddr.street, primaryAddr.landmark]
        .filter(Boolean)
        .join(', ');
      entry.area = primaryAddr.area;
      entry.postalCode = primaryAddr.postalCode;

      if (primaryAddr.deliveryZone) {
        const zoneId = primaryAddr.deliveryZone.id;
        if (!zoneMap.has(zoneId)) {
          zoneMap.set(zoneId, { id: zoneId, name: primaryAddr.deliveryZone.name, customers: [] });
        }
        zoneMap.get(zoneId)!.customers.push(entry);
      } else {
        unzoned.push(entry);
      }
    } else {
      unzoned.push(entry);
    }
  }

  const zones = Array.from(zoneMap.values());

  return { zones, unzoned, generatedAt: new Date().toISOString() };
}

export async function createAddress(
  customerId: string,
  dto: CreateAddressDto,
  agencyId: string
): Promise<AddressResponse> {
  const customer = await customerRepository.findCustomerById(customerId, agencyId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  if (dto.isPrimary) {
    await customerRepository.unsetPrimaryAddresses(customerId, agencyId);
  }

  const address = await customerRepository.createAddress({
    ...dto,
    agencyId,
    customerId,
  });
  return toAddressResponse(address);
}

export async function listAddresses(
  customerId: string,
  agencyId: string
): Promise<AddressResponse[]> {
  const customer = await customerRepository.findCustomerById(customerId, agencyId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  const addresses = await customerRepository.listAddressesByCustomer(customerId, agencyId);
  return addresses.map(toAddressResponse);
}

export async function updateAddress(
  customerId: string,
  addressId: string,
  dto: UpdateAddressDto,
  agencyId: string
): Promise<AddressResponse> {
  const customer = await customerRepository.findCustomerById(customerId, agencyId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  const address = await customerRepository.findAddressById(addressId, agencyId);
  if (!address) {
    throw new NotFoundError('Address');
  }

  if (dto.isPrimary) {
    await customerRepository.unsetPrimaryAddresses(customerId, agencyId);
  }

  const updated = await customerRepository.updateAddress(addressId, agencyId, dto);
  return toAddressResponse(updated);
}

export async function deleteAddress(
  customerId: string,
  addressId: string,
  agencyId: string
): Promise<void> {
  const customer = await customerRepository.findCustomerById(customerId, agencyId);
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  const address = await customerRepository.findAddressById(addressId, agencyId);
  if (!address) {
    throw new NotFoundError('Address');
  }

  await customerRepository.deleteAddress(addressId, agencyId);
}
