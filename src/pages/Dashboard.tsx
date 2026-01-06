import { useState, useMemo } from "react";
import { useTracker } from "../hooks/useTracker";
import { formatPeso, getBillingCycle, getMonthOptions, cn } from "../lib/utils";
import { supabase } from "../lib/supabase";
import { 
  Lock, Unlock, ChevronDown, 
  Calendar, DollarSign, Save, UserMinus, UserPlus, Music, Tv, X
} from "lucide-react";
import { format, startOfMonth } from "date-fns";

export default function Dashboard() {
  // --- STATE ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  
  // Filters
  const monthOptions = useMemo(() => getMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0].value);
  const [selectedService, setSelectedService] = useState<string>("all"); // 'all', 'Spotify', 'Netflix'
  
  // Data
  const { services, allPayments, refresh, loading, addMember, removeMember } = useTracker();

  // --- MODAL STATE ---
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    data: any;
  }>({ isOpen: false, data: null });

  const [memberModal, setMemberModal] = useState({ isOpen: false, name: '', serviceId: '' });

  // --- COMPUTATIONS ---
  const tableData = useMemo(() => {
    let rows: any[] = [];
    const targetPeriod = format(new Date(selectedMonth), 'yyyy-MM-dd');

    services.forEach(service => {
      // Filter Service Tab
      if (selectedService !== "all" && !service.name.includes(selectedService)) return;

      const cycle = getBillingCycle(service.billingDay, selectedMonth);

      service.members.forEach(member => {
        const payment = allPayments.find(p => 
          p.memberId === member.id && 
          p.serviceId === service.id && 
          p.periodDate === targetPeriod
        );

        const status = payment?.status || 'unpaid';
        const required = service.fixedPrice || 0;
        const paid = payment?.amountDue || 0;

        rows.push({
          uniqueId: `${member.id}-${service.id}-${targetPeriod}`,
          paymentId: payment?.id,
          memberId: member.id,
          serviceId: service.id,
          memberName: member.name,
          serviceName: service.name,
          cycle,
          requiredAmount: required,
          paidAmount: status === 'paid' ? paid : 0,
          status,
          datePaid: payment?.paidDate,
          method: payment?.method || "GCash",
        });
      });
    });
    return rows;
  }, [services, allPayments, selectedService, selectedMonth]);

  // --- HANDLERS ---
  const handleAdminLogin = () => {
    if (pinInput === import.meta.env.VITE_MANAGER_PIN) {
      setIsAdmin(true);
      setShowPinModal(false);
      setPinInput("");
    } else {
      alert("Wrong PIN");
    }
  };

  const handleOpenPayment = (row: any) => {
    setPaymentModal({
      isOpen: true,
      data: {
        ...row,
        inputAmount: row.status === 'paid' ? row.paidAmount : row.requiredAmount,
        inputDate: row.datePaid ? format(new Date(row.datePaid), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        inputMethod: row.method !== '-' ? row.method : 'GCash'
      }
    });
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const { paymentId, memberId, serviceId, inputAmount, inputDate, inputMethod } = paymentModal.data;
    const periodDate = startOfMonth(new Date(selectedMonth));

    const payload = {
      member_id: memberId,
      service_id: serviceId,
      amount: parseFloat(inputAmount),
      status: 'paid',
      method: inputMethod,
      period_date: periodDate,
      paid_at: new Date(inputDate).toISOString(),
    };

    if (paymentId) await supabase.from("payments").update(payload).eq('id', paymentId);
    else await supabase.from("payments").insert(payload);
    
    setPaymentModal({ isOpen: false, data: null });
    refresh();
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    await addMember(memberModal.name, memberModal.serviceId);
    setMemberModal({ isOpen: false, name: '', serviceId: '' });
  };

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center text-emerald-400 font-bold tracking-widest animate-pulse">LOADING...</div>;

  return (
    <div className="min-h-screen pb-20">
      
      {/* BACKGROUND BLOBS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full mix-blend-screen" />
         <div className="absolute top-[10%] right-[-10%] w-[40%] h-[50%] bg-pink-500/10 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      {/* HEADER */}
      <header className="relative z-10 glass sticky top-0">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-emerald-500/10" />
             <h1 className="text-xl font-bold gradient-text">DrexPay</h1>
          </div>

          <button 
            onClick={() => isAdmin ? setIsAdmin(false) : setShowPinModal(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border",
              isAdmin 
                ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" 
                : "bg-zinc-800/50 text-zinc-400 border-white/5 hover:text-white"
            )}
          >
            {isAdmin ? <Unlock size={14} /> : <Lock size={14} />}
            {isAdmin ? "MANAGER MODE" : "VIEW ONLY"}
          </button>
        </div>
      </header>

      <main className="relative z-0 max-w-4xl mx-auto p-6 space-y-10">
        
        {/* 1. SERVICE INFO CARDS (Public) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Spotify Card */}
           <div className="relative overflow-hidden rounded-2xl p-6 glass border-0 group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/20 to-transparent opacity-50" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                   <h3 className="text-lg font-bold text-white flex items-center gap-2">
                     <Music size={18} className="text-[#1DB954]" /> Spotify Premium
                   </h3>
                   <span className="text-xs font-bold bg-[#1DB954]/20 text-[#1DB954] px-2 py-1 rounded-md">Family Plan</span>
                </div>
                <ul className="text-sm text-zinc-300 space-y-1">
                  <li>• Ad-free music listening</li>
                  <li>• Download for offline play</li>
                  <li>• High quality audio streaming</li>
                </ul>
              </div>
           </div>

           {/* Netflix Card */}
           <div className="relative overflow-hidden rounded-2xl p-6 glass border-0">
              <div className="absolute inset-0 bg-gradient-to-br from-[#E50914]/20 to-transparent opacity-50" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                   <h3 className="text-lg font-bold text-white flex items-center gap-2">
                     <Tv size={18} className="text-[#E50914]" /> Netflix Premium
                   </h3>
                   <span className="text-xs font-bold bg-[#E50914]/20 text-[#E50914] px-2 py-1 rounded-md">4K + HDR</span>
                </div>
                <ul className="text-sm text-zinc-300 space-y-1">
                  <li>• Ultra HD 4K streaming</li>
                  <li>• Spatial Audio supported</li>
                  <li>• Watch on 4 devices at once</li>
                </ul>
              </div>
           </div>
        </div>

        {/* 2. TABLE CONTROLS */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
           {/* Service Selector (Pills) */}
           <div className="flex p-1 bg-zinc-900/80 rounded-full border border-white/5">
              {['all', 'Spotify', 'Netflix'].map(s => (
                <button 
                  key={s}
                  onClick={() => setSelectedService(s)}
                  className={cn(
                    "px-6 py-2 rounded-full text-xs font-bold transition-all",
                    selectedService === s 
                      ? "bg-zinc-800 text-white shadow-lg" 
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {s === 'all' ? 'All Services' : s}
                </button>
              ))}
           </div>

           {/* Cycle Selector */}
           <div className="relative group">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-zinc-900/80 text-white text-xs font-bold pl-10 pr-10 py-2.5 rounded-full border border-white/5 hover:border-emerald-500/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all cursor-pointer"
              >
                {monthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Calendar size={14} className="absolute left-3.5 top-3 text-emerald-400" />
              <ChevronDown size={14} className="absolute right-3.5 top-3 text-zinc-600 group-hover:text-zinc-400" />
           </div>
        </div>

        {/* 3. THE TABLE */}
        <div className="glass rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4 text-center">Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  {isAdmin && <th className="px-6 py-4 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tableData.map((row) => (
                  <tr key={row.uniqueId} className="group hover:bg-white/[0.02] transition-colors">
                    {/* NAME */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-sm">{row.memberName}</div>
                    </td>

                    {/* AMOUNT */}
                    <td className="px-6 py-4 text-center">
                       <span className="font-mono text-sm text-zinc-300">
                         {formatPeso(row.status === 'paid' ? row.paidAmount : row.requiredAmount)}
                       </span>
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4 text-center">
                       {row.status === 'paid' ? (
                         <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                           PAID
                         </span>
                       ) : (
                         <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 text-[10px] font-bold border border-red-500/20">
                           UNPAID
                         </span>
                       )}
                    </td>

                    {/* ACTION (Admin Only) */}
                    {isAdmin && (
                      <td className="px-6 py-4 text-center">
                         <button 
                           onClick={() => handleOpenPayment(row)}
                           className={cn(
                             "p-2 rounded-xl transition-all shadow-lg active:scale-95",
                             row.status === 'paid' 
                               ? "bg-zinc-800 text-zinc-500 hover:text-white" 
                               : "gradient-spotify text-black hover:brightness-110"
                           )}
                           title={row.status === 'paid' ? "Edit Payment" : "Mark Paid"}
                         >
                           <DollarSign size={16} strokeWidth={3} />
                         </button>
                      </td>
                    )}
                  </tr>
                ))}
                
                {tableData.length === 0 && (
                   <tr>
                     <td colSpan={isAdmin ? 4 : 3} className="py-10 text-center text-zinc-600 italic text-sm">
                       No records found for this selection.
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. ADMIN: MEMBER MANAGEMENT (Only if Admin) */}
        {isAdmin && (
           <div className="glass rounded-2xl p-6 border-t-4 border-emerald-500/50">
              <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                 <UserPlus size={16} /> Member Management
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Add Member */}
                 <form onSubmit={handleAddMember} className="space-y-4">
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         placeholder="New Member Name" 
                         className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                         value={memberModal.name}
                         onChange={e => setMemberModal({...memberModal, name: e.target.value})}
                         required
                       />
                       <select 
                         className="bg-black/50 border border-white/10 rounded-lg px-2 py-2 text-sm text-zinc-400 focus:border-emerald-500 outline-none"
                         value={memberModal.serviceId}
                         onChange={e => setMemberModal({...memberModal, serviceId: e.target.value})}
                         required
                       >
                         <option value="">Service</option>
                         {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                    </div>
                    <button type="submit" className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold">
                      ADD MEMBER
                    </button>
                 </form>

                 {/* Member List */}
                 <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {services.flatMap(s => s.members.map(m => ({ ...m, serviceName: s.name }))).map((m, i) => (
                      <div key={`${m.id}-${i}`} className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5">
                         <div className="text-xs">
                           <span className="text-white font-bold">{m.name}</span>
                           <span className="text-zinc-500 ml-2">{m.serviceName}</span>
                         </div>
                         <button onClick={() => { if(confirm('Remove member?')) removeMember(m.id); }} className="text-red-500 hover:text-red-400">
                           <UserMinus size={14} />
                         </button>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

      </main>

      {/* --- PIN MODAL --- */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#09090b] border border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
               <Lock size={20} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Manager Access</h2>
            <p className="text-xs text-zinc-500 mb-6">Enter your security PIN to edit records.</p>
            
            <input
              type="password"
              placeholder="• • • •"
              className="w-full bg-black border border-zinc-800 text-center text-3xl tracking-[0.5em] text-white py-4 rounded-xl mb-6 focus:border-emerald-500 outline-none transition-colors"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              autoFocus
            />
            
            <button onClick={handleAdminLogin} className="w-full py-3 gradient-spotify text-black font-bold rounded-xl mb-3 hover:brightness-110 transition-all">
              UNLOCK
            </button>
            <button onClick={() => setShowPinModal(false)} className="text-xs text-zinc-500 hover:text-white">
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* --- PAYMENT MODAL --- */}
      {paymentModal.isOpen && paymentModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
           <form onSubmit={submitPayment} className="bg-[#09090b] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
             <div className="p-6 border-b border-white/5 flex justify-between items-center">
               <h2 className="text-lg font-bold text-white">Update Payment</h2>
               <button type="button" onClick={() => setPaymentModal({ isOpen: false, data: null })} className="text-zinc-500 hover:text-white">
                 <X size={20} />
               </button>
             </div>
             
             <div className="p-8 space-y-6">
               <div>
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Amount (PHP)</label>
                 <input 
                   type="number" step="0.01" required
                   className="w-full bg-transparent border-b border-zinc-700 py-2 text-3xl font-mono text-white focus:border-emerald-500 outline-none"
                   value={paymentModal.data.inputAmount}
                   onChange={e => setPaymentModal({ ...paymentModal, data: { ...paymentModal.data, inputAmount: e.target.value } })}
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Method</label>
                   <select 
                     className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                     value={paymentModal.data.inputMethod}
                     onChange={e => setPaymentModal({ ...paymentModal, data: { ...paymentModal.data, inputMethod: e.target.value } })}
                   >
                     <option value="GCash">GCash</option>
                     <option value="Bank">Bank</option>
                     <option value="Cash">Cash</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Date</label>
                   <input 
                     type="datetime-local" 
                     className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none"
                     value={paymentModal.data.inputDate}
                     onChange={e => setPaymentModal({ ...paymentModal, data: { ...paymentModal.data, inputDate: e.target.value } })}
                   />
                 </div>
               </div>
             </div>

             <div className="p-4 bg-white/5 flex gap-3">
               <button type="submit" className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                 <Save size={16} /> SAVE RECORD
               </button>
             </div>
           </form>
        </div>
      )}

    </div>
  );
}