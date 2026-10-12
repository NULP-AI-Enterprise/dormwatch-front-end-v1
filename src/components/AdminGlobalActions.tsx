import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { ExportTicketsModal } from "@/components/ExportTicketsModal";
import ComplaintSidePanel from "@/components/ComplaintSidePanel";
import { fetchComplaintDetail } from "@/services/problemsApi";
import { useUser } from "@/context/UserContext";
import type { Complaint } from "@/lib/types";

/**
 * Global admin header chrome: the data-export button and the notification bell,
 * always in this order. Rendered once by AdminLayout so every admin page shows
 * the same controls in the same place. It owns its own export modal and the
 * complaint panel opened from a notification, so individual pages don't re-wire
 * them. Opening a complaint from the bell and changing its status broadcasts
 * `adminComplaintUpdated`, which the admin pages already listen for to refresh.
 */
export function AdminExportButton() {
  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="default"
        className="gap-2"
        onClick={() => setIsExportOpen(true)}
      >
        <Download className="size-4" strokeWidth={2} />
        Експорт даних
      </Button>
      <ExportTicketsModal open={isExportOpen} onOpenChange={setIsExportOpen} />
    </>
  );
}

export function AdminNotificationBell() {
  const { user: currentUser } = useUser();
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <NotificationBell
        onSelectComplaint={(c) => {
          setSelectedComplaint(c);
          setSheetOpen(true);
        }}
      />

      {selectedComplaint && (
        <ComplaintSidePanel
          complaint={selectedComplaint}
          open={sheetOpen}
          onOpenChange={(open) => {
            setSheetOpen(open);
            if (!open) setSelectedComplaint(null);
          }}
          onStatusChange={() => {
            window.dispatchEvent(new Event("adminComplaintUpdated"));
            if (selectedComplaint) {
              fetchComplaintDetail(selectedComplaint.id)
                .then((fresh) => {
                  if (fresh) setSelectedComplaint(fresh);
                })
                .catch(() => {
                  setSelectedComplaint(null);
                  setSheetOpen(false);
                });
            }
          }}
          currentUserId={currentUser?.user}
          isAdmin={true}
        />
      )}
    </>
  );
}

export function AdminGlobalActions() {
  return (
    <>
      <AdminExportButton />
      <AdminNotificationBell />
    </>
  );
}

