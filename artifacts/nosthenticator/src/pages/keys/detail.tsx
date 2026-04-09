import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { ChevronLeft, Trash2, Shield, Hash, Clock, Server, CheckCircle, XCircle } from "lucide-react";
import { 
  useGetKey, 
  getGetKeyQueryKey,
  useDeleteKey, 
  useGetAuditLog,
  getGetAuditLogQueryKey,
  getListKeysQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function KeyDetail() {
  const [, params] = useRoute("/keys/:id");
  const id = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: key, isLoading: keyLoading } = useGetKey(id || "", {
    query: {
      enabled: !!id,
      queryKey: getGetKeyQueryKey(id || ""),
    }
  });

  const { data: auditLog, isLoading: logLoading } = useGetAuditLog({ keyId: id }, {
    query: {
      enabled: !!id,
      queryKey: getGetAuditLogQueryKey({ keyId: id }),
    }
  });

  const deleteKey = useDeleteKey();

  const handleDelete = () => {
    if (!id) return;
    deleteKey.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListKeysQueryKey() });
        toast({
          title: "Identity Removed",
          description: "The npub has been deleted from the device.",
        });
        setLocation("/keys");
      },
      onError: (error: any) => {
        toast({
          title: "Deletion Failed",
          description: error.message || "Failed to remove key",
          variant: "destructive"
        });
      }
    });
  };

  if (keyLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!key) {
    return <div>Identity not found.</div>;
  }

  return (
    <div className="space-y-6 font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/keys">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{key.label}</h1>
            <p className="text-sm text-muted-foreground break-all max-w-xl">
              {key.npub}
            </p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2" data-testid="button-delete-key">
              <Trash2 className="h-4 w-4" />
              Remove Key
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will remove the npub and its audit history from this device.
                Any pending signing requests for this identity will become invalid.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete">
                Yes, remove identity
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Total Signatures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-key-signing-count">{key.signingCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Last Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-medium" data-testid="text-key-last-used">
              {key.lastUsedAt ? format(new Date(key.lastUsedAt), "PPp") : "Never"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Added On
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-medium" data-testid="text-key-created-at">
              {format(new Date(key.createdAt), "PPp")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit History</CardTitle>
          <CardDescription>Append-only log of all operations authorized by this key.</CardDescription>
        </CardHeader>
        <CardContent>
          {logLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : auditLog?.entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-md">
              No signing activity recorded for this identity yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Transport</TableHead>
                  <TableHead>Client Fingerprint</TableHead>
                  <TableHead className="text-right">Integrity Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLog?.entries.map((entry) => (
                  <TableRow key={entry.id} data-testid={`row-audit-${entry.id}`}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(entry.timestamp), "MMM d, HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      {entry.action === "approved" ? (
                        <Badge variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {entry.eventKind}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Server className="w-3 h-3 text-muted-foreground" />
                        <span className="capitalize">{entry.transport}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground truncate max-w-[150px] inline-block">
                        {entry.clientFingerprint}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs text-muted-foreground" title={entry.hash}>
                        {entry.hash.substring(0, 8)}...
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
