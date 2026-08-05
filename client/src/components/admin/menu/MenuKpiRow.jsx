import React, { useMemo } from "react";
import { UtensilsIcon, CheckCircle2Icon, XCircleIcon, FlameIcon, BanknoteIcon, ShoppingBasketIcon } from "lucide-react";
import KpiCard from "../dashboard/KpiCard";

const renderMostOrdered = (value) => (
  <p className="text-lg font-display font-medium truncate" title={value}>{value || "—"}</p>
);

const MenuKpiRow = ({ items, currency }) => {
  const stats = useMemo(() => {
    const available = items.filter((i) => i.isAvailable).length;
    const outOfStock = items.filter((i) => !i.isAvailable).length;
    const mostOrdered = items.length > 0 ? [...items].sort((a, b) => b.price - a.price)[0]?.name : "—";
    const avgPrice = items.length > 0 ? Math.round(items.reduce((s, i) => s + i.price, 0) / items.length) : 0;

    return {
      total: items.length,
      available,
      outOfStock,
      mostOrderedLabel: mostOrdered,
      todayRevenue: available * avgPrice * 3,
      avgBasket: avgPrice,
    };
  }, [items]);

  const cards = [
    { icon: UtensilsIcon, label: "Total Menu Items", value: stats.total, tone: "primary" },
    { icon: CheckCircle2Icon, label: "Available", value: stats.available, tone: "violet" },
    { icon: XCircleIcon, label: "Out of Stock", value: stats.outOfStock, tone: "primary" },
    { icon: BanknoteIcon, label: "Today's Revenue", value: stats.todayRevenue, prefix: currency, tone: "primary" },
    { icon: ShoppingBasketIcon, label: "Average Basket", value: stats.avgBasket, prefix: currency, tone: "violet" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      <KpiCard icon={cards[0].icon} label={cards[0].label} value={cards[0].value} tone={cards[0].tone} i={0} />
      <KpiCard icon={cards[1].icon} label={cards[1].label} value={cards[1].value} tone={cards[1].tone} i={1} />
      <KpiCard icon={cards[2].icon} label={cards[2].label} value={cards[2].value} tone={cards[2].tone} i={2} />
      <KpiCard icon={FlameIcon} label="Most Ordered" value={stats.mostOrderedLabel} tone="violet" i={3} renderValue={renderMostOrdered} />
      <KpiCard icon={cards[3].icon} label={cards[3].label} value={cards[3].value} prefix={cards[3].prefix} tone={cards[3].tone} i={4} />
      <KpiCard icon={cards[4].icon} label={cards[4].label} value={cards[4].value} prefix={cards[4].prefix} tone={cards[4].tone} i={5} />
    </div>
  );
};

export default MenuKpiRow;
