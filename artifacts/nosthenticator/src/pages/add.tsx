import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, KeyRound, ArrowLeft } from "lucide-react";
import { useCreateCredential, getListCredentialsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const totpSchema = z.object({
  issuer: z.string().min(1, "Issuer is required"),
  accountName: z.string().min(1, "Account name is required"),
  secret: z.string().min(16, "A valid base32 secret is required"),
  algorithm: z.enum(["SHA1", "SHA256", "SHA512"]).default("SHA1"),
  digits: z.number().int().min(6).max(8).default(6),
  period: z.number().int().min(15).max(120).default(30),
});

const nostrSchema = z.object({
  label: z.string().min(1, "Label is required"),
  npub: z.string().startsWith("npub1", "Must be a valid npub string starting with npub1").length(63, "npub must be exactly 63 characters long").optional().or(z.literal("")),
  secret: z.string().startsWith("nsec1", "Must be a valid nsec string starting with nsec1").length(63, "nsec must be exactly 63 characters long").optional().or(z.literal("")),
  secretMode: z.enum(["none", "auth-only", "full-signer"]).default("auth-only"),
}).refine(data => data.npub || data.secret, {
  message: "Either npub or nsec must be provided",
  path: ["npub"],
});

export default function AddPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createCredential = useCreateCredential();
  const [activeTab, setActiveTab] = useState<"totp" | "nostr">("totp");

  const totpForm = useForm<z.infer<typeof totpSchema>>({
    resolver: zodResolver(totpSchema),
    defaultValues: {
      issuer: "",
      accountName: "",
      secret: "",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    },
  });

  const nostrForm = useForm<z.infer<typeof nostrSchema>>({
    resolver: zodResolver(nostrSchema),
    defaultValues: {
      label: "",
      npub: "",
      secret: "",
      secretMode: "auth-only",
    },
  });

  const onTotpSubmit = (values: z.infer<typeof totpSchema>) => {
    createCredential.mutate(
      {
        data: {
          type: "totp",
          issuer: values.issuer,
          accountName: values.accountName,
          label: `${values.issuer} (${values.accountName})`,
          secret: values.secret,
          algorithm: values.algorithm,
          digits: values.digits,
          period: values.period,
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
          toast({ title: "Account added" });
          setLocation("/");
        },
        onError: (err: any) => toast({ title: "Failed to add account", description: err.message, variant: "destructive" })
      }
    );
  };

  const onNostrSubmit = (values: z.infer<typeof nostrSchema>) => {
    createCredential.mutate(
      {
        data: {
          type: "nostr",
          issuer: "Nostr",
          accountName: values.label,
          label: values.label,
          npub: values.npub || null,
          secret: values.secret || null,
          secretMode: values.secretMode,
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
          toast({ title: "Identity added" });
          setLocation("/nostr");
        },
        onError: (err: any) => toast({ title: "Failed to add identity", description: err.message, variant: "destructive" })
      }
    );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Add Credential</h1>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary/50">
            <TabsTrigger value="totp" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
              Authenticator
            </TabsTrigger>
            <TabsTrigger value="nostr" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
              Nostr Identity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="totp" className="mt-0">
            <Form {...totpForm}>
              <form onSubmit={totpForm.handleSubmit(onTotpSubmit)} className="space-y-5">
                <div className="p-5 rounded-xl border bg-card space-y-4 shadow-sm">
                  <FormField control={totpForm.control} name="issuer" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service / Issuer</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. GitHub, Google, Twitter" {...field} data-testid="input-totp-issuer" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={totpForm.control} name="accountName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. user@example.com" {...field} data-testid="input-totp-account" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={totpForm.control} name="secret" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secret Key</FormLabel>
                      <FormControl>
                        <Input placeholder="Base32 secret from the setup screen" className="font-mono text-sm" {...field} data-testid="input-totp-secret" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <Button type="submit" className="w-full h-12 text-base font-medium rounded-xl" disabled={createCredential.isPending} data-testid="btn-submit-totp">
                  Add Account
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="nostr" className="mt-0">
            <Form {...nostrForm}>
              <form onSubmit={nostrForm.handleSubmit(onNostrSubmit)} className="space-y-5">
                <div className="p-5 rounded-xl border bg-card space-y-5 shadow-sm">
                  <FormField control={nostrForm.control} name="label" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identity Label</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Main Account, Burner" {...field} data-testid="input-nostr-label" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="space-y-3">
                    <FormField control={nostrForm.control} name="npub" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Public Key (npub)</FormLabel>
                        <FormControl>
                          <Input placeholder="npub1..." className="font-mono text-sm" {...field} data-testid="input-nostr-npub" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="text-center text-sm font-medium text-muted-foreground">— OR —</div>
                    <FormField control={nostrForm.control} name="secret" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Private Key (nsec)</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="nsec1..." className="font-mono text-sm" {...field} data-testid="input-nostr-nsec" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={nostrForm.control} name="secretMode" render={({ field }) => (
                    <FormItem className="space-y-3 pt-2">
                      <FormLabel>Security Policy</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                          data-testid="radio-nostr-mode"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 p-3 rounded-lg border cursor-pointer hover:bg-secondary/50">
                            <FormControl>
                              <RadioGroupItem value="none" />
                            </FormControl>
                            <div className="font-normal flex flex-col">
                              <span className="font-medium text-sm">Public Only</span>
                              <span className="text-xs text-muted-foreground">Watch-only. Cannot sign anything.</span>
                            </div>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 p-3 rounded-lg border cursor-pointer hover:bg-secondary/50">
                            <FormControl>
                              <RadioGroupItem value="auth-only" />
                            </FormControl>
                            <div className="font-normal flex flex-col">
                              <span className="font-medium text-sm">Auth Only</span>
                              <span className="text-xs text-muted-foreground">Can approve login requests.</span>
                            </div>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 p-3 rounded-lg border cursor-pointer hover:bg-secondary/50">
                            <FormControl>
                              <RadioGroupItem value="full-signer" />
                            </FormControl>
                            <div className="font-normal flex flex-col">
                              <span className="font-medium text-sm">Full Signer</span>
                              <span className="text-xs text-muted-foreground">Can sign notes and messages directly.</span>
                            </div>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <Button type="submit" className="w-full h-12 text-base font-medium rounded-xl" disabled={createCredential.isPending} data-testid="btn-submit-nostr">
                  Add Identity
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
