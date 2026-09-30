import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { ShoppingCart, Package, Users, BarChart3, FileText, LogOut, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";

const navItems = [
  { path: "/", label: "Punto de Venta", icon: ShoppingCart, roles: ["admin", "cajero"] },
  { path: "/products", label: "Productos", icon: Package, roles: ["admin"] },
  { path: "/customers", label: "Clientes", icon: Users, roles: ["admin"] },
  { path: "/dashboard", label: "Ganancias", icon: BarChart3, roles: ["admin"] },
  { path: "/reports", label: "Reportes", icon: FileText, roles: ["admin"] },
];

function getAppRole(user) {
  const override = localStorage.getItem("pos_role_override");
  if (override === "cajero") return "cajero";
  if (user?.role === "admin") return "admin";
  return "admin"; // por defecto si está logueado por Base44 es admin
}

export default function Layout() {
  const location = useLocation();
  const { user } = useAuth();

  const appRole = getAppRole(user);
  const visibleItems = navItems.filter(item => item.roles.includes(appRole));

  // Si el cajero intenta acceder a una ruta de admin, redirigir al POS
  const currentItem = navItems.find(item => item.path === location.pathname);
  if (currentItem && !currentItem.roles.includes(appRole)) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("pos_role_override");
    base44.auth.logout();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="font-heading text-xl font-bold text-sidebar-primary">
            🍽️ POS System
          </h1>
          <div className="flex items-center gap-1.5 mt-2">
            {appRole === "admin" ? (
              <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
            ) : (
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className={cn(
              "text-xs font-medium",
              appRole === "admin" ? "text-orange-400" : "text-emerald-400"
            )}>
              {appRole === "admin" ? "Administrador" : "Cajero"}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}