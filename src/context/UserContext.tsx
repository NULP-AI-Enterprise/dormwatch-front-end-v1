import type { UserProfile } from "@/lib/types";
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { fetchUserProfile } from "@/services/problemsApi";

interface UserContextValue {
  user: UserProfile | null;
  loading: boolean;
  refreshUser: () => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  refreshUser: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUser = useRef(user);
  currentUser.current = user;

  const refreshUser = () => {
    // Sign-in must wait for its first profile; background profile saves must
    // keep the existing page/dialog mounted.
    setLoading(currentUser.current === null);
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
