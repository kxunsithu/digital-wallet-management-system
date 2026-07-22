import { type ReactNode, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logoutService();
    } catch {
      // clear client session anyway
    } finally {
      setLoggingOut(false);
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
    <>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded bg-primary text-primary-foreground">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">
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
                    className={`inline-flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
                      item.active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <Button variant="secondary" size="sm" onClick={() => setLogoutModalOpen(true)}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <div className="border-t border-border px-4 py-2 md:hidden">
            <nav className="flex items-center gap-1 overflow-x-auto">
              {navItemsWithState.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`inline-flex shrink-0 items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
                      item.active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
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

      {/* Logout Confirmation Modal */}
      <Dialog
        open={logoutModalOpen}
        onOpenChange={(open) => {
          if (!open) setLogoutModalOpen(false);
        }}
      >
        <DialogContent showCloseButton={false} className="max-w-sm rounded-2xl">
          <DialogHeader className="items-center text-center">
            <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-[#D5E726]">
              <LogOut className="h-6 w-6 text-[#10110E]" />
            </div>
            <DialogTitle className="text-lg font-bold">Sign out?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              You will be signed out of Smart Wallet. Any unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="w-full rounded-xl bg-[#D5E726] font-semibold text-[#10110E] hover:bg-[#D5E726]/90"
            >
              {loggingOut ? "Signing out..." : "Yes, sign out"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setLogoutModalOpen(false)}
              disabled={loggingOut}
              className="w-full rounded-xl"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AgentManagerLayout;
