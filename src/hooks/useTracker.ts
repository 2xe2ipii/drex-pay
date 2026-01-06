import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Service, PaymentStatus } from "../types";
import { startOfMonth, format } from "date-fns";

export function useTracker() {
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<PaymentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // We are currently using "2026-01-01" style logic for "current period"
  // Even though your billing cycle is dynamic (Jan 9 - Feb 9), for database storage 
  // we still tag payments to a specific "Billing Month Start" so we don't get duplicates.
  const currentPeriod = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select(`
          *,
          subscriptions (
            member:members (*)
          )
        `);

      if (servicesError) throw servicesError;

      const formattedServices: Service[] = servicesData.map((s: any) => ({
        id: s.id,
        name: s.name,
        totalCost: s.total_cost,
        fixedPrice: s.fixed_price, // <--- Mapping the new column
        maxSlots: s.max_slots,
        billingDay: s.billing_day,
        members: s.subscriptions.map((sub: any) => ({
          id: sub.member.id,
          name: sub.member.name,
          avatar: sub.member.avatar_initials,
        })),
      }));

      setServices(formattedServices);

      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("period_date", currentPeriod);

      if (paymentsError) throw paymentsError;

      const formattedPayments: PaymentStatus[] = paymentsData.map((p: any) => ({
        id: p.id, // <--- Mapping the ID
        memberId: p.member_id,
        serviceId: p.service_id,
        amountDue: p.amount,
        isPaid: p.is_paid,
        status: p.status || (p.is_paid ? 'paid' : 'unpaid'), // <--- Mapping the status
        paidDate: p.paid_at,
        method: p.method
      }));

      setPayments(formattedPayments);

    } catch (error) {
      console.error("Error fetching tracker data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const subscription = supabase
      .channel('public:payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { services, payments, loading, refresh: fetchData, currentPeriod };
}