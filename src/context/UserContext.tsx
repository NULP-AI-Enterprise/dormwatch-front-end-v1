import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { fetchUserProfile } from "../services/problemsApi";

interface UserContextValue {
  user: any;
  loading: boolean;
  refreshUser: () => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  refreshUser: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = () => {
    setLoading(true);
    fetchUserProfile()
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshUser();
    window.addEventListener("profileUpdated", refreshUser);
    return () => window.removeEventListener("profileUpdated", refreshUser);
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
