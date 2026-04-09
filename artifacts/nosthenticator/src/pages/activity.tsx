import { useGetActivity } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Activity, Key, Shield, Download, Upload, CheckCircle2, XCircle, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const EVENT_ICONS: Record<string, React.ElementType> = {
  auth_approved: CheckCircle2,
  auth_rejected: XCircle,
  code_viewed: Eye,
  export: Download,
  import: Upload,
  credential_added: Key,
  credential_deleted: Key,
  nostr_approved: CheckCircle2,
  nostr_rejected: XCircle,
};

const EVENT_COLORS: Record<string, string> = {
  auth_approved: "text-green-500 bg-green-500/10",
  auth_rejected: "text-red-500 bg-red-500/10",
  code_viewed: "text-blue-500 bg-blue-500/10",
  export: "text-purple-500 bg-purple-500/10",
  import: "text-indigo-500 bg-indigo-500/10",
  credential_added: "text-primary bg-primary/10",
  credential_deleted: "text-muted-foreground bg-muted",
  nostr_approved: "text-green-500 bg-green-500/10",
  nostr_rejected: "text-red-500 bg-red-500/10",
};

export default function ActivityPage() {
  const { data, isLoading } = useGetActivity({ limit: 50 });

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Activity Log</h1>
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 items-start">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p>No recent activity.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-5 top-4 bottom-4 w-px bg-border -z-10"></div>
            <div className="space-y-6">
              {data?.entries.map((entry) => {
                const Icon = EVENT_ICONS[entry.eventType] || Activity;
                const colorClass = EVENT_COLORS[entry.eventType] || "text-foreground bg-secondary";
                
                return (
                  <div key={entry.id} className="flex gap-4 items-start" data-testid={`activity-${entry.id}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 pt-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {entry.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{format(new Date(entry.timestamp), "MMM d, h:mm a")}</span>
                        {entry.credentialLabel && (
                          <>
                            <span>•</span>
                            <span className="truncate">{entry.credentialLabel}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
