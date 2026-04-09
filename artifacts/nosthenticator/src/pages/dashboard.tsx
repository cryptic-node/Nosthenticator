import { useState } from "react";
import { useGetAllCodes, useToggleFavorite, getGetAllCodesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Star, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

interface LiveCode {
  credentialId: string;
  label: string;
  issuer: string;
  code: string;
  timeRemaining: number;
  period: number;
  digits: number;
  favorite: boolean;
}

function CountdownRing({ timeRemaining, period }: { timeRemaining: number; period: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = timeRemaining / period;
  const strokeDashoffset = circumference * (1 - progress);
  const isLow = timeRemaining <= 5;

  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke={isLow ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s ease" }}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums ${isLow ? "text-destructive" : "text-muted-foreground"}`}
      >
        {timeRemaining}s
      </span>
    </div>
  );
}

function CodeCard({ code, onToggleFavorite }: { code: LiveCode; onToggleFavorite: (id: string) => void }) {
  const formatted = code.digits === 6
    ? `${code.code.slice(0, 3)} ${code.code.slice(3)}`
    : code.code;

  return (
    <div
      className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
      data-testid={`code-card-${code.credentialId}`}
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-sm">
        {(code.issuer || code.label).slice(0, 2).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-sm truncate text-foreground">{code.label}</span>
          {code.favorite && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Favorite</Badge>
          )}
        </div>
        <div
          className="font-mono text-xl font-bold tracking-widest text-primary tabular-nums"
          data-testid={`code-value-${code.credentialId}`}
          aria-label={`Code: ${formatted}`}
        >
          {formatted}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <CountdownRing timeRemaining={code.timeRemaining} period={code.period} />
        <button
          onClick={() => onToggleFavorite(code.credentialId)}
          className="p-1 rounded-md hover:bg-muted transition-colors"
          aria-label={code.favorite ? "Remove from favorites" : "Add to favorites"}
          data-testid={`favorite-btn-${code.credentialId}`}
        >
          <Star
            className={`h-4 w-4 transition-colors ${code.favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
          />
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const toggleFavorite = useToggleFavorite();

  const { data: codes, isLoading, isRefetching } = useGetAllCodes({
    query: {
      queryKey: getGetAllCodesQueryKey(),
      refetchInterval: 5000,
    },
  });

  const allCodes = (codes as LiveCode[] | undefined) ?? [];

  const filtered = allCodes.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.label.toLowerCase().includes(q) || c.issuer.toLowerCase().includes(q);
  });

  const favorites = filtered.filter((c) => c.favorite);
  const others = filtered.filter((c) => !c.favorite);

  const handleToggleFavorite = (id: string) => {
    toggleFavorite.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAllCodesQueryKey() });
        },
      }
    );
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Codes</h1>
          <p className="text-sm text-muted-foreground">
            {allCodes.length} account{allCodes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isRefetching && (
            <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
          )}
          <Button
            size="sm"
            onClick={() => navigate("/add")}
            data-testid="add-account-btn"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search accounts..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="search-input"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : allCodes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-4xl mb-4">🔐</div>
          <p className="text-sm font-medium">No accounts yet</p>
          <p className="text-xs mt-1">Add your first authenticator account to get started.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => navigate("/add")}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add account
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No accounts match your search.
        </div>
      ) : (
        <div className="space-y-6">
          {favorites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Favorites
              </p>
              {favorites.map((code) => (
                <CodeCard key={code.credentialId} code={code} onToggleFavorite={handleToggleFavorite} />
              ))}
            </div>
          )}

          {others.length > 0 && (
            <div className="space-y-2">
              {favorites.length > 0 && (
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  All accounts
                </p>
              )}
              {others.map((code) => (
                <CodeCard key={code.credentialId} code={code} onToggleFavorite={handleToggleFavorite} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
