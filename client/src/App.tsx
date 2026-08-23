import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";
import { RootLayout } from "./layouts/RootLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { ProtectedRoute, AdminRoute } from "./layouts/guards";
import { useInitAuth } from "./hooks/useAuth";

const HomePage = lazy(() => import("./pages/HomePage"));
const LineupsExplorerPage = lazy(() => import("./pages/LineupsExplorerPage"));
const LineupDetailPage = lazy(() => import("./pages/LineupDetailPage"));
const CreateLineupPage = lazy(() => import("./pages/CreateLineupPage"));
const EditLineupPage = lazy(() =>
  import("./pages/CreateLineupPage").then((m) => ({ default: m.EditLineupPage })),
);
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SavedPage = lazy(() => import("./pages/SavedPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminLineupsPage = lazy(() => import("./pages/admin/AdminLineupsPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminReportsPage = lazy(() => import("./pages/admin/AdminReportsPage"));
const AdminGameDataPage = lazy(() => import("./pages/admin/AdminGameDataPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted" />
    </div>
  );
}

function AppRoutes() {
  useInitAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="lineups" element={<LineupsExplorerPage />} />
          <Route path="lineups/:slug" element={<LineupDetailPage />} />
          <Route path="users/:username" element={<ProfilePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="create-lineup" element={<CreateLineupPage />} />
            <Route path="lineups/:id/edit" element={<EditLineupPage />} />
            <Route path="saved" element={<SavedPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="lineups" element={<AdminLineupsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="game-data" element={<AdminGameDataPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#1c2133",
              border: "1px solid #262c40",
              color: "#e8ebf4",
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
