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
  Wallet,
  LogOut,
  MapPin,
  Banknote,
  Users,
  UserCog,
  UserRound,
  ReceiptText,
  CircleUserRound,
} from "lucide-react";
import { clearAdminSession } from "@/lib/cookies";
import { logout as logoutService } from "@/services/auth.service";

const adminNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/wallets", label: "Wallets", icon: Wallet },
  { to: "/system-wallet", label: "System Wallet", icon: Banknote },
  { to: "/agent-managers", label: "Agent Managers", icon: UserCog },
  { to: "/agents", label: "Agents", icon: Users },
  { to: "/customers", label: "Customers", icon: UserRound },
  { to: "/transactions", label: "All Transactions", icon: ReceiptText, exact: true },
  { to: "/transactions/system", label: "System Transactions", icon: Banknote },
  { to: "/locations", label: "Locations", icon: MapPin },
  { to: "/profile", label: "Profile", icon: CircleUserRound },
];

type Props = {
  children: ReactNode;
  title?: string;
};

const MainLayout = ({ children, title = "Admin Portal" }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const [collapsed, setCollapsed] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logoutService();
    } catch {
      // ignore backend errors and clear the client session anyway
    } finally {
      setLoggingOut(false);
    }
    clearAdminSession();
    navigate("/login");
  };

  const sidebarWidth = collapsed ? "w-20" : "w-72";

  const navItemsWithState = useMemo(
    () =>
      adminNavItems.map((item) => ({
        ...item,
        active: item.exact
          ? pathname === item.to
          : pathname === item.to || pathname.startsWith(`${item.to}/`),
      })),
    [pathname],
  );

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen w-full">
          <aside className={`${sidebarWidth} shrink-0 sticky top-0 h-screen border-r border-border bg-card shadow-sm transition-all duration-200 overflow-y-auto`}>
            <div className="flex h-full flex-col px-4 py-6">
              <div className="mb-6 flex items-center gap-3 border-b border-border pb-6">
                <div className="grid h-11 w-11 place-items-center rounded bg-primary text-primary-foreground">
                  <Wallet className="h-5 w-5" />
                </div>
                {!collapsed ? (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">Smart Wallet Admin</p>
                    <p className="text-xs text-muted-foreground">Manage users and transfers</p>
                  </div>
                ) : null}
              </div>

              <div className="mb-6">
                {!collapsed ? <p className="mb-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">Navigation</p> : null}
                <nav className="space-y-3 mt-3">
                  {navItemsWithState.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`flex items-center gap-3 rounded px-3 py-3 text-sm transition-colors ${
                          item.active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                        } ${collapsed ? "justify-center" : "border border-border"} `}
                      >
                        <Icon className="h-4 w-4" />
                        {!collapsed ? item.label : null}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="mt-auto space-y-3">
                <Button
                  variant="secondary"
                  className={`w-full justify-center ${collapsed ? "px-0" : "px-3"}`}
                  onClick={() => setLogoutModalOpen(true)}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {!collapsed ? "Logout" : null}
                </Button>
                <Button
                  variant="outline"
                  className={`w-full justify-center ${collapsed ? "px-0" : "px-3"}`}
                  onClick={() => setCollapsed((value) => !value)}
                >
                  {!collapsed ? "Toggle sidebar" : <span>☰</span>}
                </Button>
              </div>
            </div>
          </aside>

          <main className="flex-1 bg-background transition-all duration-200">
            <div className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
              <div className="flex flex-col gap-2 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="block text-2xl font-semibold tracking-tight text-foreground">
                    {title}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">{children}</div>
          </main>
        </div>
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
            <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-[#AEFF0B]">
              <LogOut className="h-6 w-6 text-[#10110E]" />
            </div>
            <DialogTitle className="text-lg font-bold">Sign out?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              You will be signed out of Smart Wallet Admin. Any unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="w-full rounded-xl bg-[#AEFF0B] font-semibold text-[#10110E] hover:bg-[#AEFF0B]/90"
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

export default MainLayout;
