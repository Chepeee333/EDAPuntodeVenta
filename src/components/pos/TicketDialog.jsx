import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Check } from "lucide-react";
import { format } from "date-fns";

export default function TicketDialog({ open, onClose, order }) {
  if (!order) return null;

  const handlePrint = () => {
    const printContent = document.getElementById("ticket-content");
    const win = window.open("", "", "width=320,height=600");
    win.document.write(`
      <html><head><title>Ticket</title>
      <style>
        body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; }
        .total-row { font-size: 14px; font-weight: bold; }
      </style></head><body>
      ${printContent.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.print();
    win.close();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Ticket de Compra</DialogTitle>
        </DialogHeader>

        <div id="ticket-content" className="bg-white text-black p-4 rounded-lg border font-mono text-xs space-y-2">
          <div className="text-center">
            <p className="font-bold text-sm">🍽️ POS System</p>
            <p>Ticket de Venta</p>
            <p className="text-[10px] text-gray-500">
              {format(new Date(order.created_date || new Date()), "dd/MM/yyyy HH:mm")}
            </p>
          </div>

          <div className="border-t border-dashed border-gray-300 my-2" />

          <div>
            <p><span className="font-bold">Pedido:</span> {order.order_number}</p>
            {order.customer_name && <p><span className="font-bold">Cliente:</span> {order.customer_name}</p>}
            <p><span className="font-bold">Tipo:</span> {order.order_type === "local" ? "Local" : order.order_type === "para_llevar" ? "Para llevar" : "Domicilio"}</p>
            {order.delivery_address && <p><span className="font-bold">Dir:</span> {order.delivery_address}</p>}
          </div>

          <div className="border-t border-dashed border-gray-300 my-2" />

          <div className="space-y-1">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{item.quantity}x {item.product_name}</span>
                <span>${item.subtotal?.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300 my-2" />

          <div className="space-y-1">
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL</span>
              <span>${order.total?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Pagó</span>
              <span>${order.payment_amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Cambio</span>
              <span>${order.change_amount?.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 my-2" />
          <p className="text-center text-[10px] text-gray-500">¡Gracias por su compra!</p>
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={onClose} className="flex-1 bg-accent hover:bg-accent/90">
            <Check className="w-4 h-4 mr-2" />
            Listo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}