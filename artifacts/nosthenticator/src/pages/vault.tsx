import { useState } from "react";
import { useGetVaultStats, useExportVault, useImportVault, getGetVaultStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, Download, Upload, Shield, KeyRound, Database, FileJson } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function VaultPage() {
  const { data: stats, isLoading } = useGetVaultStats();
  const exportVault = useExportVault();
  const importVault = useImportVault();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [importData, setImportData] = useState("");
  const [password, setPassword] = useState("");

  const handleExport = () => {
    exportVault.mutate(
      { data: { includeSecrets: true, password: password || undefined } },
      {
        onSuccess: (bundle) => {
          const blob = new Blob([JSON.stringify(bundle)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `nosthenticator-backup-${new Date().toISOString().split("T")[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast({ title: "Vault exported successfully" });
        },
        onError: () => {
          toast({ title: "Export failed", variant: "destructive" });
        }
      }
    );
  };

  const handleImport = () => {
    if (!importData) return;
    try {
      let parsedData = importData;
      if (importData.trim().startsWith("{")) {
        const parsed = JSON.parse(importData);
        if (parsed.data) {
          parsedData = parsed.data;
        }
      }
      
      importVault.mutate(
        { data: { data: parsedData, password: password || undefined } },
        {
          onSuccess: (res) => {
            toast({ 
              title: "Import successful", 
              description: `Imported ${res.imported} items. Skipped ${res.skipped}.` 
            });
            setImportData("");
            queryClient.invalidateQueries({ queryKey: getGetVaultStatsQueryKey() });
          },
          onError: () => {
            toast({ title: "Import failed", description: "Invalid backup data or password", variant: "destructive" });
          }
        }
      );
    } catch (e) {
      toast({ title: "Invalid format", description: "Could not parse backup data", variant: "destructive" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setImportData(event.target.result);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 pb-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Security Vault</h1>
          <p className="text-muted-foreground text-sm">Manage your encrypted backup data and view overall statistics.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                <KeyRound className="w-5 h-5 text-primary" />
              </div>
              {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{stats?.totpCount || 0}</div>}
              <div className="text-xs text-muted-foreground font-medium">OTP Codes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-1">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{stats?.nostrCount || 0}</div>}
              <div className="text-xs text-muted-foreground font-medium">Nostr Identities</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="w-5 h-5" />
            Backup & Restore
          </h2>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Export Vault</CardTitle>
              <CardDescription>Download an encrypted backup of all your accounts and identities.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Encryption Password (Optional)</label>
                <Input 
                  type="password" 
                  placeholder="Leave empty for unencrypted backup" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-export-password"
                />
              </div>
              <Button 
                className="w-full gap-2" 
                onClick={handleExport}
                disabled={exportVault.isPending}
                data-testid="btn-export"
              >
                <Download className="w-4 h-4" />
                Download Backup JSON
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Import Vault</CardTitle>
              <CardDescription>Restore accounts from a previous backup file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Backup File</label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="file" 
                    accept=".json"
                    onChange={handleFileUpload}
                    className="cursor-pointer file:bg-secondary file:text-foreground file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-2"
                    data-testid="input-import-file"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Decryption Password (if required)</label>
                <Input 
                  type="password" 
                  placeholder="Enter password used during export" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-import-password"
                />
              </div>
              <Button 
                variant="outline"
                className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/10" 
                onClick={handleImport}
                disabled={!importData || importVault.isPending}
                data-testid="btn-import"
              >
                <Upload className="w-4 h-4" />
                Restore from Backup
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
