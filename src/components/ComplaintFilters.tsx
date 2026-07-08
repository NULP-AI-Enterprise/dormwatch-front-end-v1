import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PRIORITY_OPTIONS, priorityLabel } from "@/lib/complaintUtils";
import type { Building, CategoryOption } from "@/lib/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { SearchIcon } from "@hugeicons/core-free-icons";

// Filter primitives shared by the dashboard, user, and admin sidebars. These
// were copy-pasted (with per-page state names) across UserPage, AdminPage,
// DashboardPage, and AdminComplaintsPage; extracted here so the option lists
// and markup live in one place.

type FilterSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function FilterSearchInput({
  value,
  onChange,
  placeholder = "Пошук заявок...",
}: FilterSearchInputProps) {
  return (
    <div className="relative">
      <HugeiconsIcon
        icon={SearchIcon}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground"
        strokeWidth={2}
      />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8"
      />
    </div>
  );
}

type SelectFilterProps = {
  value: string;
  onValueChange: (value: string) => void;
};

export function StatusFilterSelect({ value, onValueChange }: SelectFilterProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full h-8 text-xs">
        <SelectValue placeholder="Статус" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Всі</SelectItem>
        <SelectItem value="pending">Очікує</SelectItem>
        <SelectItem value="approved">Активно</SelectItem>
        <SelectItem value="rejected">Відхилено</SelectItem>
        <SelectItem value="resolved">Вирішено</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function PriorityFilterSelect({ value, onValueChange }: SelectFilterProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full h-8 text-xs">
        <SelectValue placeholder="Всі пріоритети" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Всі пріоритети</SelectItem>
        {PRIORITY_OPTIONS.map((p) => (
          <SelectItem key={p} value={p}>
            {priorityLabel(p)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type BuildingFilterSelectProps = SelectFilterProps & {
  buildings: Building[];
};

export function BuildingFilterSelect({
  value,
  onValueChange,
  buildings,
}: BuildingFilterSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full h-8 text-xs">
        <SelectValue placeholder="Всі гуртожитки" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Всі гуртожитки</SelectItem>
        {buildings.map((b) => (
          <SelectItem key={b.building_id} value={b.name}>
            {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type CategoryFilterButtonsProps = {
  value: string;
  onChange: (value: string) => void;
  categories: CategoryOption[];
};

// Toggle group: clicking the active category clears it back to "all".
export function CategoryFilterButtons({
  value,
  onChange,
  categories,
}: CategoryFilterButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={value === "all" ? "default" : "outline"}
        size="xs"
        onClick={() => onChange("all")}
      >
        Всі
      </Button>
      {categories.map((cat) => (
        <Button
          key={cat.category_id}
          variant={value === cat.name ? "default" : "outline"}
          size="xs"
          onClick={() => onChange(value === cat.name ? "all" : cat.name)}
        >
          {cat.name}
        </Button>
      ))}
    </div>
  );
}
