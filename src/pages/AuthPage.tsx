import { useSearchParams } from "react-router-dom";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import VerifyEmailForm from "@/components/VerifyEmailForm";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import ResetPasswordForm from "@/components/ResetPasswordForm";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const email = searchParams.get("email");

  if (tab === "verify" && email) {
    return <VerifyEmailForm email={email} />;
  }
  if (tab === "forgot") {
    return <ForgotPasswordForm />;
  }
  if (tab === "reset" && email) {
    return <ResetPasswordForm email={email} />;
  }

  const mode = tab === "register" ? "register" : "login";

  // Render login/register as distinct component types so switching modes
  // remounts the subtree instead of reconciling the two forms onto the same
  // fibers (which left the shared inputs bound to the wrong form instance).
  return mode === "register" ? <RegisterForm /> : <LoginForm />;
};

export default AuthPage;
