import { useState, useEffect, useMemo } from "react";
import { useTracker } from "../hooks/useTracker";
import { formatPeso, getBillingCycle, cn } from "../lib/utils";
import { supabase } from "../lib/supabase";
import { 
  Filter, Lock, Unlock, ChevronDown, CheckCircle2, 
  XCircle, AlertTriangle, Calendar, CreditCard, Info
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend 
} from 'recharts';
import { format } from "date-fns";

export default function Dashboard() {
  const { services, payments, refresh, loading } = useTracker();
  
  // --- STATE ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  
  // Filters
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<string>("all");
  
  // Cycle Logic (Simplistic: Current Month vs Previous)
  // In a real app, you'd fetch distinct dates from DB. 
  // For now, let's toggle between "Current Cycle" and "All Time"
  const [viewAllTime, setViewAllTime] = useState(false);

  // --- ADMIN ACTIONS ---
  const handleAdminLogin = () => {
    if (pinInput === import.meta.env.VITE_MANAGER_PIN) {
      setIsAdmin(true);
      setShowPinModal(false);
      setPinInput("");
    } else {
      alert("Wrong PIN");
    }
  };

  const updatePayment = async (
    paymentId: string | undefined, 
    memberId: string, 
    serviceId: string, 
    amount: number, 
    currentStatus: string
  ) => {
    if (!isAdmin) {
      setShowPinModal(true);
      return;
    }

    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    const method = newStatus === 'paid' ? 'GCash' : null; // Default to GCash on click
    const paidAt = newStatus === 'paid' ? new Date() : null;

    if (paymentId) {
      await supabase.from("payments").update({ 
        status: newStatus, 
        method, 
        paid_at: paidAt 
      }).eq('id', paymentId);
    } else {
      // Create new record
      await supabase.from("payments").insert({
        member_id: memberId,
        service_id: serviceId,
        amount: amount,
        status: newStatus,
        method,
        period_date: new Date(), // Defaults to today/current cycle
        paid_at: paidAt
      });
    }
    refresh();
  };

  // --- DATA PROCESSING ---
  // Flatten data for the Big Table
  const tableData = useMemo(() => {
    let rows: any[] = [];
    
    services.forEach(service => {
      if (selectedService !== "all" && service.id !== selectedService) return;
      const cycle = getBillingCycle(service.billingDay);

      service.members.forEach(member => {
        if (selectedMember !== "all" && member.id !== selectedMember) return;

        // Find payment
        const payment = payments.find(p => p.memberId === member.id && p.serviceId === service.id);
        const status = payment?.status || 'unpaid';
        
        // Calculate discrepancy
        const required = service.fixedPrice || 0;
        const paid = payment?.amountDue || 0;
        const diff = status === 'paid' ? paid - required : -required;

        rows.push({
          id: payment?.id,
          memberId: member.id,
          serviceId: service.id,
          memberName: member.name,
          serviceName: service.name,
          cycleLabel: cycle.label,
          requiredAmount: required,
          paidAmount: status === 'paid' ? paid : 0,
          diff,
          status,
          datePaid: payment?.paidDate ? format(new Date(payment.paidDate), "MMM d, h:mm a") : "-",
          method: payment?.method || "-",
        });
      });
    });
    return rows;
  }, [services, payments, selectedMember, selectedService]);

  // Debt Calculation
  const totalDebt = tableData
    .filter(r => r.status === 'unpaid')
    .reduce((acc, r) => acc + r.requiredAmount, 0);
  
  const debtors = [...new Set(tableData.filter(r => r.status === 'unpaid').map(r => r.memberName))];

  // Analytics Data
  const methodData = [
    { name: 'GCash', value: tableData.filter(r => r.method === 'GCash').length },
    { name: 'Bank', value: tableData.filter(r => r.method === 'Bank').length },
    { name: 'Cash', value: tableData.filter(r => r.method === 'Cash').length },
  ];

  if (loading) return <div className="p-10 text-emerald-500">Loading Matrix...</div>;

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans pb-20">
      
      {/* 1. HEADER & RULES */}
      <header className="bg-zinc-900/50 border-b border-zinc-800 p-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              DrexPay <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">v2.0</span>
            </h1>
            <div className="text-xs text-zinc-500 mt-1 flex gap-4">
              <span>Spotify: <strong className="text-emerald-500">₱46.50</strong></span>
              <span>Netflix: <strong className="text-red-500">₱125.00</strong></span>
            </div>
          </div>
          
          <button 
            onClick={() => isAdmin ? setIsAdmin(false) : setShowPinModal(true)}
            className={cn(
              "text-xs flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
              isAdmin 
                ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20" 
                : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700"
            )}
          >
            {isAdmin ? <Unlock size={12} /> : <Lock size={12} />}
            {isAdmin ? "Manager Active" : "View Only"}
          </button>
        </div>
        
        {/* Rules Accordion (Simplified) */}
        <div className="max-w-7xl mx-auto mt-4 text-xs text-zinc-500 border-l-2 border-zinc-700 pl-3">
          <p>• Payment due 3 days before cycle end.</p>
          <p>• Unpaid members will be removed from Family Plan immediately.</p>
          <p>• Keep receipts until status is updated in table.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-8">
        
        {/* 2. DEBT OVERVIEW */}
        {debtors.length > 0 ? (
          <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-500/20 p-2 rounded-full text-red-500">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-red-400 font-bold">Outstanding Debt: {formatPeso(totalDebt)}</h3>
                <p className="text-sm text-red-300/70">
                  Debtors: {debtors.join(", ")}
                </p>
              </div>
            </div>
            <button className="text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded uppercase font-bold tracking-wider">
              Send Reminders
            </button>
          </div>
        ) : (
          <div className="bg-emerald-900/10 border border-emerald-900/30 p-4 rounded-lg flex items-center gap-3 text-emerald-400">
            <CheckCircle2 /> <span className="font-bold">All clear. No active debts.</span>
          </div>
        )}

        {/* 3. THE MASTER TABLE */}
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select 
                className="appearance-none bg-zinc-900 border border-zinc-800 text-white pl-9 pr-8 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
              >
                <option value="all">All Members</option>
                {/* Unique members from table data would go here, simplified: */}
                <option value="all">Show All</option>
                {/* In real app, map unique members here */}
              </select>
              <Filter size={14} className="absolute left-3 top-3 text-zinc-500" />
              <ChevronDown size={14} className="absolute right-3 top-3 text-zinc-500" />
            </div>

            <div className="relative">
               <select 
                className="appearance-none bg-zinc-900 border border-zinc-800 text-white pl-9 pr-8 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
              >
                <option value="all">All Services</option>
                <option value="Spotify">Spotify</option>
                <option value="Netflix">Netflix</option>
              </select>
              <Info size={14} className="absolute left-3 top-3 text-zinc-500" />
            </div>
          </div>

          {/* Table Container - Horizontal Scroll for Mobile */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-zinc-950 text-zinc-500 uppercase text-xs font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-3 sticky left-0 bg-zinc-950 z-10 border-r border-zinc-800">Member</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Paid On</th>
                    <th className="px-4 py-3 text-right">Target</th>
                    <th className="px-4 py-3">Cycle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {tableData.map((row, i) => (
                    <tr 
                      key={i} 
                      className={cn(
                        "transition-colors",
                        isAdmin ? "cursor-pointer hover:bg-zinc-800" : "hover:bg-zinc-800/30"
                      )}
                      onClick={() => updatePayment(row.id, row.memberId, row.serviceId, row.requiredAmount, row.status)}
                    >
                      <td className="px-4 py-3 font-medium text-white sticky left-0 bg-zinc-900 border-r border-zinc-800">
                        {row.memberName}
                      </td>
                      <td className="px-4 py-3">
                         <span className={cn(
                           "text-xs px-2 py-1 rounded font-bold",
                           row.serviceName === 'Spotify' ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                         )}>
                           {row.serviceName}
                         </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.status === 'paid' ? (
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle2 size={16} /> 
                            <span className="font-bold">PAID</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-red-500 animate-pulse">
                            <XCircle size={16} />
                            <span className="font-bold">UNPAID</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-white">
                        {formatPeso(row.paidAmount)}
                        {row.diff !== 0 && row.status === 'paid' && (
                          <span className={cn("ml-2 text-xs", row.diff > 0 ? "text-emerald-500" : "text-red-500")}>
                            ({row.diff > 0 ? '+' : ''}{row.diff})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs uppercase">{row.method}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{row.datePaid}</td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-500">{formatPeso(row.requiredAmount)}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{row.cycleLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {isAdmin && <div className="bg-emerald-900/20 text-emerald-500 text-center text-xs py-1">Manager Mode Active: Tap rows to toggle status</div>}
          </div>
        </div>

        {/* 4. ANALYTICS (Rigorous Analysis) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-zinc-800">
          
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-zinc-500" /> Payment Methods
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={methodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {methodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#6366f1', '#f59e0b'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
             <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-zinc-500" /> Collection Efficiency
            </h3>
            {/* Placeholder for more complex analytics */}
            <div className="flex items-center justify-center h-64 bg-zinc-950/50 rounded border border-dashed border-zinc-800 text-zinc-600 text-sm">
              Not enough historical data for trend analysis.
            </div>
          </div>
        </div>

      </main>

      {/* ADMIN LOGIN MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Manager Access</h2>
            <input
              type="password"
              placeholder="Enter PIN"
              className="w-full bg-black border border-zinc-700 text-center text-2xl tracking-[0.5em] text-white py-3 rounded-lg mb-4 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setShowPinModal(false)}
                className="flex-1 py-3 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAdminLogin}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}