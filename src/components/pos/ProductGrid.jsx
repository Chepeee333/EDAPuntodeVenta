import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const categoryColors = {
  Comida: "bg-primary/10 text-primary border-primary/20",
  Bebida: "bg-accent/10 text-accent border-accent/20",
  Postre: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  Extra: "bg-muted text-muted-foreground border-border",
};

export default function ProductGrid({ products, onAddItem, activeCategory }) {
  const filtered = activeCategory === "Todos"
    ? products.filter(p => p.available !== false)
    : products.filter(p => p.category === activeCategory && p.available !== false);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {filtered.map((product) => (
        <button
          key={product.id}
          onClick={() => onAddItem(product)}
          className="group bg-card rounded-xl border border-border p-4 text-left hover:border-primary/40 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-heading font-semibold text-sm text-card-foreground group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <Badge variant="outline" className={cn("text-xs shrink-0 ml-2", categoryColors[product.category])}>
              {product.category}
            </Badge>
          </div>
          {product.description && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
          )}
          <p className="font-heading font-bold text-lg text-primary">
            ${product.price?.toFixed(2)}
          </p>
        </button>
      ))}
      {filtered.length === 0 && (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          No hay productos en esta categoría
        </div>
      )}
    </div>
  );
}