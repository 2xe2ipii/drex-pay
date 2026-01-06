export type ServiceType = 'Spotify' | 'Netflix';
export type PaymentStatusType = 'paid' | 'pending' | 'unpaid';

export interface Member {
  id: string;
  name: string;
  avatar?: string;
}

export interface Service {
  id: string;
  name: ServiceType;
  totalCost: number;
  fixedPrice?: number; // <--- ADDED THIS
  maxSlots: number;
  billingDay: number;
  members: Member[];
}

export interface PaymentStatus {
  id?: string; // <--- ADDED THIS (Need ID to update specific rows)
  memberId: string;
  serviceId: string;
  amountDue: number;
  isPaid: boolean;
  status: PaymentStatusType; // <--- ADDED THIS
  paidDate?: string;
  method?: 'GCash' | 'Cash' | 'Bank';
}