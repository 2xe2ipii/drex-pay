export type ServiceType = 'Spotify' | 'Netflix';

export interface Member {
  id: string;
  name: string;
  avatar?: string; // Initials or image URL
}

export interface Service {
  id: string;
  name: ServiceType;
  totalCost: number;
  maxSlots: number;
  billingDay: number; // e.g., 15th of the month
  members: Member[]; // Who is currently subscribed
}

export interface PaymentStatus {
  memberId: string;
  serviceId: string;
  amountDue: number;
  isPaid: boolean;
  paidDate?: string;
  method?: 'GCash' | 'Cash' | 'Bank';
}