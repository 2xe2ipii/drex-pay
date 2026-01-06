import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { addMonths, format, isAfter, setDate } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPeso = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// --- BILLING LOGIC ---

export interface BillingCycle {
  start: Date;
  end: Date;
  dueDate: Date;
  isOverdue: boolean;
  label: string;
}

// Fixed start date: December 2025
const START_DATE = new Date(2025, 11, 1); // Month is 0-indexed (11 = Dec)

export function getMonthOptions() {
  const options = [];
  // Generate options for 12 months starting from Dec 2025
  for (let i = 0; i < 12; i++) {
    const date = addMonths(START_DATE, i);
    options.push({
      value: format(date, "yyyy-MM-dd"),
      label: `${format(date, "MMM")} - ${format(addMonths(date, 1), "MMM yyyy")}` 
    });
  }
  return options;
}

export function getBillingCycle(billingDay: number, referenceDateStr: string): BillingCycle {
  const selectedMonthStart = new Date(referenceDateStr);
  
  const start = setDate(selectedMonthStart, billingDay);
  const end = addMonths(start, 1);
  const dueDate = start; 
  const isOverdue = isAfter(new Date(), dueDate);

  return {
    start,
    end,
    dueDate,
    isOverdue,
    label: `${format(start, "MMM d")} - ${format(end, "MMM d")}`
  };
}