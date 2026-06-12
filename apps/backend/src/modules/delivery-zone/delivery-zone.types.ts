export interface CreateDeliveryZoneDto {
  name: string;
  description?: string;
  monthlyCharge: number;
}

export interface UpdateDeliveryZoneDto {
  name?: string;
  description?: string;
  monthlyCharge?: number;
}

export interface DeliveryZoneResponse {
  id: string;
  agencyId: string;
  name: string;
  description: string | null;
  monthlyCharge: number;
  createdAt: Date;
  updatedAt: Date;
}
