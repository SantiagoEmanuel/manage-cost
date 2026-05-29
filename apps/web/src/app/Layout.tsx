import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Users,
  ArrowLeftRight,
  User,
  LogOut,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";
import { queryClient } from "@/shared/lib/query-client";
import { cn } from "@/shared/lib/cn";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/expenses", icon: Receipt, label: "Gastos" },
  { to: "/groups", icon: Users, label: "Grupos" },
  { to: "/settlements", icon: ArrowLeftRight, label: "Liquidaciones" },
  { to: "/profile", icon: User, label: "Perfil" },
];

export function Layout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const { mutate: doLogout } = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logout();
      queryClient.clear();
      navigate("/login");
    },
  });

  return (
    <div className="flex min-h-dvh bg-slate-950">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-slate-800 bg-slate-950 fixed inset-y-0 left-0 z-30">
        <div className="flex items-center gap-2 px-4 py-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-sm">
            💸
          </div>
          <span className="font-semibold text-slate-100 text-sm">
            ManageCost
          </span>
        </div>

        <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-500 hover:text-slate-100 hover:bg-slate-800/50",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold text-white">
              {user?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
            <span className="text-xs text-slate-400 truncate">
              {user?.username}
            </span>
          </div>
          <button
            onClick={() => doLogout()}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-slate-800/50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-56 flex flex-col min-h-screen">
        <div className="flex-1 px-4 md:px-8 pt-6 pb-28 md:pb-8 max-w-5xl w-full mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav mobile — respeta el safe-area inferior de iPhone */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex z-30 pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center gap-1 pt-2 pb-2 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-violet-400"
                  : "text-slate-600 hover:text-slate-400",
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
