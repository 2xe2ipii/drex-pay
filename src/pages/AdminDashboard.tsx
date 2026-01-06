import { Navbar } from "../components/layout/Navbar";
import { Container } from "../components/layout/Container";
import { PaymentTable } from "../components/dashboard/PaymentTable";
import { useTracker } from "../hooks/useTracker";
import { supabase } from "../lib/supabase";

export default function AdminDashboard() {
  const { services, payments, loading, refresh, currentPeriod } = useTracker();

  // The Manager Action: Mark as Paid/Unpaid
  const togglePayment = async (memberId: string, serviceId: string, currentStatus: boolean, amount: number) => {
    try {
      // Check if a payment record already exists
      const existingPayment = payments.find(p => p.memberId === memberId && p.serviceId === serviceId);

      if (existingPayment) {
        // Update existing
        await supabase
          .from("payments")
          .update({ is_paid: !currentStatus, paid_at: !currentStatus ? new Date() : null })
          .match({ member_id: memberId, service_id: serviceId, period_date: currentPeriod });
      } else {
        // Create new payment record (Marking as paid for the first time this month)
        await supabase
          .from("payments")
          .insert({
            member_id: memberId,
            service_id: serviceId,
            amount: amount,
            period_date: currentPeriod,
            is_paid: true,
            paid_at: new Date(),
            method: 'GCash' // Default to GCash
          });
      }
      
      // Refresh local state
      refresh();

    } catch (err) {
      console.error("Payment update failed", err);
      alert("Action failed. Check console.");
    }
  };

  if (loading) return <div className="p-10 text-white">Loading Manager Console...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      <Navbar />
      
      <Container className="py-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Manager Console</h1>
            <p className="text-zinc-400">Manage payments for {currentPeriod}</p>
          </div>
        </div>

        {services.map(service => (
          <PaymentTable 
            key={service.id} 
            service={service} 
            payments={payments}
            // Pass the action down to the table
            onTogglePayment={(memberId, amount) => 
              togglePayment(memberId, service.id, false, amount)
            }
          />
        ))}
      </Container>
    </div>
  );
}