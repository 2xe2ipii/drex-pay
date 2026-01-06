import { useState, useEffect } from "react";
import { Lock, ChevronRight } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  // Check if already logged in this session
  useEffect(() => {
    const session = sessionStorage.getItem("drex_manager_auth");
    if (session === "true") setIsAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = import.meta.env.VITE_MANAGER_PIN;

    if (pin === correctPin) {
      setIsAuthenticated(true);
      sessionStorage.setItem("drex_manager_auth", "true");
      setError(false);
    } else {
      setError(true);
      setPin("");
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800">
            <Lock className="text-emerald-500" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Manager Access</h1>
          <p className="text-zinc-500 mt-2">Enter verification code to continue.</p>
        </div>

        <form onSubmit={handleLogin} className="relative">
          <input
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            placeholder="Enter PIN"
            className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-center tracking-[0.5em] text-lg placeholder:tracking-normal placeholder:text-zinc-600"
            autoFocus
          />
          
          <button 
            type="submit"
            className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded-lg transition-colors flex items-center"
          >
            <ChevronRight size={20} />
          </button>
        </form>

        {error && (
          <p className="text-red-500 text-sm text-center mt-4 animate-pulse">
            Access Denied. Incorrect PIN.
          </p>
        )}
      </div>
    </div>
  );
}