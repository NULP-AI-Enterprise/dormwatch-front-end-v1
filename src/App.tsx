import { Routes, Route, Link } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Home01Icon } from "@hugeicons/core-free-icons";
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
    <>
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
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-center max-w-md">
            <p className="text-6xl font-bold text-muted-foreground mb-4">404</p>
            <h1 className="text-xl font-bold text-foreground mb-2">Сторінку не знайдено</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Сторінка, яку ви шукаєте, не існує або була переміщена.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-border bg-background hover:bg-muted transition-colors text-foreground"
            >
              <HugeiconsIcon icon={Home01Icon} className="size-4" strokeWidth={2} />
              На головну
            </Link>
          </div>
        </div>
      } />
    </Routes>
    <Toaster />
    </>
  );
}

export default App;
