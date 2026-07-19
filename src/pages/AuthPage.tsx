import { useSearchParams } from "react-router-dom";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("tab") === "register" || searchParams.has("invite") ? "register" : "login";

  // Render login/register as distinct component types so switching modes
  // remounts the subtree instead of reconciling the two forms onto the same
  // fibers (which left the shared inputs bound to the wrong form instance).
  return mode === "register" ? <RegisterForm /> : <LoginForm />;
};

export default AuthPage;
