import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link01Icon, Copy01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { generateInviteLink } from "@/services/problemsApi";
import type { Building, Role } from "@/lib/types";

interface InviteLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildings?: Building[];
  roles: Role[];
}

export function InviteLinkDialog({
  open,
  onOpenChange,
  roles,
}: InviteLinkDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset state when opened
  useEffect(() => {
    if (!open && inviteUrl) {
      const timer = setTimeout(() => {
        setInviteUrl(null);
        setSelectedRole("admin");
        setError("");
        setCopied(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, inviteUrl]);

  const handleGenerate = async () => {
    const roleObj = roles.find((r) => r.role_name === selectedRole);
    setLoading(true);
    setError("");
    try {
      const payload = {
        role_id: roleObj ? roleObj.role_id : null,
        role_name: selectedRole,
        building_id: null,
        place_id: null,
      };
      const res = await generateInviteLink(payload);
      const url = `${window.location.origin}/auth?tab=register&invite=${res.invite_token}`;
      setInviteUrl(url);
    } catch {
      setError("Не вдалося згенерувати посилання");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-bold text-lg mb-1">
            <HugeiconsIcon icon={Link01Icon} className="size-5" />
            <DialogTitle>Запросити адміністратора</DialogTitle>
          </div>
          <DialogDescription>
            Одноразове посилання-запрошення. Користувач, який перейде за ним,
            автоматично зареєструється як адміністратор.
          </DialogDescription>
        </DialogHeader>

        {!inviteUrl ? (
          <div className="space-y-4 text-left mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Роль для реєстрації</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Оберіть роль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Адміністратор</SelectItem>
                  <SelectItem value="worker">Працівник</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedRole === "admin"
                  ? "Новий користувач отримає повний доступ до адмін-панелі."
                  : "Новий користувач отримає доступ ролі працівника."}
              </p>
            </div>

            {error && (
              <p className="text-xs font-semibold text-destructive">{error}</p>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Скасувати
              </Button>
              <Button onClick={handleGenerate} disabled={loading}>
                Згенерувати
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="p-3 bg-muted rounded-md text-sm break-all font-mono">
              {inviteUrl}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Закрити
              </Button>
              <Button onClick={handleCopy} className="gap-2 w-32">
                {copied ? (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
                    Скопійовано
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Copy01Icon} className="size-4" />
                    Копіювати
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
