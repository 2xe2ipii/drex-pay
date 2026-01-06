// import { useState } from "react";
import { Navbar } from "../components/layout/Navbar";
import { Container } from "../components/layout/Container";
import { useTracker } from "../hooks/useTracker";
import { supabase } from "../lib/supabase";
import { formatPeso, getBillingCycle } from "../lib/utils";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function AdminDashboard() {
  const { services, payments, refresh } = useTracker();

  // --- ACTIONS ---
  const confirmPayment = async (paymentId: string) => {
    await supabase.from("payments").update({ status: 'paid', paid_at: new Date() }).eq('id', paymentId);
    refresh();
  };

  // --- ANALYTICS PREP ---
  // 1. Calculate Revenue
  const totalProjected = services.reduce((acc, s) => acc + (s.members.length * (s.fixedPrice || 0)), 0);
  const totalCollected = payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amountDue, 0);
  
  // 2. Chart Data: Payments by Method
  const methodData = [
    { name: 'GCash', value: payments.filter(p => p.method === 'GCash' && p.status === 'paid').length },
    { name: 'Bank', value: payments.filter(p => p.method === 'Bank' && p.status === 'paid').length },
    { name: 'Cash', value: payments.filter(p => p.method === 'Cash' && p.status === 'paid').length },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 font-sans">
      <Navbar />
      
      <Container className="py-8 space-y-8">
        {/* TOP ROW: HIGH LEVEL METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-lg">
            <h3 className="text-zinc-500 text-xs uppercase tracking-widest font-semibold">Collection Rate</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {Math.round((totalCollected / totalProjected) * 100) || 0}%
              </span>
              <span className="text-sm text-zinc-400">of {formatPeso(totalProjected)}</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-zinc-800 h-1 mt-4 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full" 
                style={{ width: `${(totalCollected / totalProjected) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-lg">
            <h3 className="text-zinc-500 text-xs uppercase tracking-widest font-semibold">Pending Review</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold text-amber-500">
                {payments.filter(p => p.status === 'pending').length}
              </span>
              <span className="text-sm text-zinc-400 ml-2">requests</span>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-lg">
            <h3 className="text-zinc-500 text-xs uppercase tracking-widest font-semibold">Payment Methods</h3>
            <div className="h-16 mt-2">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={methodData}>
                   <XAxis dataKey="name" hide />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                     itemStyle={{ color: '#fff' }}
                   />
                   <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      <Cell fill="#10b981" /> {/* GCash */}
                      <Cell fill="#6366f1" /> {/* Bank */}
                      <Cell fill="#f59e0b" /> {/* Cash */}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* MAIN DATA TABLE */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
            <h2 className="font-semibold text-lg">Live Status Tracking</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-950 text-zinc-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Member</th>
                  <th className="px-6 py-3">Service</th>
                  <th className="px-6 py-3">Cycle</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {services.map(service => {
                  const cycle = getBillingCycle(service.billingDay);
                  
                  return service.members.map(member => {
                    // Find status for THIS member and THIS service
                    // Note: In a real app, you'd match strict dates. For now, we use the "current" logic.
                    const payment = payments.find(p => p.memberId === member.id && p.serviceId === service.id);
                    const status = payment?.status || 'unpaid';

                    return (
                      <tr key={`${service.id}-${member.id}`} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{member.name}</td>
                        <td className="px-6 py-4 text-zinc-400">{service.name}</td>
                        <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                          {cycle.label}
                        </td>
                        <td className="px-6 py-4 font-mono text-zinc-300">
                          {formatPeso(service.fixedPrice || 0)}
                        </td>
                        <td className="px-6 py-4">
                          {status === 'paid' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle size={12} /> Paid
                            </span>
                          )}
                          {status === 'pending' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                              <Clock size={12} /> Review
                            </span>
                          )}
                          {status === 'unpaid' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                              <AlertTriangle size={12} /> Due
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {status === 'pending' && (
                             <button 
                               onClick={() => confirmPayment(payment!.id!)} // ! asserts it exists if pending
                               className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded transition-colors"
                             >
                               Confirm
                             </button>
                          )}
                          {status === 'unpaid' && (
                            <button className="text-xs text-zinc-500 hover:text-white transition-colors">
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Container>
    </div>
  );
}