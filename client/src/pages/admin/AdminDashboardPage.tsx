import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BookOpen, Flag, MessageSquare, Swords, TrendingUp, Users } from "lucide-react";
import { adminApi } from "../../api/endpoints";
import { Seo } from "../../components/Seo";
import { Card, CardContent } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";

export default function AdminDashboardPage() {
  const query = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await adminApi.stats();
      return res.data.data.stats;
    },
    refetchInterval: 30 * 1000,
  });

  const stats = query.data;

  const cards = [
    { label: "Users", value: stats?.users, icon: Users, to: "/admin/users" },
    { label: "Lineups", value: stats?.lineups, sub: `${stats?.publishedLineups ?? 0} published`, icon: Swords, to: "/admin/lineups" },
    { label: "Comments", value: stats?.comments, icon: MessageSquare },
    { label: "Pending reports", value: stats?.pendingReports, icon: Flag, to: "/admin/reports", alert: (stats?.pendingReports ?? 0) > 0 },
    { label: "Open reports", value: stats?.openReports, icon: Flag, to: "/admin/reports" },
  ];

  return (
    <>
      <Seo title="Admin dashboard" noIndex />
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Admin dashboard</h1>
      <p className="mb-6 text-sm text-muted">Platform health at a glance.</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map(({ label, value, sub, icon: Icon, to, alert }) => {
          const inner = (
            <Card className={`card-hover h-full ${alert ? "border-danger/50" : ""}`}>
              <CardContent className="p-4">
                <Icon className={`mb-2 h-5 w-5 ${alert ? "text-danger" : "text-muted"}`} />
                {value === undefined ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-black">{value}</p>
                )}
                <p className="mt-0.5 text-xs text-muted">{sub ?? label}</p>
              </CardContent>
            </Card>
          );
          return to ? (
            <Link key={label} to={to}>{inner}</Link>
          ) : (
            <div key={label}>{inner}</div>
          );
        })}
      </div>

      {(stats?.pendingReports ?? 0) > 0 && (
        <div className="mt-6 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-rose-200">
          <Flag className="mr-2 inline h-4 w-4" />
          {stats?.pendingReports} report{stats?.pendingReports === 1 ? "" : "s"} waiting for
          review — <Link to="/admin/reports" className="underline">open the queue</Link>.
        </div>
      )}

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <TrendingUp className="h-4 w-4 text-accent" /> Quick actions
        </h2>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link to="/admin/game-data" className="rounded-lg border border-border px-3 py-1.5 hover:border-primary/50">
            <BookOpen className="mr-1 inline h-3.5 w-3.5" /> Manage game data
          </Link>
          <Link to="/admin/lineups" className="rounded-lg border border-border px-3 py-1.5 hover:border-primary/50">
            Moderate lineups
          </Link>
          <Link to="/admin/users" className="rounded-lg border border-border px-3 py-1.5 hover:border-primary/50">
            Manage users
          </Link>
        </div>
      </div>
    </>
  );
}
