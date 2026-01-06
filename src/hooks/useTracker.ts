import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Service, PaymentStatus } from "../types";

export function useTracker() {
  const [services, setServices] = useState<Service[]>([]);
  const [allPayments, setAllPayments] = useState<PaymentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch Services & Members
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
        fixedPrice: s.fixed_price,
        maxSlots: s.max_slots,
        billingDay: s.billing_day,
        members: s.subscriptions.map((sub: any) => ({
          id: sub.member.id,
          name: sub.member.name,
          avatar: sub.member.avatar_initials,
        })),
      }));

      setServices(formattedServices);

      // 2. Fetch ALL Payments (for global analytics)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .order('paid_at', { ascending: false }); // Latest first for history

      if (paymentsError) throw paymentsError;

      const formattedPayments: PaymentStatus[] = paymentsData.map((p: any) => ({
        id: p.id,
        memberId: p.member_id,
        serviceId: p.service_id,
        amountDue: p.amount,
        isPaid: p.is_paid,
        status: p.status || (p.is_paid ? 'paid' : 'unpaid'),
        paidDate: p.paid_at,
        periodDate: p.period_date, // Important for filtering later
        method: p.method
      }));

      setAllPayments(formattedPayments);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Member Management ---
  const addMember = async (name: string, serviceId: string) => {
    // 1. Create Member
    const { data: member, error: mError } = await supabase
      .from('members')
      .insert({ name, avatar_initials: name.substring(0, 2).toUpperCase() })
      .select()
      .single();
      
    if (mError) throw mError;

    // 2. Subscribe to Service
    const { error: sError } = await supabase
      .from('subscriptions')
      .insert({ member_id: member.id, service_id: serviceId });

    if (sError) throw sError;
    
    fetchData();
  };

  const removeMember = async (memberId: string) => {
    // Cascade delete handles subscriptions usually, but let's be safe
    await supabase.from('members').delete().eq('id', memberId);
    fetchData();
  };

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('any').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchData]);

  return { services, allPayments, loading, refresh: fetchData, addMember, removeMember };
}