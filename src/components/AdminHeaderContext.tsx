import { createContext, useContext, useEffect, type ReactNode } from "react";

interface AdminHeaderContextValue {
  setActions: (actions: ReactNode) => void;
}

const AdminHeaderContext = createContext<AdminHeaderContextValue | null>(null);

export const AdminHeaderProvider = ({
  setActions,
  children,
}: {
  setActions: (actions: ReactNode) => void;
  children: ReactNode;
}) => {
  return (
    <AdminHeaderContext.Provider value={{ setActions }}>
      {children}
    </AdminHeaderContext.Provider>
  );
};

/**
 * Register page-specific action buttons into the shared AdminLayout header.
 * Actions are cleared on unmount so navigating away leaves a title-only header.
 */
export const useAdminHeaderActions = (actions: ReactNode) => {
  const ctx = useContext(AdminHeaderContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setActions(actions);
    return () => ctx.setActions(null);
  }, [ctx, actions]);
};
