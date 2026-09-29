import React, { useState } from 'react';
import {
  ArrowRightLeft,
  AlertTriangle,
  Plus,
  CheckCircle,
  Truck,
  Edit3,
  Search,
  Filter,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  adjustStock,
  createTransferRequest,
  updateTransferStatus,
  updateProductThreshold,
} from '../../store/slices/inventorySlice';
import { Product } from '../../types';

export const InventoryManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.inventory.products);
  const branches = useAppSelector((state) => state.inventory.branches);
  const stock = useAppSelector((state) => state.inventory.stock);
  const transfers = useAppSelector((state) => state.inventory.transfers);

  const [activeTab, setActiveTab] = useState<'matrix' | 'transfers' | 'alerts'>('matrix');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal States
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustBranchId, setAdjustBranchId] = useState<string>('branch-a');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSource, setTransferSource] = useState('warehouse-01');
  const [transferTarget, setTransferTarget] = useState('branch-a');
  const [transferProductId, setTransferProductId] = useState(products[0]?.id || '');
  const [transferQty, setTransferQty] = useState(12);
  const [transferNotes, setTransferNotes] = useState('');

  // Threshold edit
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);
  const [thresholdVal, setThresholdVal] = useState<number>(10);

  // Helper to get stock for a given product and branch
  const getProductStock = (productId: string, branchId: string) => {
    const item = stock.find((s) => s.productId === productId && s.branchId === branchId);
    return item ? item.quantity : 0;
  };

  // Find all low-stock items across branches
  const lowStockAlerts = React.useMemo(() => {
    const alerts: { product: Product; branchName: string; branchId: string; currentStock: number }[] = [];
    products.forEach((prod) => {
      branches.forEach((br) => {
        const qty = getProductStock(prod.id, br.id);
        if (qty <= prod.minStockThreshold) {
          alerts.push({
            product: prod,
            branchName: br.name,
            branchId: br.id,
            currentStock: qty,
          });
        }
      });
    });
    return alerts;
  }, [products, branches, stock]);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const handleOpenAdjust = (prod: Product, branchId: string) => {
    setAdjustProduct(prod);
    setAdjustBranchId(branchId);
    setAdjustQuantity(getProductStock(prod.id, branchId));
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct) return;
    dispatch(
      adjustStock({
        branchId: adjustBranchId,
        productId: adjustProduct.id,
        newQuantity: adjustQuantity,
      })
    );
    setIsAdjustModalOpen(false);
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === transferProductId);
    if (!prod) return;

    dispatch(
      createTransferRequest({
        sourceBranchId: transferSource,
        targetBranchId: transferTarget,
        items: [
          {
            productId: prod.id,
            productName: prod.name,
            quantity: transferQty,
          },
        ],
        notes: transferNotes || 'Routine store replenishment',
      })
    );
    setIsTransferModalOpen(false);
    setActiveTab('transfers');
  };

  const handleSaveThreshold = (productId: string) => {
    dispatch(updateProductThreshold({ productId, minStockThreshold: thresholdVal }));
    setEditingThresholdId(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Tab Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100">Multi-Branch Inventory Hub</h2>
            {lowStockAlerts.length > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>{lowStockAlerts.length} Low Stock Alerts</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor SKU levels across retail stores and central warehouse in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          {/* Subtabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'matrix'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Stock Matrix
            </button>
            <button
              onClick={() => setActiveTab('transfers')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'transfers'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfers ({transfers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'alerts'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Safety Alerts</span>
            </button>
          </div>

          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Transfer</span>
          </button>
        </div>
      </div>

      {/* Tab: Stock Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          {/* Filter Bar */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products or SKU..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-none">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="flex items-center gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-slate-800 text-indigo-400 border border-indigo-700/60 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Product &amp; SKU</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Price / Cost</th>
                  <th className="py-3 px-3 text-center">Safety Threshold</th>
                  {branches.map((b) => (
                    <th key={b.id} className="py-3 px-3 text-center">
                      <div className="font-bold text-slate-200">{b.name}</div>
                      <div className="text-[9px] font-normal text-slate-500">
                        {b.isWarehouse ? 'Hub' : 'Store'} ({b.code})
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.map((prod) => {
                  return (
                    <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100">{prod.name}</div>
                        <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                          {prod.sku} · Barcode: {prod.barcode}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-300">{prod.category}</td>

                      <td className="py-3 px-3 font-mono">
                        <div className="text-emerald-400 font-bold">${prod.price.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-500">
                          Cost: ${prod.costPrice.toFixed(2)}
                        </div>
                      </td>

                      {/* Threshold with in-place editor */}
                      <td className="py-3 px-3 text-center">
                        {editingThresholdId === prod.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={thresholdVal}
                              onChange={(e) => setThresholdVal(parseInt(e.target.value) || 0)}
                              className="w-12 bg-slate-950 border border-indigo-600 rounded px-1.5 py-0.5 font-mono text-center text-xs text-white"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveThreshold(prod.id)}
                              className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-500"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingThresholdId(prod.id);
                              setThresholdVal(prod.minStockThreshold);
                            }}
                            className="inline-flex items-center gap-1 font-mono text-xs text-slate-300 hover:text-indigo-400 px-2 py-0.5 rounded hover:bg-slate-800"
                            title="Click to edit threshold"
                          >
                            <span>{prod.minStockThreshold} {prod.unit}s</span>
                            <Edit3 className="w-2.5 h-2.5 text-slate-500" />
                          </button>
                        )}
                      </td>

                      {/* Stock per branch */}
                      {branches.map((b) => {
                        const count = getProductStock(prod.id, b.id);
                        const isLow = count <= prod.minStockThreshold;
                        const isZero = count === 0;

                        return (
                          <td key={b.id} className="py-3 px-3 text-center font-mono">
                            <button
                              onClick={() => handleOpenAdjust(prod, b.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                isZero
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800/70 hover:bg-rose-900'
                                  : isLow
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800/70 hover:bg-amber-900'
                                  : 'bg-slate-950 text-emerald-400 border border-slate-800 hover:border-slate-700'
                              }`}
                              title="Click to manually adjust stock"
                            >
                              {isLow && <AlertTriangle className="w-2.5 h-2.5" />}
                              <span>{count}</span>
                            </button>
                          </td>
                        );
                      })}

                      {/* Quick Transfer trigger */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setTransferProductId(prod.id);
                            setIsTransferModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded text-[11px] font-medium transition-colors"
                        >
                          Transfer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Stock Transfers in Transit */}
      {activeTab === 'transfers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-100">Inter-Branch Stock Movement Logs</h3>
              <p className="text-xs text-slate-400">
                Track shipments dispatched between Central Logistics Hub and retail store branches.
              </p>
            </div>
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Transfer Order</span>
            </button>
          </div>

          <div className="space-y-3">
            {transfers.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No transfer orders found.</p>
            ) : (
              transfers.map((trf) => {
                const src = branches.find((b) => b.id === trf.sourceBranchId);
                const tgt = branches.find((b) => b.id === trf.targetBranchId);

                return (
                  <div
                    key={trf.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-indigo-400">
                          {trf.transferNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            trf.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : trf.status === 'in_transit'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {trf.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-2 text-xs text-slate-200">
                        <span className="font-semibold">{src?.name || 'Origin'}</span>
                        <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-semibold">{tgt?.name || 'Destination'}</span>
                      </div>

                      {/* Items */}
                      <div className="text-[11px] text-slate-400 font-mono">
                        {trf.items.map((i, idx) => (
                          <span key={idx}>
                            {i.quantity}x {i.productName}
                            {idx < trf.items.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>

                      {trf.notes && (
                        <div className="text-[10px] text-slate-500 italic">Note: {trf.notes}</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {trf.status === 'pending' && (
                        <button
                          onClick={() =>
                            dispatch(
                              updateTransferStatus({ transferId: trf.id, status: 'in_transit' })
                            )
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch (In Transit)</span>
                        </button>
                      )}

                      {trf.status === 'in_transit' && (
                        <button
                          onClick={() =>
                            dispatch(
                              updateTransferStatus({ transferId: trf.id, status: 'completed' })
                            )
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Receive &amp; Restock</span>
                        </button>
                      )}

                      {trf.status === 'completed' && (
                        <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Inventory Updated</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab: Low Stock Safety Alerts */}
      {activeTab === 'alerts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                Critical Safety Stock Threshold Alerts
              </h3>
              <p className="text-xs text-slate-400">
                Immediate replenishment required to prevent stockout in high-velocity retail stores.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lowStockAlerts.length === 0 ? (
              <div className="col-span-2 py-8 text-center text-xs text-slate-400">
                No items are currently below safety threshold! Inventory health is optimal.
              </div>
            ) : (
              lowStockAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950 border border-amber-900/60 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <h4 className="font-bold text-xs text-slate-100">{alert.product.name}</h4>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Location: <span className="text-slate-200">{alert.branchName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-rose-400 font-bold">
                        Current: {alert.currentStock} {alert.product.unit}s
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-400">
                        Min Safety: {alert.product.minStockThreshold} {alert.product.unit}s
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setTransferProductId(alert.product.id);
                      setTransferSource('warehouse-01');
                      setTransferTarget(alert.branchId);
                      setTransferQty(alert.product.minStockThreshold * 2);
                      setIsTransferModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
                  >
                    Transfer from Hub
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && adjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-100">Manual Stock Adjustment</h3>
            <p className="text-xs text-slate-400">
              Audit &amp; correct physical count for {adjustProduct.name} at{' '}
              {branches.find((b) => b.id === adjustBranchId)?.name}.
            </p>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Quantity on Hand ({adjustProduct.unit}s)
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 font-mono text-base font-bold px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-100">Create Stock Transfer Order</h3>
            <p className="text-xs text-slate-400">
              Dispatch inventory between warehouse hub and retail branches.
            </p>

            <form onSubmit={handleCreateTransfer} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Source Branch
                  </label>
                  <select
                    value={transferSource}
                    onChange={(e) => setTransferSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Branch
                  </label>
                  <select
                    value={transferTarget}
                    onChange={(e) => setTransferTarget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                  >
                    {branches
                      .filter((b) => b.id !== transferSource)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Product to Transfer
                </label>
                <select
                  value={transferProductId}
                  onChange={(e) => setTransferProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (SKU: {p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Transfer Note</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="e.g. Replenishment for weekend rush"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Create Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
