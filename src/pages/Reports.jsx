import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Calendar, CalendarDays, CalendarRange, Sheet } from "lucide-react";
import { format, startOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, getISOWeek } from "date-fns";
import { es } from "date-fns/locale";
import jspdf from "jspdf";

const REPORT_TYPES = [
  { key: "diario",    label: "Del día",    icon: Calendar },
  { key: "semanal",   label: "Semanal",    icon: CalendarDays },
  { key: "quincenal", label: "Quincenal",  icon: CalendarDays },
  { key: "mensual",   label: "Mensual",    icon: CalendarRange },
  { key: "anual",     label: "Anual",      icon: CalendarRange },
];

function getDateRange(type, referenceDate) {
  const ref = new Date(referenceDate + "T00:00:00");
  switch (type) {
    case "diario":
      return { start: startOfDay(ref), end: new Date(startOfDay(ref).getTime() + 86400000) };
    case "semanal":
      return { start: startOfWeek(ref, { weekStartsOn: 1 }), end: new Date(endOfWeek(ref, { weekStartsOn: 1 }).getTime() + 1) };
    case "quincenal": {
      const day = ref.getDate();
      const year = ref.getFullYear();
      const month = ref.getMonth();
      if (day <= 15) {
        return { start: new Date(year, month, 1), end: new Date(year, month, 16) };
      } else {
        return { start: new Date(year, month, 16), end: new Date(year, month + 1, 1) };
      }
    }
    case "mensual":
      return { start: startOfMonth(ref), end: new Date(endOfMonth(ref).getTime() + 1) };
    case "anual":
      return { start: startOfYear(ref), end: new Date(endOfYear(ref).getTime() + 1) };
    default:
      return { start: startOfDay(ref), end: new Date(startOfDay(ref).getTime() + 86400000) };
  }
}

function getPeriodLabel(type, referenceDate) {
  const ref = new Date(referenceDate + "T00:00:00");
  switch (type) {
    case "diario":
      return format(ref, "dd 'de' MMMM yyyy", { locale: es });
    case "semanal": {
      const s = startOfWeek(ref, { weekStartsOn: 1 });
      const e = endOfWeek(ref, { weekStartsOn: 1 });
      return `Semana ${getISOWeek(ref)}: ${format(s, "dd/MM")} – ${format(e, "dd/MM/yyyy")}`;
    }
    case "quincenal": {
      const day = ref.getDate();
      const half = day <= 15 ? "1ª quincena" : "2ª quincena";
      return `${half} de ${format(ref, "MMMM yyyy", { locale: es })}`;
    }
    case "mensual":
      return format(ref, "MMMM yyyy", { locale: es });
    case "anual":
      return `Año ${ref.getFullYear()}`;
    default:
      return "";
  }
}

export default function Reports() {
  const [reportType, setReportType] = useState("diario");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => base44.entities.Order.list("-created_date", 1000),
  });

  const { start, end } = useMemo(() => getDateRange(reportType, selectedDate), [reportType, selectedDate]);
  const periodLabel = useMemo(() => getPeriodLabel(reportType, selectedDate), [reportType, selectedDate]);

  const filteredOrders = useMemo(() =>
    orders.filter(
      (o) => o.status === "completado" &&
        new Date(o.created_date) >= start &&
        new Date(o.created_date) < end
    ), [orders, start, end]);

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = filteredOrders.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const exportCSV = () => {
    const typeLabel = REPORT_TYPES.find(t => t.key === reportType)?.label || "ventas";
    const headers = ["# Pedido", "Cliente", "Tipo", "Productos", "Fecha", "Hora", "Total"];
    const rows = filteredOrders.map((o) => [
      o.order_number || "",
      o.customer_name || "",
      (o.order_type || "local").replace("_", " "),
      o.items?.length || 0,
      format(new Date(o.created_date), "dd/MM/yyyy"),
      format(new Date(o.created_date), "HH:mm"),
      o.total?.toFixed(2) || "0.00",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_${reportType}_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePDF = () => {
    const doc = new jspdf();
    const typeLabel = REPORT_TYPES.find(t => t.key === reportType)?.label || "Ventas";

    doc.setFontSize(18);
    doc.text(`Reporte ${typeLabel} de Ventas`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Período: ${periodLabel}`, 20, 30);
    doc.text(`Total de pedidos: ${totalOrders}`, 20, 38);
    doc.text(`Ingreso total: $${totalRevenue.toFixed(2)}`, 20, 46);
    doc.text(`Ticket promedio: $${avgTicket.toFixed(2)}`, 20, 54);

    let y = 68;
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text("# Pedido", 20, y);
    doc.text("Cliente", 60, y);
    doc.text("Tipo", 110, y);
    doc.text("Fecha", 140, y);
    doc.text("Total", 170, y);
    doc.setFont(undefined, "normal");
    y += 4;
    doc.line(20, y, 190, y);
    y += 6;

    filteredOrders.forEach((order) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(order.order_number || "—", 20, y);
      doc.text((order.customer_name || "—").substring(0, 20), 60, y);
      doc.text((order.order_type || "local").replace("_", " "), 110, y);
      doc.text(format(new Date(order.created_date), "dd/MM HH:mm"), 140, y);
      doc.text(`$${order.total?.toFixed(2) || "0.00"}`, 170, y);
      y += 8;
    });

    y += 10;
    doc.line(20, y, 190, y);
    y += 8;
    doc.setFont(undefined, "bold");
    doc.text(`TOTAL: $${totalRevenue.toFixed(2)}`, 140, y);

    doc.save(`reporte_${reportType}_${selectedDate}.pdf`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Reportes
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Genera reportes de ventas por período en PDF</p>
      </div>

      {/* Tipo de reporte */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Tipo de reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {REPORT_TYPES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setReportType(key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  reportType === key
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fecha de referencia + descargar */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Fecha de referencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">
                {reportType === "diario" && "Selecciona el día"}
                {reportType === "semanal" && "Cualquier día de la semana"}
                {reportType === "quincenal" && "Cualquier día de la quincena"}
                {reportType === "mensual" && "Cualquier día del mes"}
                {reportType === "anual" && "Cualquier día del año"}
              </Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 w-52"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Período calculado</p>
              <p className="font-heading font-semibold text-primary capitalize">{periodLabel}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={exportCSV}
                disabled={filteredOrders.length === 0}
              >
                <Sheet className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
              <Button
                onClick={generatePDF}
                disabled={filteredOrders.length === 0}
                className="bg-primary hover:bg-primary/90"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de resultados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="font-heading text-lg capitalize">
              {REPORT_TYPES.find(t => t.key === reportType)?.label}: {periodLabel}
            </CardTitle>
            <div className="flex gap-6 text-sm">
              <span className="text-muted-foreground">Pedidos: <span className="font-bold text-foreground">{totalOrders}</span></span>
              <span className="text-muted-foreground">Promedio: <span className="font-bold text-foreground">${avgTicket.toFixed(2)}</span></span>
              <span className="text-muted-foreground">Total: <span className="font-heading font-bold text-primary">${totalRevenue.toFixed(2)}</span></span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No hay pedidos en este período
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead># Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Fecha / Hora</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.customer_name || "—"}</TableCell>
                    <TableCell className="capitalize">{order.order_type?.replace("_", " ") || "local"}</TableCell>
                    <TableCell>{order.items?.length || 0}</TableCell>
                    <TableCell>{format(new Date(order.created_date), "dd/MM/yyyy HH:mm")}</TableCell>
                    <TableCell className="font-semibold">${order.total?.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}