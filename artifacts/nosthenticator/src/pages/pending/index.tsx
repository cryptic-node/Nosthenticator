import { format } from "date-fns";
import { Check, X, ShieldAlert, Hexagon, Copy, KeySquare } from "lucide-react";
import { 
  useListPendingRequests, 
  useApproveSigningRequest, 
  useRejectSigningRequest,
  getListPendingRequestsQueryKey,
  getGetStatsSummaryQueryKey,
  getGetActivityTimelineQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function PendingList() {
  const { data: requests, isLoading } = useListPendingRequests();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const approveReq = useApproveSigningRequest();
  const rejectReq = useRejectSigningRequest();

  const handleApprove = (id: string) => {
    approveReq.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Request Approved", description: "The event has been signed." });
        invalidateQueries();
      },
      onError: (err: any) => {
        toast({ title: "Approval Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleReject = (id: string) => {
    rejectReq.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Request Rejected", description: "The signing request was rejected." });
        invalidateQueries();
      },
      onError: (err: any) => {
        toast({ title: "Rejection Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: getListPendingRequestsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetActivityTimelineQueryKey() });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard", description: "Hex data copied to clipboard" });
  };

  return (
    <div className="space-y-6 font-mono">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-accent flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" />
            Pending Authorizations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Review and cryptographically sign these incoming Nostr events.
          </p>
        </div>
        <Badge variant="outline" className="text-lg py-1 px-3">
          {requests?.length || 0} AWAITING
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : requests?.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-muted/20">
          <Check className="h-16 w-16 text-primary mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-muted-foreground mb-2">Zero Pending Requests</h3>
          <p className="text-sm text-muted-foreground">All queues are clear. Your identities are secure.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {requests?.map((req) => (
            <Card key={req.id} className="border-accent/50 shadow-[0_0_15px_rgba(250,204,21,0.1)]" data-testid={`card-pending-${req.id}`}>
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <KeySquare className="h-5 w-5 text-accent" />
                      Sign Request: Kind {req.eventKind}
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      Target Identity: {req.npub.substring(0, 12)}...{req.npub.substring(req.npub.length - 12)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary" className="capitalize">{req.transport} transport</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(req.createdAt), "HH:mm:ss")}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
                        <Hexagon className="h-4 w-4" />
                        Raw Event Hex Dump
                      </h4>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => copyToClipboard(req.eventHex)}>
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <div className="bg-background rounded-md p-4 text-xs font-mono text-muted-foreground border border-border overflow-x-auto break-all max-h-40 overflow-y-auto">
                      {req.eventHex.match(/.{1,32}/g)?.join('\n') || req.eventHex}
                    </div>
                  </div>
                  
                  <div className="text-xs bg-muted/50 p-2 rounded-sm flex justify-between">
                    <span className="text-muted-foreground">Client Fingerprint:</span>
                    <span className="font-bold">{req.clientFingerprint}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 border-t border-border/50 pt-4 flex gap-4 justify-end">
                <Button
                  variant="destructive"
                  className="flex-1 max-w-xs font-bold tracking-widest"
                  onClick={() => handleReject(req.id)}
                  disabled={rejectReq.isPending || approveReq.isPending}
                  data-testid={`button-reject-${req.id}`}
                >
                  <X className="h-4 w-4 mr-2" />
                  REJECT
                </Button>
                <Button
                  className="flex-1 max-w-xs bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-widest"
                  onClick={() => handleApprove(req.id)}
                  disabled={rejectReq.isPending || approveReq.isPending}
                  data-testid={`button-approve-${req.id}`}
                >
                  <Check className="h-4 w-4 mr-2" />
                  APPROVE & SIGN
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
