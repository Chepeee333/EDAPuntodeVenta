import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, startOfDay, subDays, isAfter } from "date-fns";

export default function Dashboard() {
  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => base44.entities.Order.list("-created_date", 500),
  });

  const today = startOfDay(new Date());
  const todayOrders = orders.filter(
    (o) => o.status === "completado" && isAfter(new Date(o.created_date), today)
  );
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const todayCount = todayOrders.length;
  const avgTicket = todayCount > 0 ? todayRevenue / todayCount : 0;

  // Last 7 days chart
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayOrders = orders.filter(
      (o) =>
        o.status === "completado" &&
        new Date(o.created_date) >= dayStart &&
        new Date(o.created_date) < dayEnd
    );
    return {
      day: format(day, "dd/MM"),
      ventas: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      pedidos: dayOrders.length,
    };
  });

  const stats = [
    { title: "Ventas de Hoy", value: `$${todayRevenue.toFixed(2)}`, icon: DollarSign, color: "text-primary" },
    { title: "Pedidos Hoy", value: todayCount, icon: ShoppingCart, color: "text-accent" },
    { title: "Ticket Promedio", value: `$${avgTicket.toFixed(2)}`, icon: TrendingUp, color: "text-chart-3" },
    { title: "Total Pedidos", value: orders.filter(o => o.status === "completado").length, icon: BarChart3, color: "text-chart-4" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Panel de Ganancias
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Resumen de ventas y ganancias diarias</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Ventas últimos 7 días</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="ventas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Ventas ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent orders */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-heading">Pedidos recientes de hoy</CardTitle>
        </CardHeader>
        <CardContent>
          {todayOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No hay pedidos hoy</p>
          ) : (
            <div className="space-y-3">
              {todayOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                  <div>
                    <p className="font-medium text-sm">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.customer_name || "Sin nombre"} • {order.items?.length || 0} productos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold text-primary">${order.total?.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_date), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}