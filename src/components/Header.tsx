import { Link } from "react-router-dom";
import { Building2, Bell, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { fetchUserProfile } from "../services/problemsApi";
import { getUserInitials } from "../lib/complaintUtils";

const Header = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUserProfile()
      .then((u) => setUser(u))
      .catch(() => {});
  }, []);

  const initials = getUserInitials(user, "U");

  return (
    <nav className="bg-stone-800 border-b border-stone-700 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/user" className="flex items-center gap-2 text-blue-500 font-bold text-xl tracking-tight">
          <Building2 className="w-6 h-6" strokeWidth={1.5} />
          <span>DormWatch</span>
        </Link>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex text-stone-400 hover:text-stone-50">
            <Bell className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-stone-700 cursor-pointer hover:opacity-80 transition-opacity">
            <Link to="/account" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-stone-700 flex items-center justify-center text-stone-300 font-semibold text-sm">
                {initials}
              </div>
              <ChevronDown className="w-4 h-4 text-stone-500" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
