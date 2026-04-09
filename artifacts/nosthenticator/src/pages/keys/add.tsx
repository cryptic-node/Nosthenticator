import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateKey, getListKeysQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, KeyRound } from "lucide-react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  label: z.string().min(2, "Label must be at least 2 characters").max(50),
  npub: z.string().startsWith("npub1", "Must be a valid npub string starting with npub1").length(63, "npub must be exactly 63 characters long"),
});

type FormValues = z.infer<typeof formSchema>;

export default function KeyAdd() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createKey = useCreateKey();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: "",
      npub: "",
    },
  });

  function onSubmit(values: FormValues) {
    createKey.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListKeysQueryKey() });
          toast({
            title: "Identity Registered",
            description: "The npub has been successfully added to the device.",
          });
          setLocation("/keys");
        },
        onError: (error: any) => {
          toast({
            title: "Registration Failed",
            description: error.message || "Failed to register key",
            variant: "destructive",
          });
        },
      }
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-mono">
      <div className="flex items-center gap-4">
        <Link href="/keys">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Register New Identity</h1>
          <p className="text-sm text-muted-foreground">Add an npub to authorize signing requests.</p>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5 text-primary" />
            Identity Details
          </CardTitle>
          <CardDescription>
            This device will act as the hardware signer for this npub. Ensure you control the private key corresponding to this public key elsewhere to perform initial authorization if required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Main Identity, Burner, Work"
                        className="font-mono bg-background"
                        data-testid="input-key-label"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A human-readable name to identify this key in the dashboard.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="npub"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Npub</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="npub1..."
                        className="font-mono text-sm bg-background"
                        data-testid="input-key-npub"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The public key string starting with 'npub1'.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <Link href="/keys">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={createKey.isPending}
                  data-testid="button-submit-key"
                  className="font-bold tracking-widest"
                >
                  {createKey.isPending ? "REGISTERING..." : "REGISTER IDENTITY"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
