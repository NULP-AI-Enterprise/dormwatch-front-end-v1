import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlaceCombobox } from "@/components/PlaceCombobox";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link01Icon, Copy01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { generateInviteLink } from "@/services/problemsApi";
import { roleLabel } from "@/lib/complaintUtils";
import type { Building, Place, Role } from "@/lib/types";

interface InviteLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildings: Building[];
  roles: Role[];
}

export function InviteLinkDialog({
  open,
  onOpenChange,
  buildings,
  roles,
}: InviteLinkDialogProps) {
  const [roleId, setRoleId] = useState<number | null>(null);
  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset state when opened
  useEffect(() => {
    if (!open && inviteUrl) {
      const timer = setTimeout(() => {
        setInviteUrl(null);
        setRoleId(null);
        setBuildingId(null);
        setPlace(null);
        setError("");
        setCopied(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, inviteUrl]);

  const handleGenerate = async () => {
    const adminRole = roles.find(r => r.role_name === "admin");
    if (!adminRole) {
      setError("Роль адміністратора не знайдено в системі");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        role_id: adminRole.role_id,
        building_id: null,
        place_id: null,
      };
      const res = await generateInviteLink(payload);
      const url = `${window.location.origin}/auth?tab=register&invite=${res.invite_token}`;
      setInviteUrl(url);
    } catch (e) {
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
      <DialogContent className="max-w-md border-border shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-bold text-lg mb-1">
            <HugeiconsIcon icon={Link01Icon} className="size-5" />
            <DialogTitle>Згенерувати посилання</DialogTitle>
          </div>
          <DialogDescription>
            Створіть одноразове посилання-запрошення. Користувач, який перейде за ним,
            автоматично зареєструється як адміністратор.
          </DialogDescription>
        </DialogHeader>

        {!inviteUrl ? (
          <div className="space-y-4 text-left mt-2">
            <p className="text-sm text-muted-foreground">
              Натисніть кнопку нижче, щоб згенерувати унікальне посилання для реєстрації нового адміністратора.
            </p>

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
