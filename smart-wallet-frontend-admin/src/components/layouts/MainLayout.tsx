import { type ReactNode, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Wallet,
  LogOut,
} from "lucide-react";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/wallets",
    label: "Wallets",
    icon: Wallet,
  },
  {
    to: "/agent-manager",
    label: "Agent Manager",
    icon: LayoutDashboard,
  },
  {
    to: "/agents",
    label: "Agents",
    icon: LayoutDashboard,
  },
  {
    to: "/customers",
    label: "Customers",
    icon: LayoutDashboard,
  },
    {
    to: "/transactions",
    label: "Transactions",
    icon: LayoutDashboard,
  },
];


type Props = {
  children: ReactNode;
  title?: string;
};

const MainLayout = ({ children, title = "Admin Portal" }: Props) => {
  const location = useLocation();
  const pathname = location.pathname;
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? "w-20" : "w-72";

  const navItemsWithState = useMemo(
    () =>
      navItems.map((item) => ({
        ...item,
        active: pathname === item.to,
      })),
    [pathname],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen w-full">
        <aside className={`${sidebarWidth} shrink-0 border-r border-slate-200 bg-white shadow-sm transition-all duration-200`}>
          <div className="flex h-full flex-col px-4 py-6">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-6">
              <div className="grid h-11 w-11 place-items-center rounded bg-slate-900 text-white">
                <Wallet className="h-5 w-5" />
              </div>
              {!collapsed ? (
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-slate-950">Smart Wallet Admin</p>
                  <p className="text-xs text-slate-500">Manage users and transfers</p>
                </div>
              ) : null}
            </div>

            <div className="mb-6">
              {!collapsed ? <p className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-500">Navigation</p> : null}
              <nav className="space-y-3 mt-3">
                {navItemsWithState.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3 rounded px-3 py-3 text-sm transition-colors ${
                        item.active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                      } ${collapsed ? "justify-center" : "border border-slate-200"} `}
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
                onClick={() => window.location.assign("/login")}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {!collapsed ? "Logout" : null}
              </Button>
              <Button
                variant="outline"
                className={`w-full justify-center ${collapsed ? "px-0" : "px-3"}`}
                onClick={() => setCollapsed((value) => !value)}
              >
                {!collapsed ? "Toggle sidebar" : <span className="text-slate-700">☰</span>}
              </Button>
            </div>
          </div>
        </aside>

        <main className="flex-1 bg-slate-50 transition-all duration-200">
          <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
            <div className="flex flex-col gap-2 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Admin Portal</p>
                <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCollapsed((value) => !value)}>
                  Toggle sidebar
                </Button>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
