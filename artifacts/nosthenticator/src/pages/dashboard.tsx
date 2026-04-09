import { useGetStatsSummary, useGetActivityTimeline } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Key, CheckCircle, ShieldAlert } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStatsSummary();
  const { data: timeline, isLoading: timelineLoading } = useGetActivityTimeline();

  return (
    <div className="space-y-8 font-mono">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-2">Hardware-grade Nostr identity controller.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Keys"
          value={stats?.totalKeys}
          icon={Key}
          loading={statsLoading}
        />
        <StatCard
          title="Pending Requests"
          value={stats?.pendingCount}
          icon={ShieldAlert}
          loading={statsLoading}
          valueClassName={stats?.pendingCount ? "text-accent" : ""}
        />
        <StatCard
          title="Total Signatures"
          value={stats?.totalSigned}
          icon={CheckCircle}
          loading={statsLoading}
        />
        <StatCard
          title="Today's Activity"
          value={stats?.todaySigned}
          icon={Activity}
          loading={statsLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Signature Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {timelineLoading ? (
              <Skeleton className="w-full h-full" />
            ) : timeline && timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline}>
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border p-2 rounded-sm shadow-md font-mono text-sm">
                            <div className="text-muted-foreground mb-1">{payload[0].payload.date}</div>
                            <div className="text-primary">Approved: {payload[0].value}</div>
                            {payload[1] && <div className="text-destructive">Rejected: {payload[1].value}</div>}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="step"
                    dataKey="approved"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="step"
                    dataKey="rejected"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-sm">
                No activity data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  loading,
  valueClassName
}: { 
  title: string; 
  value?: number; 
  icon: React.ElementType; 
  loading?: boolean;
  valueClassName?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className={`text-2xl font-bold ${valueClassName || ""}`} data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value !== undefined ? value : "-"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
