import React from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  Copy,
  PlusCircle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeReceiptModal } from '../../store/slices/posSlice';

export const ThermalReceiptModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.pos.isReceiptModalOpen);
  const order = useAppSelector((state) => state.pos.recentCompletedOrder);
  const branches = useAppSelector((state) => state.inventory.branches);

  if (!isOpen || !order) return null;

  const branch = branches.find((b) => b.id === order.branchId) || branches[0];

  const handlePrint = () => {
    window.print();
  };

  const handleCopyReceiptText = () => {
    const lines = [
      `*** ${branch.name.toUpperCase()} ***`,
      branch.address,
      `Tel: ${branch.phone}`,
      `Order: ${order.orderNumber}`,
      `Date: ${new Date(order.createdAt).toLocaleString()}`,
      `Cashier: ${order.cashierName}`,
      '--------------------------------',
      ...order.items.map(
        (i) =>
          `${i.product.name.slice(0, 20)} x${i.quantity} = $${(
            i.product.price *
            i.quantity *
            (1 - i.discountPercent / 100)
          ).toFixed(2)}`
      ),
      '--------------------------------',
      `Subtotal: $${order.subtotal.toFixed(2)}`,
      `Discount: -$${order.discountAmount.toFixed(2)}`,
      `Tax: $${order.taxAmount.toFixed(2)}`,
      `GRAND TOTAL: $${order.grandTotal.toFixed(2)}`,
      `Paid by: ${order.paymentMethod.toUpperCase()}`,
      '*** THANK YOU FOR SHOPPING! ***',
    ].join('\n');

    navigator.clipboard.writeText(lines).then(() => {
      alert('Receipt plain text copied to clipboard!');
    }).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm text-slate-100">Transaction Complete</h3>
              <p className="text-[11px] text-slate-400">80mm Thermal Receipt Ready</p>
            </div>
          </div>
          <button
            onClick={() => dispatch(closeReceiptModal())}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Body Container */}
        <div className="flex-1 p-6 overflow-y-auto flex justify-center bg-slate-950/50">
          {/* Authentic 80mm Thermal Receipt (width approx 300px - 320px) */}
          <div
            id="thermal-receipt-printable"
            className="w-[310px] bg-white text-slate-950 p-5 rounded-sm shadow-xl font-mono text-xs leading-relaxed border border-slate-300"
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-0.5">
              <div className="font-extrabold text-sm uppercase tracking-wider">
                {branch.name}
              </div>
              <div className="text-[10px] text-slate-600">{branch.address}</div>
              <div className="text-[10px] text-slate-600">Tel: {branch.phone}</div>
              <div className="text-[10px] text-slate-500 font-sans mt-1">
                Tax ID: 94-8842109 · Store #{branch.code}
              </div>
            </div>

            {/* Transaction Metadata */}
            <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Order:</span>
                <span className="font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Date:</span>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Time:</span>
                <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Cashier:</span>
                <span>{order.cashierName}</span>
              </div>
              {order.offlineCreated && (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Mode:</span>
                  <span>OFFLINE REGISTER (LOCAL)</span>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="py-3 border-b border-dashed border-slate-400 space-y-2">
              <div className="flex justify-between font-bold text-[10px] text-slate-600 uppercase">
                <span>Description / Qty</span>
                <span>Amount</span>
              </div>

              {order.items.map((item, idx) => {
                const regularPrice = item.product.price * item.quantity;
                const finalItemPrice = regularPrice * (1 - item.discountPercent / 100);
                return (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold max-w-[200px] leading-tight">
                        {item.product.name}
                      </span>
                      <span className="font-bold font-mono">
                        ${finalItemPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>
                        {item.quantity} x ${item.product.price.toFixed(2)}
                      </span>
                      {item.discountPercent > 0 && (
                        <span className="text-red-600">Disc -{item.discountPercent}%</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals Calculation */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Savings / Discount:</span>
                  <span>-${order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Sales Tax:</span>
                <span>${order.taxAmount.toFixed(2)}</span>
              </div>
              <div className="pt-1.5 flex justify-between font-extrabold text-sm border-t border-slate-800">
                <span>TOTAL PAID:</span>
                <span>${order.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Tender Breakdown */}
            <div className="py-2 text-[10px] space-y-0.5 text-slate-700">
              <div className="flex justify-between">
                <span>Payment Tender:</span>
                <span className="font-bold uppercase">{order.paymentMethod}</span>
              </div>
              {order.paymentDetails.cashPaid > 0 && (
                <div className="flex justify-between">
                  <span>Cash Tendered:</span>
                  <span>${order.paymentDetails.cashPaid.toFixed(2)}</span>
                </div>
              )}
              {order.paymentDetails.cardPaid > 0 && (
                <div className="flex justify-between">
                  <span>Card Charged:</span>
                  <span>${order.paymentDetails.cardPaid.toFixed(2)}</span>
                </div>
              )}
              {order.paymentDetails.changeDue > 0 && (
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Change Given:</span>
                  <span>${order.paymentDetails.changeDue.toFixed(2)}</span>
                </div>
              )}
              {order.paymentDetails.cardReference && (
                <div className="flex justify-between">
                  <span>Auth Ref:</span>
                  <span>{order.paymentDetails.cardReference}</span>
                </div>
              )}
            </div>

            {/* Barcode & Footer Greeting */}
            <div className="pt-4 text-center space-y-2">
              {/* Simulated barcode */}
              <div className="flex flex-col items-center">
                <div className="font-mono text-xs tracking-[5px] font-bold">
                  ||| | || |||| | ||||| |||
                </div>
                <span className="text-[9px] text-slate-500 font-mono tracking-widest mt-0.5">
                  {order.orderNumber}
                </span>
              </div>
              <div className="text-[10px] text-slate-600 italic">
                Thank you for your business!<br />
                Please retain receipt for 30-day exchange.
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print 80mm</span>
            </button>
            <button
              onClick={handleCopyReceiptText}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Text</span>
            </button>
          </div>

          <button
            onClick={() => dispatch(closeReceiptModal())}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Next Customer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
