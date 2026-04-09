import { Link } from "wouter";
import { Plus, KeyRound, Clock, Hash } from "lucide-react";
import { format } from "date-fns";
import { useListKeys } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function KeysList() {
  const { data: keys, isLoading } = useListKeys();

  return (
    <div className="space-y-6 font-mono">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registered Identities</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your controlled npubs and view usage statistics.
          </p>
        </div>
        <Link href="/keys/add">
          <Button data-testid="button-add-key" className="gap-2 font-bold tracking-wider">
            <Plus className="h-4 w-4" />
            REGISTER NPUB
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : keys?.length === 0 ? (
        <Card className="border-dashed bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <KeyRound className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No identities registered</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Register an npub to start receiving and authorizing signing requests from Nostr clients.
            </p>
            <Link href="/keys/add">
              <Button variant="outline" data-testid="button-empty-add-key">
                Initialize First Key
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {keys?.map((key) => (
            <Link key={key.id} href={`/keys/${key.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer group" data-testid={`card-key-${key.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors">
                        {key.label}
                      </CardTitle>
                      <CardDescription className="mt-1 font-mono text-xs truncate max-w-[200px]">
                        {key.npub.substring(0, 12)}...{key.npub.substring(key.npub.length - 12)}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="font-mono tabular-nums">
                      {key.signingCount} SIGS
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>
                        Last used:{" "}
                        {key.lastUsedAt
                          ? format(new Date(key.lastUsedAt), "PPp")
                          : "Never"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-3 w-3" />
                      <span>
                        Added: {format(new Date(key.createdAt), "PP")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
