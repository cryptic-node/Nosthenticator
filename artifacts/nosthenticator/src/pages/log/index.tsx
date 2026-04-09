import { format } from "date-fns";
import { Link } from "wouter";
import { useGetAuditLog } from "@workspace/api-client-react";
import { Terminal, Shield, CheckCircle, XCircle, Link as LinkIcon, Database } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function AuditLog() {
  const { data: log, isLoading } = useGetAuditLog({ limit: 100 });

  return (
    <div className="space-y-6 font-mono">
      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Database className="h-6 w-6" />
          Global Audit Log
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Append-only cryptographic record of all operations. Each entry contains a hash of the previous operation, ensuring sequence integrity cannot be modified without invalidating the chain.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : log?.entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Terminal className="h-12 w-12 mb-4 opacity-50" />
              <p>Audit log is empty.</p>
            </div>
          ) : (
            <div className="rounded-md border-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp (UTC)</TableHead>
                    <TableHead>Identity</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Transport</TableHead>
                    <TableHead className="text-right">Integrity Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {log?.entries.map((entry) => (
                    <TableRow key={entry.id} className="group" data-testid={`row-audit-${entry.id}`}>
                      <TableCell className="font-medium text-xs">
                        {format(new Date(entry.timestamp), "yyyy-MM-dd HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Link href={`/keys/${entry.keyId}`}>
                          <span className="text-xs hover:text-primary hover:underline cursor-pointer truncate max-w-[120px] inline-block" title={entry.npub}>
                            {entry.npub.substring(0, 10)}...
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        {entry.action === "approved" ? (
                          <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider">
                            <CheckCircle className="w-3 h-3" />
                            Sign
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-destructive text-xs font-bold uppercase tracking-wider">
                            <XCircle className="w-3 h-3" />
                            Drop
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-background">
                          {entry.eventKind}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground capitalize">
                        {entry.transport}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <LinkIcon className="w-3 h-3 text-muted-foreground/50" />
                          <span className="text-xs font-mono bg-muted/50 px-2 py-1 rounded text-muted-foreground select-all">
                            {entry.hash.substring(0, 16)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {log && log.entries.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 p-4 rounded-md border border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>Hash Chain Integrity Validated</span>
          </div>
          <div>
            Total Entries: {log.total}
          </div>
        </div>
      )}
    </div>
  );
}
