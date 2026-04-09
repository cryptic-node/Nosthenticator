import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Trash2, 
  Star, 
  StarOff,
  Edit2,
  Check,
  X
} from "lucide-react";
import { 
  useGetCredential, 
  getGetCredentialQueryKey,
  useDeleteCredential,
  useToggleFavorite,
  useUpdateCredential,
  useGetCode,
  getGetCodeQueryKey,
  getListCredentialsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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

function formatCode(code: string) {
  if (code.length === 6) return `${code.slice(0, 3)} ${code.slice(3)}`;
  if (code.length === 8) return `${code.slice(0, 4)} ${code.slice(4)}`;
  return code;
}

export default function CredentialDetail() {
  const [, params] = useRoute("/credential/:id");
  const id = params?.id || "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cred, isLoading: isLoadingCred } = useGetCredential(id, {
    query: { enabled: !!id, queryKey: getGetCredentialQueryKey(id) }
  });

  const { data: liveCode } = useGetCode(id, {
    query: { 
      enabled: !!id && cred?.type === "totp", 
      queryKey: getGetCodeQueryKey(id),
      refetchInterval: 1000
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState("");
  
  useEffect(() => {
    if (cred && !isEditing) {
      setEditLabel(cred.label);
    }
  }, [cred, isEditing]);

  const toggleFavorite = useToggleFavorite();
  const deleteCred = useDeleteCredential();
  const updateCred = useUpdateCredential();

  const handleFavorite = () => {
    toggleFavorite.mutate({ id }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetCredentialQueryKey(id), data);
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
      }
    });
  };

  const handleDelete = () => {
    deleteCred.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Deleted successfully" });
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        setLocation(cred?.type === "nostr" ? "/nostr" : "/");
      }
    });
  };

  const handleSaveLabel = () => {
    updateCred.mutate(
      { id, data: { label: editLabel } },
      {
        onSuccess: (data) => {
          setIsEditing(false);
          queryClient.setQueryData(getGetCredentialQueryKey(id), data);
          queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        }
      }
    );
  };

  if (isLoadingCred) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!cred) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Credential not found.</p>
        <Button variant="link" onClick={() => setLocation("/")}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={() => setLocation(cred.type === "nostr" ? "/nostr" : "/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`rounded-full ${cred.favorite ? "text-accent hover:text-accent" : "text-muted-foreground"}`}
              onClick={handleFavorite}
              data-testid="btn-toggle-favorite"
            >
              {cred.favorite ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive" data-testid="btn-delete">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this credential?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. You will lose access to this account if you don't have the backup codes or secret saved elsewhere.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center text-3xl font-bold mb-4 shadow-sm">
            {cred.issuer.charAt(0).toUpperCase()}
          </div>
          
          {isEditing ? (
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
              <Input 
                value={editLabel} 
                onChange={(e) => setEditLabel(e.target.value)} 
                className="text-center text-lg font-semibold h-10"
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={handleSaveLabel} className="text-green-500 shrink-0 h-10 w-10">
                <Check className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => { setIsEditing(false); setEditLabel(cred.label); }} className="text-red-500 shrink-0 h-10 w-10">
                <X className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 group">
              <h1 className="text-2xl font-bold tracking-tight">{cred.label}</h1>
              <Button variant="ghost" size="icon" className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-3 h-3" />
              </Button>
            </div>
          )}
          <p className="text-muted-foreground">{cred.accountName}</p>
        </div>

        {cred.type === "totp" && liveCode && (
          <Card className="border-2 border-primary/20 bg-primary/5 shadow-sm">
            <CardContent className="p-8 flex flex-col items-center justify-center">
              <div className="text-5xl font-mono tracking-widest font-bold text-primary mb-6" data-testid="live-code">
                {formatCode(liveCode.code)}
              </div>
              <div className="w-full max-w-[200px] h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-linear ${liveCode.timeRemaining <= 5 ? 'bg-destructive' : 'bg-primary'}`}
                  style={{ width: `${(liveCode.timeRemaining / liveCode.period) * 100}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-3 font-medium">
                Refreshes in {liveCode.timeRemaining}s
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground px-1 uppercase tracking-wider">Details</h3>
          <div className="rounded-xl border bg-card divide-y shadow-sm text-sm">
            <div className="flex justify-between p-4">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium uppercase">{cred.type}</span>
            </div>
            {cred.type === "nostr" ? (
              <>
                <div className="flex flex-col gap-1 p-4">
                  <span className="text-muted-foreground">Public Key (npub)</span>
                  <span className="font-mono text-xs break-all leading-relaxed">{cred.npub || "Not provided"}</span>
                </div>
                <div className="flex justify-between p-4">
                  <span className="text-muted-foreground">Secret Mode</span>
                  <span className="font-medium">{cred.secretMode}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between p-4">
                  <span className="text-muted-foreground">Algorithm</span>
                  <span className="font-medium">{cred.algorithm}</span>
                </div>
                <div className="flex justify-between p-4">
                  <span className="text-muted-foreground">Digits</span>
                  <span className="font-medium">{cred.digits}</span>
                </div>
                <div className="flex justify-between p-4">
                  <span className="text-muted-foreground">Period</span>
                  <span className="font-medium">{cred.period}s</span>
                </div>
              </>
            )}
            <div className="flex justify-between p-4">
              <span className="text-muted-foreground">Added</span>
              <span className="font-medium">{format(new Date(cred.createdAt), "PP")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
