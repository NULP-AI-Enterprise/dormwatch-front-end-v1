import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAdminUser } from "../lib/complaintUtils";
import { useUser } from "../context/UserContext";
import LoadingSpinner from "./LoadingSpinner";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireStudent?: boolean;
  blockAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin, requireStudent, blockAdmin }: ProtectedRouteProps) => {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const admin = isAdminUser(user);
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

  if (blockAdmin && admin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
