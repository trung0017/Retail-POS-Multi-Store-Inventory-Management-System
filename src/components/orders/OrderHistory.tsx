import React, { useState } from 'react';
import {
  Search,
  RefreshCw,
  Eye,
  RotateCcw,
  WifiOff,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { openReceiptModal } from '../../store/slices/posSlice';
import {
  startSyncing,
  finishSyncingSuccess,
  refundOrder,
} from '../../store/slices/ordersSlice';

export const OrderHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const orders = useAppSelector((state) => state.orders.orders);
  const branches = useAppSelector((state) => state.inventory.branches);
  const networkStatus = useAppSelector((state) => state.pos.networkStatus);
  const isSyncing = useAppSelector((state) => state.orders.isSyncing);

  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');

  const handleSyncAll = () => {
    if (networkStatus === 'offline') return;
    dispatch(startSyncing());
    setTimeout(() => {
      dispatch(finishSyncingSuccess());
    }, 1200);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesBranch = selectedBranch === 'all' || o.branchId === selectedBranch;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.cashierName.toLowerCase().includes(q) ||
      o.items.some((i) => i.product.name.toLowerCase().includes(q));
    return matchesBranch && matchesSearch;
  });

  const pendingCount = orders.filter(
    (o) => o.status === 'pending_sync' || o.offlineCreated
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100">Transaction &amp; Order Audit</h2>
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>{pendingCount} Pending Server Sync</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Full fiscal audit trail with offline resilience, receipt reprints, and returns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              onClick={handleSyncAll}
              disabled={networkStatus === 'offline' || isSyncing}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync All to Cloud</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order #, Cashier, or Product..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Branch:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Stores &amp; Hubs</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Order ID &amp; Time</th>
                <th className="py-3 px-3">Store Location</th>
                <th className="py-3 px-3">Cashier</th>
                <th className="py-3 px-3">Items Summary</th>
                <th className="py-3 px-3">Payment Tender</th>
                <th className="py-3 px-3 text-right">Total Amount</th>
                <th className="py-3 px-3 text-center">Sync Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No orders matching search filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const branchObj = branches.find((b) => b.id === ord.branchId);

                  return (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-100">{ord.orderNumber}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-600" />
                          <span>{new Date(ord.createdAt).toLocaleString()}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        {branchObj?.name || ord.branchId}
                      </td>

                      <td className="py-3 px-3 text-slate-300">{ord.cashierName}</td>

                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="truncate text-slate-200 font-mono text-[11px]">
                          {ord.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ')}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {ord.items.reduce((acc, i) => acc + i.quantity, 0)} items total
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span className="uppercase text-[11px] font-bold text-slate-200">
                          {ord.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 text-sm">
                        ${ord.grandTotal.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {ord.status === 'refunded' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                            Refunded
                          </span>
                        ) : ord.status === 'pending_sync' || ord.offlineCreated ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            <WifiOff className="w-2.5 h-2.5" />
                            <span>Offline Local</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Synced Cloud</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => dispatch(openReceiptModal(ord))}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                            title="Reprint 80mm Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {ord.status !== 'refunded' && (
                            <button
                              onClick={() => {
                                if (confirm(`Issue refund for order ${ord.orderNumber}?`)) {
                                  dispatch(refundOrder(ord.id));
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                              title="Process Refund"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
