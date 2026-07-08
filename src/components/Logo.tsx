import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** When set, the logo is a router link to this path. */
  to?: string;
  className?: string;
}

// The DormWatch brand mark: Building03 icon + wordmark, primary color, bold.
// Shared by the student nav, admin sidebar, and landing-page header.
const Logo = ({ to, className }: LogoProps) => {
  const content = (
    <>
      <HugeiconsIcon icon={Building03Icon} className="size-6" strokeWidth={1.5} />
      <span>DormWatch</span>
    </>
  );

  const baseClass = cn(
    "flex items-center gap-2 text-primary font-bold text-xl tracking-tight",
    to && "cursor-pointer hover:text-primary/80 transition-colors",
    className
  );

  if (to) {
    return (
      <Link to={to} className={baseClass}>
        {content}
      </Link>
    );
  }

  return <div className={baseClass}>{content}</div>;
};

export default Logo;
