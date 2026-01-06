export interface Member {
  id: string;
  name: string;
  avatar_initials: string;
}

export interface Service {
  id: string;
  name: string;
  totalCost: number;
  fixedPrice: number;
  maxSlots: number;
  billingDay: number;
  members: {
    id: string;
    name: string;
    avatar: string;
  }[];
}

export interface PaymentStatus {
  id: string;
  memberId: string;
  serviceId: string;
  amountDue: number;
  isPaid: boolean;
  status: 'paid' | 'unpaid' | 'pending';
  paidDate?: string | null;
  periodDate?: string; // Fixed: Added this field
  method?: string;
}