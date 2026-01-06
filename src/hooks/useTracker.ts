import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Service, PaymentStatus } from "../types";
import { startOfMonth, format } from "date-fns";

export function useTracker() {
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<PaymentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to get current month's identifier (e.g., "2026-01-01")
  const currentPeriod = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Services & Subscriptions (Who is in what service?)
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select(`
          *,
          subscriptions (
            member:members (*)
          )
        `);

      if (servicesError) throw servicesError;

      // 2. Transform Supabase data to our Types
      const formattedServices: Service[] = servicesData.map((s: any) => ({
        id: s.id,
        name: s.name,
        totalCost: s.total_cost,
        maxSlots: s.max_slots,
        billingDay: s.billing_day,
        // Flatten the nested subscription data
        members: s.subscriptions.map((sub: any) => ({
          id: sub.member.id,
          name: sub.member.name,
          avatar: sub.member.avatar_initials,
        })),
      }));

      setServices(formattedServices);

      // 3. Fetch Payments for THIS month
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("period_date", currentPeriod);

      if (paymentsError) throw paymentsError;

      // 4. Map payments to our type
      const formattedPayments: PaymentStatus[] = paymentsData.map((p: any) => ({
        memberId: p.member_id,
        serviceId: p.service_id,
        amountDue: p.amount,
        isPaid: p.is_paid,
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

  // Initial Fetch
  useEffect(() => {
    fetchData();
    
    // Optional: Realtime subscription to payment updates
    const subscription = supabase
      .channel('public:payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchData(); // Refresh data on change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { services, payments, loading, refresh: fetchData, currentPeriod };
}