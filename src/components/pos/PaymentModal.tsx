import React, { useState } from 'react';
import {
  X,
  Banknote,
  CreditCard,
  Split,
  CheckCircle2,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  closePaymentModal,
  clearCart,
  openReceiptModal,
} from '../../store/slices/posSlice';
import { addOrder } from '../../store/slices/ordersSlice';
import { deductStockForOrder } from '../../store/slices/inventorySlice';
import { recordTransactionSales } from '../../store/slices/shiftSlice';
import { Order, PaymentMethod, PaymentDetails } from '../../types';
import { sounds } from '../../utils/audio';
import { useTranslation } from '../../i18n/useTranslation';

export const PaymentModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t, language } = useTranslation();
  const isOpen = useAppSelector((state) => state.pos.isPaymentModalOpen);
  const cart = useAppSelector((state) => state.pos.cart);
  const activeBranchId = useAppSelector((state) => state.pos.activeBranchId);
  const currentCashier = useAppSelector((state) => state.pos.currentCashier);
  const networkStatus = useAppSelector((state) => state.pos.networkStatus);

  const [paymentMode, setPaymentMode] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [splitCashAmount, setSplitCashAmount] = useState<string>('');
  const [splitCardAmount, setSplitCardAmount] = useState<string>('');
  const [cardAuthCode, setCardAuthCode] = useState<string>('EMV-AUTH-9831');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen || cart.length === 0) return null;

  // Compute totals
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountAmount = cart.reduce((acc, item) => {
    return acc + (item.product.price * item.quantity) * (item.discountPercent / 100);
  }, 0);
  const taxAmount = cart.reduce((acc, item) => {
    const discounted = (item.product.price * item.quantity) * (1 - item.discountPercent / 100);
    return acc + discounted * item.product.taxRate;
  }, 0);
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

  // Cash computations
  const cashNum = parseFloat(cashTendered) || 0;
  const cashChangeDue = Math.max(0, cashNum - grandTotal);
  const isCashSufficient = cashNum >= grandTotal;

  // Split computations
  const splitCash = parseFloat(splitCashAmount) || 0;
  const splitCard = parseFloat(splitCardAmount) || 0;
  const splitTotal = splitCash + splitCard;
  const isSplitValid = Math.abs(splitTotal - grandTotal) < 0.01;

  const handleQuickCash = (amount: number) => {
    setCashTendered(amount.toString());
  };

  const handleSplitCashChange = (val: string) => {
    setSplitCashAmount(val);
    const parsed = parseFloat(val) || 0;
    const remaining = Math.max(0, grandTotal - parsed);
    setSplitCardAmount(remaining.toFixed(2));
  };

  const handleCompletePayment = () => {
    setIsProcessing(true);

    let paymentDetails: PaymentDetails;
    if (paymentMode === 'cash') {
      paymentDetails = {
        method: 'cash',
        cashPaid: cashNum,
        cardPaid: 0,
        changeDue: cashChangeDue,
      };
    } else if (paymentMode === 'card') {
      paymentDetails = {
        method: 'card',
        cashPaid: 0,
        cardPaid: grandTotal,
        changeDue: 0,
        cardReference: cardAuthCode,
      };
    } else {
      paymentDetails = {
        method: 'split',
        cashPaid: splitCash,
        cardPaid: splitCard,
        changeDue: 0,
        cardReference: cardAuthCode,
      };
    }

    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const isOffline = networkStatus === 'offline';
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      branchId: activeBranchId,
      cashierName: currentCashier,
      items: [...cart],
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal,
      paymentMethod: paymentMode,
      paymentDetails,
      status: isOffline ? 'pending_sync' : 'completed',
      offlineCreated: isOffline,
      createdAt: new Date().toISOString(),
      syncedAt: isOffline ? undefined : new Date().toISOString(),
    };

    setTimeout(() => {
      // 1. Add order to store
      dispatch(addOrder(newOrder));

      // 2. Deduct inventory
      dispatch(
        deductStockForOrder({
          branchId: activeBranchId,
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        })
      );

      // 3. Record in shift
      dispatch(
        recordTransactionSales({
          cash: paymentDetails.cashPaid - paymentDetails.changeDue,
          card: paymentDetails.cardPaid,
        })
      );

      sounds.playSuccessBeep();

      // 4. Close payment modal, clear cart, open 80mm receipt modal
      dispatch(closePaymentModal());
      dispatch(clearCart());
      dispatch(openReceiptModal(newOrder));

      setIsProcessing(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">{t.processCheckout}</h3>
              <p className="text-xs text-slate-400">{t.checkoutSubtitle}</p>
            </div>
          </div>
          <button
            onClick={() => dispatch(closePaymentModal())}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Total Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-baseline justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              {t.totalDue}
            </span>
            <span className="font-mono text-3xl font-extrabold text-emerald-400">
              ${grandTotal.toFixed(2)}
            </span>
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setPaymentMode('cash');
                setCashTendered(grandTotal.toFixed(2));
              }}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                paymentMode === 'cash'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span className="text-xs font-bold">{t.cash}</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('card')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                paymentMode === 'card'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-xs font-bold">{t.creditCard}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMode('split');
                const half = (grandTotal / 2).toFixed(2);
                setSplitCashAmount(half);
                setSplitCardAmount((grandTotal - parseFloat(half)).toFixed(2));
              }}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                paymentMode === 'split'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Split className="w-5 h-5" />
              <span className="text-xs font-bold">{t.splitTender}</span>
            </button>
          </div>

          {/* Payment Method Details */}
          {paymentMode === 'cash' && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="block text-xs font-medium text-slate-300">
                {t.amountTendered}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 font-mono text-lg font-bold pl-8 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Quick Cash Presets */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[grandTotal, 10, 20, 50, 100].map((preset) => {
                  const isExact = preset === grandTotal;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleQuickCash(parseFloat(preset.toFixed(2)))}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                    >
                      {isExact
                        ? `${language === 'vi' ? 'Đúng Số' : 'Exact'} ($${preset.toFixed(2)})`
                        : `$${preset}`}
                    </button>
                  );
                })}
              </div>

              {/* Change calculation */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">{t.changeDue}</span>
                <span
                  className={`font-mono text-xl font-bold ${
                    isCashSufficient ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isCashSufficient ? `$${cashChangeDue.toFixed(2)}` : t.insufficientTender}
                </span>
              </div>
            </div>
          )}

          {paymentMode === 'card' && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                  <CreditCard className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{t.emvTerminalReady}</h4>
                  <p className="text-[11px] text-slate-400">
                    {t.emvSubtitle}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {t.terminalAuthCode}
                </label>
                <input
                  type="text"
                  value={cardAuthCode}
                  onChange={(e) => setCardAuthCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {paymentMode === 'split' && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.cashPortion}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={splitCashAmount}
                    onChange={(e) => handleSplitCashChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm font-bold px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.cardPortion}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={splitCardAmount}
                    onChange={(e) => setSplitCardAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm font-bold px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">{t.allocatedRequired}</span>
                <span
                  className={`font-mono font-bold ${
                    isSplitValid ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  ${splitTotal.toFixed(2)} / ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => dispatch(closePaymentModal())}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>

          <button
            type="button"
            onClick={handleCompletePayment}
            disabled={
              isProcessing ||
              (paymentMode === 'cash' && !isCashSufficient) ||
              (paymentMode === 'split' && !isSplitValid)
            }
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <span>{t.authorizing}</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.confirmPayment} (${grandTotal.toFixed(2)})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
