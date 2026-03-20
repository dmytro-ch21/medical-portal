import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext.jsx";
import Sidebar from "@/components/layout/Sidebar.jsx";
import LoginPage from "@/pages/LoginPage.jsx";
import ChecklistPage from "@/pages/ChecklistPage.jsx";
import ScriptsPage from "@/pages/ScriptsPage.jsx";
import SpecialistsPage from "@/pages/SpecialistsPage.jsx";
import PatientsPage from "@/pages/PatientsPage.jsx";
import ClinicPage from "@/pages/ClinicPage.jsx";
import PricesPage from "@/pages/PricesPage.jsx";
import AdminPage from "@/pages/AdminPage.jsx";
import ReportsPage from "@/pages/ReportsPage.jsx";
import CalendarPage from "@/pages/CalendarPage.jsx";

function AppShell() {
  const { user } = useAuth();

  // Loading state
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-portal-bg flex items-center justify-center">
        <div className="text-sm text-muted">Загрузка...</div>
      </div>
    );
  }

  // Not logged in
  if (!user) return <LoginPage />;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-10 py-9 overflow-y-auto">
        <Routes>
          <Route path="/" element={<ChecklistPage />} />
          <Route path="/scripts" element={<ScriptsPage />} />
          <Route path="/specialists" element={<SpecialistsPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/clinic" element={<ClinicPage />} />
          <Route path="/prices" element={<PricesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/admin" element={user.role === "admin" ? <AdminPage /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
