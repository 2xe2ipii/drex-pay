import { ServiceCard } from "../components/shared/ServiceCard";
import { useTracker } from "../hooks/useTracker";
import { format } from "date-fns";

export default function PublicDashboard() {
  const { services, payments, loading } = useTracker();
  const currentMonthName = format(new Date(), "MMMM yyyy");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-emerald-500">
        Loading DrexPay...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 pb-20">
      <div className="text-center space-y-2 mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          DrexPay
        </h1>
        <p className="text-zinc-500">Current Billing Cycle: {currentMonthName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map(service => (
          <ServiceCard 
            key={service.id} 
            service={service} 
            payments={payments} 
          />
        ))}
      </div>

      <div className="mt-12 p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 text-center">
        <p className="text-zinc-400 text-sm mb-2">Payment Details</p>
        <div className="text-xl font-mono text-emerald-400">GCash: 09XX-XXX-XXXX</div>
        <p className="text-xs text-zinc-500 mt-2">Please send screenshot after payment.</p>
      </div>
    </div>
  );
}