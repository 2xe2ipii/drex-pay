import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PublicDashboard from "./pages/PublicDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { Navbar } from "./components/layout/Navbar";

function App() {
  return (
    <BrowserRouter>
      {/* Navbar is inside pages or wrapped here if you want it everywhere. 
          For now, let's put it inside pages to control it better, 
          or just wrap the public route in a layout. */}
      
      <Routes>
        <Route path="/" element={
          <>
            <Navbar />
            <PublicDashboard />
          </>
        } />
        
        <Route path="/admin" element={<AdminDashboard />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;