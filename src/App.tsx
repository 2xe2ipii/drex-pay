import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PublicDashboard from "./pages/PublicDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { Navbar } from "./components/layout/Navbar";
import { AdminGuard } from "./components/dashboard/AdminGuard"; // Import this

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <>
            <Navbar />
            <PublicDashboard />
          </>
        } />
        
        {/* Protected Route */}
        <Route path="/admin" element={
          <AdminGuard>
            <AdminDashboard />
          </AdminGuard>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;