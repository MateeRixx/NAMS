export interface ZoneQuantity {
  deliveryZoneId: string;
  quantity: number;
}

export interface CreateDistributionRequestDto {
  customerId: string;
  title: string;
  description?: string;
  requestedQuantity: number;
  zones?: ZoneQuantity[];
}

export interface UpdateDistributionRequestDto {
  quotedPrice?: number;
  status?: 'QUOTED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface DistributionRequestResponse {
  id: string;
  agencyId: string;
  customerId: string;
  title: string;
  description: string | null;
  requestedQuantity: number;
  quotedPrice: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  zones?: { id: string; deliveryZoneId: string; deliveryZone: { id: string; name: string }; quantity: number }[];
}

export interface CreateArticleRequestDto {
  customerId: string;
  productId?: string;
  title: string;
  content: string;
  publishInDate?: string;
}

export interface UpdateArticleRequestDto {
  status?: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  reviewNotes?: string;
}

export interface ArticleRequestResponse {
  id: string;
  agencyId: string;
  customerId: string;
  productId: string | null;
  title: string;
  content: string;
  status: string;
  publishInDate: Date | null;
  reviewNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  product?: { name: string } | null;
}
