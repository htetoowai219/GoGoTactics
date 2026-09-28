import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { WelcomeDialog } from "../components/WelcomeDialog";

export function RootLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 animate-fade-in">
        <Outlet />
      </main>
      <Footer />
      <WelcomeDialog />
    </div>
  );
}
