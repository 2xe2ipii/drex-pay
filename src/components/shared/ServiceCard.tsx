import { Users, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Service, PaymentStatus } from "../../types";
import { cn, formatPeso } from "../../lib/utils";

interface ServiceCardProps {
  service: Service;
  payments: PaymentStatus[]; // Pass the payment status for the current month
}

export function ServiceCard({ service, payments }: ServiceCardProps) {
  const currentCount = service.members.length;
  // Dynamic calculation: If 0 members, avoid divide by zero
  const costPerPerson = currentCount > 0 ? service.totalCost / currentCount : 0;
  const slotsLeft = service.maxSlots - currentCount;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className={cn(
        "p-6 border-b border-zinc-800 relative overflow-hidden",
        service.name === 'Spotify' ? "bg-green-900/10" : "bg-red-900/10"
      )}>
        <div className="flex justify-between items-start z-10 relative">
          <div>
            <h3 className={cn(
              "text-2xl font-bold",
              service.name === 'Spotify' ? "text-green-500" : "text-red-500"
            )}>
              {service.name}
            </h3>
            <p className="text-zinc-400 text-sm">Total: {formatPeso(service.totalCost)}/mo</p>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">Split Price</span>
             <span className="text-2xl font-bold text-white">{formatPeso(costPerPerson)}</span>
          </div>
        </div>
      </div>

      {/* Slots Indicator */}
      <div className="px-6 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Users size={16} />
          <span>{currentCount} / {service.maxSlots} Members</span>
        </div>
        <div className={cn(
          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
          slotsLeft === 0 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
        )}>
          {slotsLeft === 0 ? 'Full' : `${slotsLeft} Open`}
        </div>
      </div>

      {/* Member List & Status */}
      <div className="p-6 space-y-3">
        {service.members.map((member) => {
          // Find payment status for this member
          const status = payments.find(p => p.memberId === member.id && p.serviceId === service.id);
          const isPaid = status?.isPaid || false;

          return (
            <div key={member.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                  {member.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-zinc-200 text-sm">{member.name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {isPaid ? (
                   <span className="flex items-center gap-1.5 text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                     <CheckCircle2 size={12} />
                     Paid
                   </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20 animate-pulse">
                    <AlertCircle size={12} />
                    Unpaid
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}