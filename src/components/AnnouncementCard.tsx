import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { PinIcon } from "@hugeicons/core-free-icons";
import { formatDate } from "@/lib/dateUtils";
import type { Announcement } from "@/lib/types";

interface AnnouncementCardProps {
  announcement: Announcement;
  clickable?: boolean;
  onClick?: () => void;
}

const AnnouncementCard = ({
  announcement,
  clickable = false,
  onClick,
}: AnnouncementCardProps) => {
  const a = announcement;

  return (
    <Card
      className={`py-0 border-border shadow-none bg-card ${
        clickable
          ? "group hover:bg-muted/50 transition-colors cursor-pointer"
          : ""
      }`}
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{a.building_name || "Всі гуртожитки"}</Badge>
            {a.is_pinned && (
              <Badge>
                <HugeiconsIcon icon={PinIcon} data-icon="inline-start" strokeWidth={2} />
                Закріплено
              </Badge>
            )}
            {a.is_expired && (
              <Badge variant="outline" className="text-muted-foreground">Архів</Badge>
            )}
          </div>
          <span className="text-xs font-normal text-muted-foreground shrink-0">
            {formatDate(a.created_at)}
          </span>
        </div>
        <h3 className={`text-sm font-semibold text-foreground mb-2 ${clickable ? "group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" : ""}`}>
          {a.title || "Без назви"}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 break-words whitespace-pre-wrap">
          {a.body}
        </p>
      </div>
    </Card>
  );
};

export default AnnouncementCard;