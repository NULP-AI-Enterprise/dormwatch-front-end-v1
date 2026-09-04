import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAdminUser, isWorkerUser } from "@/lib/complaintUtils";
import { useUser } from "@/context/UserContext";
import PageSpinner from "@/components/PageSpinner";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireStudent?: boolean;
  requireWorker?: boolean;
  blockAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin, requireStudent, requireWorker, blockAdmin }: ProtectedRouteProps) => {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return <PageSpinner />;
  }

  const admin = isAdminUser(user);
  const worker = isWorkerUser(user);
  const isAuthPage = location.pathname === "/auth";

  if (!user && !isAuthPage) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !admin) {
    return <Navigate to="/" replace />;
  }

  if (requireStudent && admin) {
    return <Navigate to="/admin" replace />;
  }

  // Worker branch: a logged-in worker never reaches the resident app — they
  // route to the worker layout instead.
  if (blockAdmin && worker) {
    return <Navigate to="/worker" replace />;
  }

  if (requireWorker && !worker) {
    return <Navigate to="/" replace />;
  }

  if (blockAdmin && admin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
