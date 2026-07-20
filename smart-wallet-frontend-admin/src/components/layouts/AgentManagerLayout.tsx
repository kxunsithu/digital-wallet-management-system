import { type ReactNode, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  LogOut,
  Users,
  Banknote,
  Wallet,
  CircleUserRound,
  ReceiptText,
} from "lucide-react";
import { clearAdminSession, getCookie } from "@/lib/cookies";
import { logout as logoutService } from "@/services/auth.service";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agents", label: "My Agents", icon: Users },
  { to: "/transfer", label: "Transfer", icon: Banknote },
  { to: "/transactions/my", label: "My Transactions", icon: ReceiptText },
  { to: "/profile", label: "Profile", icon: CircleUserRound },
];

type Props = {
  children: ReactNode;
  title?: string;
};

const AgentManagerLayout = ({ children, title = "Agent Manager" }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const userName = (() => {
    try {
      const raw = getCookie("admin_user");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { name?: string; full_name?: string; phone?: string };
      return parsed.name || parsed.full_name || parsed.phone || null;
    } catch {
      return null;
    }
  })();

  const handleLogout = async () => {
    try {
      await logoutService();
    } catch {
      // clear client session anyway
    }
    clearAdminSession();
    navigate("/login");
  };

  const navItemsWithState = useMemo(
    () =>
      navItems.map((item) => ({
        ...item,
        active:
          item.to === "/agents"
            ? pathname.startsWith("/agents")
            : pathname === item.to || pathname.startsWith(`${item.to}/`),
      })),
    [pathname],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded bg-slate-900 text-white">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">{title}</p>
              <p className="text-xs text-slate-500">
                {userName ? `Signed in as ${userName}` : "Manage your agents & transfers"}
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {navItemsWithState.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`inline-flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${item.active
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Button variant="secondary" size="sm" onClick={() => void handleLogout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="border-t border-slate-100 px-4 py-2 md:hidden">
          <nav className="flex items-center gap-1 overflow-x-auto">
            {navItemsWithState.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`inline-flex shrink-0 items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${item.active
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
};

export default AgentManagerLayout;
