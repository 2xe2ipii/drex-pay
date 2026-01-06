import { Check, X, CreditCard } from "lucide-react";
import type { Service, PaymentStatus } from "../../types";
import { formatPeso } from "../../lib/utils";

interface PaymentTableProps {
  service: Service;
  payments: PaymentStatus[];
  onTogglePayment: (memberId: string, amount: number) => void;
}

export function PaymentTable({ service, payments, onTogglePayment }: PaymentTableProps) {
  // Calculate cost per person for this service
  const costPerPerson = service.members.length > 0 
    ? service.totalCost / service.members.length 
    : 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
        <h3 className="font-semibold text-zinc-100">{service.name} Management</h3>
      </div>
      
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-950 text-zinc-400">
          <tr>
            <th className="px-6 py-3 font-medium">Member</th>
            <th className="px-6 py-3 font-medium">Status</th>
            <th className="px-6 py-3 font-medium text-right">Amount</th>
            <th className="px-6 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {service.members.map((member) => {
            const status = payments.find(p => p.memberId === member.id && p.serviceId === service.id);
            const isPaid = status?.isPaid || false;

            return (
              <tr key={member.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-200">{member.name}</td>
                <td className="px-6 py-4">
                  {isPaid ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                      <Check size={12} /> Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500">
                      <X size={12} /> Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right font-mono text-zinc-400">
                  {formatPeso(costPerPerson)}
                </td>
                <td className="px-6 py-4 text-right">
                  {!isPaid && (
                    <button 
                      onClick={() => onTogglePayment(member.id, costPerPerson)}
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-md transition-colors"
                    >
                      <CreditCard size={12} /> Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}