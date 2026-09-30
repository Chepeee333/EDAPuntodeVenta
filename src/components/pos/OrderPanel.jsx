import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Minus, Plus, Trash2, Receipt } from "lucide-react";

export default function OrderPanel({ items, onUpdateQty, onRemoveItem, onCheckout, onClear }) {
  const [customerName, setCustomerName] = useState("");
  const [orderType, setOrderType] = useState("local");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const total = subtotal;
  const change = paymentAmount ? Math.max(0, parseFloat(paymentAmount) - total) : 0;
  const canPay = paymentAmount && parseFloat(paymentAmount) >= total && items.length > 0;

  const handleCheckout = () => {
    onCheckout({
      customerName,
      orderType,
      deliveryAddress,
      paymentAmount: parseFloat(paymentAmount),
      changeAmount: change,
      total,
      subtotal,
    });
    setCustomerName("");
    setOrderType("local");
    setDeliveryAddress("");
    setPaymentAmount("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          Pedido Actual
        </h2>
      </div>

      {/* Customer info */}
      <div className="p-4 space-y-3 border-b border-border">
        <div>
          <Label className="text-xs text-muted-foreground">Nombre del cliente</Label>
          <Input
            placeholder="Cliente"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-1 h-9"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Tipo de pedido</Label>
          <Select value={orderType} onValueChange={setOrderType}>
            <SelectTrigger className="mt-1 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local</SelectItem>
              <SelectItem value="para_llevar">Para llevar</SelectItem>
              <SelectItem value="domicilio">A domicilio</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {orderType === "domicilio" && (
          <div>
            <Label className="text-xs text-muted-foreground">Dirección de entrega</Label>
            <Input
              placeholder="Dirección"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="mt-1 h-9"
            />
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Selecciona productos del menú
          </p>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product_name}</p>
                <p className="text-xs text-muted-foreground">${item.unit_price.toFixed(2)} c/u</p>
              </div>
              <div className="flex items-center gap-1 mx-2">
                <button
                  onClick={() => onUpdateQty(idx, item.quantity - 1)}
                  className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQty(idx, item.quantity + 1)}
                  className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold w-16 text-right">
                  ${(item.unit_price * item.quantity).toFixed(2)}
                </span>
                <button
                  onClick={() => onRemoveItem(idx)}
                  className="text-destructive/60 hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals & payment */}
      <div className="border-t border-border p-4 space-y-3 bg-muted/30">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-heading font-bold">
          <span>Total</span>
          <span className="text-primary">${total.toFixed(2)}</span>
        </div>

        {items.length > 0 && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground">Pago del cliente</Label>
              <Input
                type="number"
                placeholder="$0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="mt-1 h-10 text-lg font-semibold"
                min="0"
                step="0.01"
              />
            </div>
            {paymentAmount && parseFloat(paymentAmount) >= total && (
              <div className="flex justify-between text-lg font-heading font-bold bg-accent/10 rounded-lg p-3">
                <span className="text-accent">Cambio</span>
                <span className="text-accent">${change.toFixed(2)}</span>
              </div>
            )}
            {paymentAmount && parseFloat(paymentAmount) < total && (
              <p className="text-xs text-destructive">Monto insuficiente</p>
            )}
          </>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClear} className="flex-1" disabled={items.length === 0}>
            Limpiar
          </Button>
          <Button
            size="sm"
            onClick={handleCheckout}
            className="flex-[2] bg-primary hover:bg-primary/90"
            disabled={!canPay}
          >
            Cobrar
          </Button>
        </div>
      </div>
    </div>
  );
}