import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import UserPage from "@/pages/UserPage";
import AdminPage from "@/pages/AdminPage";
import AdminComplaintsPage from "@/pages/AdminComplaintsPage";
import AdminSettingsPage from "@/pages/AdminSettingsPage";
import CreateReportPage from "@/pages/CreateReportPage";
import MyComplaintsPage from "@/pages/MyComplaintsPage";
import MyTicketsPage from "@/pages/MyTicketsPage";
import DashboardPage from "@/pages/DashboardPage";
import AuthPage from "@/pages/AuthPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import StudentLayout from "@/components/StudentLayout";
import AdminLayout from "@/components/AdminLayout";
import AdminTicketsPrintPage from "@/pages/AdminTicketsPrintPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/user"
        element={
          <ProtectedRoute blockAdmin>
            <StudentLayout>
              <UserPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-report"
        element={
          <ProtectedRoute blockAdmin>
            <StudentLayout>
              <CreateReportPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-complaints"
        element={
          <ProtectedRoute blockAdmin>
            <StudentLayout>
              <MyComplaintsPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-tickets"
        element={
          <ProtectedRoute blockAdmin>
            <StudentLayout>
              <MyTicketsPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <StudentLayout>
              <DashboardPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/complaints"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminComplaintsPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminSettingsPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tickets/print"
        element={
          <ProtectedRoute requireAdmin>
            <AdminTicketsPrintPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<div className="p-8 font-bold text-muted-foreground">404 — сторінку не знайдено</div>} />
    </Routes>
  );
}

export default App;
