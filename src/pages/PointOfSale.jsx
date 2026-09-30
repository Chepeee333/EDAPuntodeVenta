import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductGrid from "@/components/pos/ProductGrid";
import OrderPanel from "@/components/pos/OrderPanel";
import TicketDialog from "@/components/pos/TicketDialog";

const categories = ["Todos", "Comida", "Bebida", "Postre", "Extra"];

export default function PointOfSale() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [orderItems, setOrderItems] = useState([]);
  const [ticketOrder, setTicketOrder] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list(),
  });

  const createOrderMutation = useMutation({
    mutationFn: (data) => base44.entities.Order.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const addItem = (product) => {
    setOrderItems((prev) => {
      const existing = prev.findIndex((i) => i.product_name === product.name);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing].quantity += 1;
        updated[existing].subtotal = updated[existing].quantity * updated[existing].unit_price;
        return updated;
      }
      return [
        ...prev,
        {
          product_name: product.name,
          quantity: 1,
          unit_price: product.price,
          subtotal: product.price,
        },
      ];
    });
  };

  const updateQty = (idx, qty) => {
    if (qty <= 0) {
      setOrderItems((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setOrderItems((prev) => {
        const updated = [...prev];
        updated[idx].quantity = qty;
        updated[idx].subtotal = qty * updated[idx].unit_price;
        return updated;
      });
    }
  };

  const removeItem = (idx) => setOrderItems((prev) => prev.filter((_, i) => i !== idx));

  const handleCheckout = async (checkoutData) => {
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const orderData = {
      order_number: orderNumber,
      customer_name: checkoutData.customerName,
      items: orderItems,
      subtotal: checkoutData.subtotal,
      total: checkoutData.total,
      payment_amount: checkoutData.paymentAmount,
      change_amount: checkoutData.changeAmount,
      status: "completado",
      order_type: checkoutData.orderType,
      delivery_address: checkoutData.deliveryAddress,
    };

    const created = await createOrderMutation.mutateAsync(orderData);
    setTicketOrder({ ...orderData, ...created });
    setShowTicket(true);
    setOrderItems([]);
  };

  return (
    <div className="flex h-screen">
      {/* Left: Product catalog */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 pb-4">
          <h1 className="font-heading text-2xl font-bold mb-1">Punto de Venta</h1>
          <p className="text-sm text-muted-foreground mb-4">Selecciona productos para agregar al pedido</p>
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="bg-muted">
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="text-sm">
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="flex-1 overflow-auto px-6 pb-6">
          <ProductGrid
            products={products}
            onAddItem={addItem}
            activeCategory={activeCategory}
          />
        </div>
      </div>

      {/* Right: Order panel */}
      <div className="w-96 border-l border-border bg-card">
        <OrderPanel
          items={orderItems}
          onUpdateQty={updateQty}
          onRemoveItem={removeItem}
          onCheckout={handleCheckout}
          onClear={() => setOrderItems([])}
        />
      </div>

      <TicketDialog
        open={showTicket}
        onClose={() => setShowTicket(false)}
        order={ticketOrder}
      />
    </div>
  );
}