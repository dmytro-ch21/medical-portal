import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";
import {
  CheckSquare, MessageSquare, Calendar, Users, Building2,
  DollarSign, BarChart3, CalendarDays, Shield, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils.js";

const NAV = [
  { to: "/",            label: "Чек-лист",    icon: CheckSquare },
  { to: "/scripts",     label: "Скрипты",     icon: MessageSquare },
  { to: "/specialists", label: "Специалисты", icon: Calendar },
  { to: "/patients",    label: "Пациенты",    icon: Users },
  { to: "/clinic",      label: "Клиника",     icon: Building2 },
  { to: "/prices",      label: "Цены",        icon: DollarSign },
  { to: "/reports",     label: "Отчёты",      icon: BarChart3 },
  { to: "/calendar",    label: "Расписание",  icon: CalendarDays },
];

const SOON = [
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <aside className="w-60 min-h-screen bg-sidebar border-r border-portal-border flex flex-col sticky top-0 h-screen overflow-y-auto flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-portal-border">
        <div className="text-xs font-bold tracking-widest uppercase text-accent">Plus Surgery</div>
        <div className="text-[11px] text-muted mt-0.5">Hollywood, FL · Internal Portal</div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 pt-3 pb-2">
        <div className="text-[10px] font-bold tracking-widest uppercase text-muted px-2 mb-2">Главное</div>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5",
                isActive
                  ? "bg-accent-light text-accent font-semibold"
                  : "text-[#1A1A1A] hover:bg-accent-light/50 font-normal",
              )
            }
          >
            <Icon size={16} className="flex-shrink-0" />
            {label}
          </NavLink>
        ))}

        {/* Admin */}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 mt-1",
                isActive
                  ? "bg-accent-light text-accent font-semibold"
                  : "text-[#1A1A1A] hover:bg-accent-light/50 font-normal",
              )
            }
          >
            <Shield size={16} className="flex-shrink-0" />
            Администрация
          </NavLink>
        )}

      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 pt-2 border-t border-portal-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">
            {(user?.display_name || user?.username || "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{user?.display_name || user?.username}</div>
            <div className="text-[10px] text-muted capitalize">{user?.role}</div>
          </div>
          <button
            onClick={logout}
            title="Выйти"
            className="p-1.5 rounded-lg hover:bg-accent-light text-muted hover:text-accent transition-colors cursor-pointer"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
