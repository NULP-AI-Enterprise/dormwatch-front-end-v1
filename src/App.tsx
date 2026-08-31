import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import HomePage from "@/pages/HomePage";
import UserPage from "@/pages/UserPage";
import AdminPage from "@/pages/AdminPage";
import AdminComplaintsPage from "@/pages/AdminComplaintsPage";
import AdminResidentsPage from "@/pages/AdminResidentsPage";
import AdminAnnouncementsPage from "@/pages/AdminAnnouncementsPage";
import AdminSettingsPage from "@/pages/AdminSettingsPage";
import CreateReportPage from "@/pages/CreateReportPage";
import MyComplaintsPage from "@/pages/MyComplaintsPage";
import DashboardPage from "@/pages/DashboardPage";
import AuthPage from "@/pages/AuthPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import StudentLayout from "@/components/StudentLayout";
import AdminLayout from "@/components/AdminLayout";
import AdminTicketsPrintPage from "@/pages/AdminTicketsPrintPage";
import AdminCompletedReportPrintPage from "@/pages/AdminCompletedReportPrintPage";
import AdminWorkerReportPrintPage from "@/pages/AdminWorkerReportPrintPage";
import WorkerHomePage from "@/pages/WorkerHomePage";
import AdminWorkerInvitePrintPage from "@/pages/AdminWorkerInvitePrintPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/worker"
        element={
          <ProtectedRoute requireWorker>
            <WorkerHomePage />
          </ProtectedRoute>
        }
      />
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
        path="/admin/residents"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminResidentsPage />
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
        path="/admin/announcements"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout>
              <AdminAnnouncementsPage />
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
      <Route
        path="/admin/reports/completed/print"
        element={
          <ProtectedRoute requireAdmin>
            <AdminCompletedReportPrintPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports/workers/print"
        element={
          <ProtectedRoute requireAdmin>
            <AdminWorkerReportPrintPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/workers/invite/print"
        element={
          <ProtectedRoute requireAdmin>
            <AdminWorkerInvitePrintPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<div className="p-8 font-bold text-muted-foreground">404 — сторінку не знайдено</div>} />
      <Toaster />
    </Routes>
  );
}

export default App;
