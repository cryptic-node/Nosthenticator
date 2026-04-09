import { useListCredentials, useListNostrRequests, useApproveNostrRequest, useRejectNostrRequest, getListNostrRequestsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, Check, X, ShieldAlert, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const ACTION_TYPE_LABELS: Record<string, string> = {
  sign_in: "Sign in",
  authorize_action: "Authorize action",
  link_device: "Link device",
  recovery: "Account recovery",
  key_rotation: "Rotate keys",
};

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
};

export default function NostrPage() {
  const { data: credentials, isLoading: isLoadingCreds } = useListCredentials({ type: "nostr" });
  const { data: requests, isLoading: isLoadingReqs } = useListNostrRequests({ status: "pending" });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const approveReq = useApproveNostrRequest();
  const rejectReq = useRejectNostrRequest();

  const handleApprove = (id: string) => {
    approveReq.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Request approved" });
        queryClient.invalidateQueries({ queryKey: getListNostrRequestsQueryKey({ status: "pending" }) });
      }
    });
  };

  const handleReject = (id: string) => {
    rejectReq.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Request rejected" });
        queryClient.invalidateQueries({ queryKey: getListNostrRequestsQueryKey({ status: "pending" }) });
      }
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 pb-2">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Nostr Identities</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Pending Approvals
            </h2>
            {isLoadingReqs ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            ) : requests?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-secondary/30 rounded-xl border border-dashed">
                No pending requests.
              </div>
            ) : (
              <div className="space-y-4">
                {requests?.map((req) => (
                  <div key={req.id} className="p-4 rounded-xl border bg-card shadow-sm" data-testid={`request-card-${req.id}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{req.requesterName}</h3>
                        <p className="text-sm text-muted-foreground">{req.requesterOrigin}</p>
                      </div>
                      <Badge variant="outline" className={cn("capitalize", RISK_COLORS[req.riskLevel])}>
                        {req.riskLevel} Risk
                      </Badge>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium">Action: {ACTION_TYPE_LABELS[req.actionType] || req.actionType}</p>
                      <p className="text-sm text-muted-foreground mt-1">{req.actionSummary}</p>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleReject(req.id)}
                        disabled={rejectReq.isPending || approveReq.isPending}
                        data-testid={`btn-reject-${req.id}`}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button 
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => handleApprove(req.id)}
                        disabled={rejectReq.isPending || approveReq.isPending}
                        data-testid={`btn-approve-${req.id}`}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Identities
            </h2>
            {isLoadingCreds ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : credentials?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-secondary/30 rounded-xl border border-dashed">
                <p>No Nostr identities found.</p>
                <Link href="/add" className="text-primary hover:underline mt-2 inline-block">Add an identity</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {credentials?.map((cred) => (
                  <Link key={cred.id} href={`/credential/${cred.id}`}>
                    <div className="p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors cursor-pointer flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <KeyRound className="w-5 h-5 text-foreground/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{cred.label}</h3>
                        <p className="text-sm text-muted-foreground truncate">{cred.npub?.substring(0, 12)}...{cred.npub?.slice(-4)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
