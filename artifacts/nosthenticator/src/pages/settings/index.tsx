import { useHealthCheck } from "@workspace/api-client-react";
import { Server, Shield, Radio, Code, Info, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const { data: health, isLoading } = useHealthCheck();

  return (
    <div className="space-y-8 font-mono max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings & Information</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Nosthenticator device configuration and security model documentation.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              Daemon Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-md border border-border">
              <div className="space-y-1">
                <div className="font-bold text-sm">API Connection</div>
                <div className="text-xs text-muted-foreground">Checking local RPC interface</div>
              </div>
              <div>
                {isLoading ? (
                  <Badge variant="outline" className="animate-pulse">Checking...</Badge>
                ) : health?.status === "ok" ? (
                  <Badge className="bg-primary hover:bg-primary/90">ONLINE</Badge>
                ) : (
                  <Badge variant="destructive">OFFLINE</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5" />
              Supported Transports
            </CardTitle>
            <CardDescription>How this device receives signing requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border border-border rounded-md space-y-2">
                <div className="font-bold text-sm flex items-center justify-between">
                  Local RPC
                  <Badge variant="secondary">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Direct HTTP API requests from localhost. Highest security, requires physical access to device.</p>
              </div>
              <div className="p-4 border border-border rounded-md space-y-2">
                <div className="font-bold text-sm flex items-center justify-between">
                  WebSocket (NIP-46)
                  <Badge variant="outline">Standby</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Remote signing via relays. Convenient but requires careful authorization review.</p>
              </div>
              <div className="p-4 border border-border rounded-md space-y-2 md:col-span-2">
                <div className="font-bold text-sm flex items-center justify-between">
                  Air-gapped QR
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Optical transmission of unsigned and signed events via animated QR codes. Maximum security.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              Security Model
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <div className="space-y-2">
              <h3 className="font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-accent" />
                Never Expose Private Keys
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Nosthenticator is designed to hold private keys in secure storage and never transmit them. The companion app only ever sends the raw event hex to be signed, and receives the resulting signature. 
              </p>
            </div>
            
            <Separator />

            <div className="space-y-2">
              <h3 className="font-bold flex items-center gap-2">
                <Code className="w-4 h-4" />
                Audit Log Immutability
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                The audit log is an append-only structure. Each entry contains a cryptographic hash of its own contents combined with the hash of the preceding entry. This forms a sequential chain that makes tampering or deleting historical signing events mathematically evident.
              </p>
            </div>

            <Separator />
            
            <div className="bg-muted/50 p-4 rounded-md text-xs text-muted-foreground flex gap-3">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                This software is intended to run on a dedicated, isolated machine (like a Raspberry Pi) on a trusted local network. Do not expose this dashboard to the public internet.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
