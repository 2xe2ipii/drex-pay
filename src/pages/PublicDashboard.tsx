import { useState } from "react";
import { useTracker } from "../hooks/useTracker";
import { formatPeso, getBillingCycle } from "../lib/utils";
import { supabase } from "../lib/supabase";
import { CheckCircle2, Send } from "lucide-react";

export default function PublicDashboard() {
  const { services, payments, refresh } = useTracker();
  const [reportingId, setReportingId] = useState<string | null>(null);

  const handleReportPayment = async (memberId: string, serviceId: string, amount: number, cycleDate: Date) => {
    // 1. Create a "Pending" record
    const { error } = await supabase.from("payments").insert({
      member_id: memberId,
      service_id: serviceId,
      amount: amount,
      period_date: cycleDate,
      status: 'pending',
      method: 'GCash', // Default for now to save clicks
      is_paid: false 
    });

    if (!error) {
      setReportingId(null);
      refresh();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20">
      <header className="mb-8 pt-8">
        <h1 className="text-2xl font-bold text-white">DrexPay Portal</h1>
        <p className="text-zinc-500 text-sm">Check your status. Report your payments.</p>
      </header>

      <div className="space-y-6">
        {services.map(service => {
           const cycle = getBillingCycle(service.billingDay);
           
           return (
             <div key={service.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
                  <h3 className="font-semibold text-zinc-200">{service.name}</h3>
                  <span className="text-xs font-mono text-zinc-500">{cycle.label}</span>
                </div>
                
                <div className="divide-y divide-zinc-800">
                  {service.members.map(member => {
                    const payment = payments.find(p => p.memberId === member.id && p.serviceId === service.id);
                    const status = payment?.status || 'unpaid';

                    return (
                      <div key={member.id} className="px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                            {member.avatar || member.name.substring(0,2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{member.name}</p>
                            <p className="text-xs text-zinc-500">
                              {status === 'paid' ? 'Access Granted' : `Due: ${formatPeso(service.fixedPrice || 0)}`}
                            </p>
                          </div>
                        </div>

                        <div>
                          {status === 'paid' ? (
                            <CheckCircle2 className="text-emerald-500" size={20} />
                          ) : status === 'pending' ? (
                            <span className="text-xs text-amber-500 font-medium">Under Review</span>
                          ) : (
                            <button 
                              onClick={() => handleReportPayment(member.id, service.id, service.fixedPrice || 0, cycle.start)}
                              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-full transition-colors border border-zinc-700"
                            >
                              <Send size={12} />
                              I Paid This
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>
           );
        })}
      </div>
    </div>
  );
}