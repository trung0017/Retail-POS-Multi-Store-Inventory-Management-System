import React from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Building,
  PieChart,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { useAppSelector } from '../../store';

export const AnalyticsView: React.FC = () => {
  const orders = useAppSelector((state) => state.orders.orders);
  const products = useAppSelector((state) => state.inventory.products);
  const branches = useAppSelector((state) => state.inventory.branches);
  const stock = useAppSelector((state) => state.inventory.stock);

  // Financial metrics
  const totalRevenue = orders.reduce((acc, o) => (o.status !== 'refunded' ? acc + o.grandTotal : acc), 0);
  const totalOrders = orders.filter((o) => o.status !== 'refunded').length;
  const avgBasketSize = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Inventory valuation
  let totalRetailValuation = 0;
  let totalCostValuation = 0;
  stock.forEach((stk) => {
    const prod = products.find((p) => p.id === stk.productId);
    if (prod) {
      totalRetailValuation += stk.quantity * prod.price;
      totalCostValuation += stk.quantity * prod.costPrice;
    }
  });
  const unrealizedMargin = totalRetailValuation - totalCostValuation;

  // Payment Breakdown
  const cashTotal = orders
    .filter((o) => o.status !== 'refunded')
    .reduce((acc, o) => acc + (o.paymentDetails.cashPaid - o.paymentDetails.changeDue), 0);
  const cardTotal = orders
    .filter((o) => o.status !== 'refunded')
    .reduce((acc, o) => acc + o.paymentDetails.cardPaid, 0);

  // Branch breakdown
  const branchStats = branches.map((b) => {
    const branchOrders = orders.filter((o) => o.branchId === b.id && o.status !== 'refunded');
    const revenue = branchOrders.reduce((acc, o) => acc + o.grandTotal, 0);
    const branchStockCount = stock
      .filter((s) => s.branchId === b.id)
      .reduce((acc, s) => acc + s.quantity, 0);
    return {
      branch: b,
      orderCount: branchOrders.length,
      revenue,
      stockCount: branchStockCount,
    };
  });

  // Top products
  const productSalesMap: Record<string, { product: typeof products[0]; count: number; revenue: number }> = {};
  orders.forEach((o) => {
    if (o.status === 'refunded') return;
    o.items.forEach((item) => {
      if (!productSalesMap[item.product.id]) {
        productSalesMap[item.product.id] = {
          product: item.product,
          count: 0,
          revenue: 0,
        };
      }
      productSalesMap[item.product.id].count += item.quantity;
      productSalesMap[item.product.id].revenue +=
        item.product.price * item.quantity * (1 - item.discountPercent / 100);
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <span>Multi-Store Sales &amp; Inventory Analytics</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time enterprise metrics, inventory capital valuation, and channel velocity.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Cumulative Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-white mt-1">
            ${totalRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>Across all active locations</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Average Basket Size</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-white mt-1">
            ${avgBasketSize.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{totalOrders} completed checkouts</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Retail Stock Valuation</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-white mt-1">
            ${totalRetailValuation.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Cost base: ${totalCostValuation.toFixed(2)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Unrealized Gross Margin</span>
            <PieChart className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-emerald-400 mt-1">
            ${unrealizedMargin.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Margin: {totalRetailValuation > 0 ? ((unrealizedMargin / totalRetailValuation) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* 2-column breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Branch breakdown */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-400" />
            <span>Store Performance &amp; On-Hand Units</span>
          </h3>

          <div className="space-y-3 pt-2">
            {branchStats.map((bs) => (
              <div key={bs.branch.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-200">{bs.branch.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono ml-1.5">
                      ({bs.branch.code})
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">
                    ${bs.revenue.toFixed(2)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{bs.orderCount} sales recorded</span>
                  <span>{bs.stockCount} inventory units on hand</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full"
                    style={{
                      width: `${totalRevenue > 0 ? Math.min(100, (bs.revenue / totalRevenue) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Payment tender split breakdown */}
          <div className="pt-3 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">Tender Distribution</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">Cash</span>
                </div>
                <span className="font-mono font-bold text-emerald-400">${cashTotal.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <span className="text-slate-300">Card</span>
                </div>
                <span className="font-mono font-bold text-indigo-400">${cardTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Top Performing FMCG Products</span>
          </h3>

          <div className="space-y-2.5 pt-2">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No sales registered yet.</p>
            ) : (
              topProducts.map((tp, idx) => (
                <div
                  key={tp.product.id}
                  className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-indigo-400 w-4">#{idx + 1}</span>
                    <div>
                      <h5 className="font-semibold text-slate-200 truncate max-w-[220px]">
                        {tp.product.name}
                      </h5>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {tp.product.sku} · {tp.product.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="font-bold text-slate-100">{tp.count} units sold</div>
                    <div className="text-[11px] text-emerald-400">${tp.revenue.toFixed(2)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
