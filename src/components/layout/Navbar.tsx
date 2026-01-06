import { LayoutDashboard, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Container } from "./Container";
import { cn } from "../../lib/utils";

export function Navbar() {
  const location = useLocation();
  const isAdmin = location.pathname.includes("/admin");

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
      <Container className="h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-black">
            D
          </div>
          <span className="font-bold text-lg tracking-tight">DrexPay</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-white",
              !isAdmin ? "text-white" : "text-zinc-500"
            )}
          >
            Overview
          </Link>
          <Link 
            to="/admin" 
            className={cn(
              "flex items-center gap-2 text-sm font-medium transition-colors hover:text-white px-3 py-1.5 rounded-full",
              isAdmin ? "bg-zinc-800 text-white" : "text-zinc-500"
            )}
          >
            {isAdmin ? <ShieldCheck size={14} /> : <LayoutDashboard size={14} />}
            Manager Mode
          </Link>
        </div>
      </Container>
    </nav>
  );
}