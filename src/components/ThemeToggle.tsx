import { Sun, Moon, Monitor } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTheme } from "@/components/theme-provider";

const THEME_OPTIONS = [
  { key: "light", label: "Світла", icon: Sun },
  { key: "system", label: "Системна", icon: Monitor },
  { key: "dark", label: "Темна", icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={0}
      value={theme}
      // Radix emits "" when the active item is clicked again; ignore it so a
      // theme stays selected at all times.
      onValueChange={(value) => {
        const option = THEME_OPTIONS.find((o) => o.key === value);
        if (option) setTheme(option.key);
      }}
      aria-label="Тема оформлення"
    >
      {THEME_OPTIONS.map(({ key, label, icon: Icon }) => (
        <ToggleGroupItem
          key={key}
          value={key}
          aria-label={label}
          title={label}
          // design-system.md §7: ToggleGroup on-states carry the primary fill,
          // not the muted on-state shadcn ships by default.
          className="size-7 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:hover:bg-primary/80 cursor-pointer"
        >
          <Icon className="size-3.5" strokeWidth={2} />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
