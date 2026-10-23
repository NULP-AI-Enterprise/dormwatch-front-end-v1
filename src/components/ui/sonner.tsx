import { useTheme } from "@/components/theme-provider";
import { Toaster as Sonner, type ToasterProps } from "sonner";

type Theme = "light" | "dark" | "system";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as Theme}
      containerAriaLabel="Сповіщення"
      className="toaster group"
      toastOptions={{
        // Design system §5: Sonner owns its stylesheet, so set the shared surface explicitly.
        style: { borderRadius: 0, background: "var(--popover)", color: "var(--popover-foreground)", borderColor: "var(--border)" },
        closeButtonAriaLabel: "Закрити сповіщення",
        classNames: {
          toast:
            "group toast rounded-none group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toaster]:text-muted-foreground",
          actionButton:
            "group-[.toaster]:bg-primary group-[.toaster]:text-primary-foreground",
          cancelButton:
            "group-[.toaster]:bg-muted group-[.toaster]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
