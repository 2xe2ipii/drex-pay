import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { addMonths, format, isAfter, setDate, startOfDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPeso = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

// --- NEW LOGIC START ---

export interface BillingCycle {
  start: Date;
  end: Date;
  isOverdue: boolean;
  label: string; // "Jan 9 - Feb 9"
}

export function getBillingCycle(billingDay: number): BillingCycle {
  const today = startOfDay(new Date());
  const currentMonthCycleStart = setDate(today, billingDay);
  
  let start: Date;
  
  // If today is BEFORE the billing day (e.g., Today Jan 5, Billing Jan 9),
  // then we are technically in the "Dec 9 - Jan 9" cycle.
  // BUT, usually you want to see the UPCOMING payment if it's close.
  // Let's stick to: "What is the cycle that covers TODAY?"
  
  if (today.getDate() < billingDay) {
    // We are in the previous month's cycle
    start = setDate(addMonths(today, -1), billingDay);
  } else {
    // We are in the current month's cycle
    start = currentMonthCycleStart;
  }

  const end = addMonths(start, 1);
  
  // Overdue logic: If we are past the start date + grace period (e.g. 1 day), it's overdue
  const isOverdue = isAfter(today, start);

  return {
    start,
    end,
    isOverdue,
    label: `${format(start, "MMM d")} - ${format(end, "MMM d")}`
  };
}
// --- NEW LOGIC END ---