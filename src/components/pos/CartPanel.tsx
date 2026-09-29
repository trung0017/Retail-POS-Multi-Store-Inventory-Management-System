import React, { useState } from 'react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Percent,
  CreditCard,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  updateCartItemQuantity,
  updateCartItemDiscount,
  removeFromCart,
  clearCart,
  applyCartDiscount,
  openPaymentModal,
} from '../../store/slices/posSlice';
import { useTranslation } from '../../i18n/useTranslation';

export const CartPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const cart = useAppSelector((state) => state.pos.cart);
  const activeDiscountPercent = useAppSelector((state) => state.pos.activeDiscountPercent);
  const [showDiscountRow, setShowDiscountRow] = useState(false);
  const [customDiscount, setCustomDiscount] = useState('');

  // Calculations
  const subtotal = cart.reduce((acc, item) => {
    return acc + item.product.price * item.quantity;
  }, 0);

  const discountAmount = cart.reduce((acc, item) => {
    const itemSubtotal = item.product.price * item.quantity;
    return acc + itemSubtotal * (item.discountPercent / 100);
  }, 0);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = cart.reduce((acc, item) => {
    const discountedItemTotal = (item.product.price * item.quantity) * (1 - item.discountPercent / 100);
    return acc + discountedItemTotal * item.product.taxRate;
  }, 0);

  const grandTotal = Math.max(0, taxableAmount + taxAmount);
  const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleApplyCustomDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customDiscount);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      dispatch(applyCartDiscount(val));
      setCustomDiscount('');
      setShowDiscountRow(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Cart Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-900/60">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">{t.currentCart}</h3>
            <p className="text-[11px] text-slate-400">
              {totalItemCount} {totalItemCount === 1 ? t.itemInBasket : t.itemsInBasket}
            </p>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            onClick={() => dispatch(clearCart())}
            title={t.clear}
            className="flex items-center gap-1 text-[11px] font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 px-2 py-1 rounded transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clear}</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mb-3">
              <ShoppingCart className="w-6 h-6 text-slate-600" />
            </div>
            <p className="font-medium text-xs text-slate-300">{t.cartEmpty}</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
              {t.cartEmptySubtitle}
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const itemOriginalPrice = item.product.price * item.quantity;
            const itemDiscount = itemOriginalPrice * (item.discountPercent / 100);
            const itemFinalPrice = itemOriginalPrice - itemDiscount;

            return (
              <div
                key={item.product.id}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-xs text-slate-100 truncate">
                      {item.product.name}
                    </h5>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>${item.product.price.toFixed(2)} / {item.product.unit}</span>
                      <span>·</span>
                      <span>{item.product.sku}</span>
                      {item.discountPercent > 0 && (
                        <span className="text-amber-400 font-sans font-medium">
                          -{item.discountPercent}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Item Subtotal */}
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-emerald-400">
                      ${itemFinalPrice.toFixed(2)}
                    </div>
                    {itemDiscount > 0 && (
                      <div className="font-mono text-[10px] text-slate-500 line-through">
                        ${itemOriginalPrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stepper & Controls */}
                <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between">
                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-800">
                    <button
                      onClick={() =>
                        dispatch(
                          updateCartItemQuantity({
                            productId: item.product.id,
                            quantity: item.quantity - 1,
                          })
                        )
                      }
                      className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono text-xs font-bold text-slate-100 w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        dispatch(
                          updateCartItemQuantity({
                            productId: item.product.id,
                            quantity: item.quantity + 1,
                          })
                        )
                      }
                      className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Per-item Quick Discount */}
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1 text-[10px]">
                      {[0, 10, 20].map((d) => (
                        <button
                          key={d}
                          onClick={() =>
                            dispatch(
                              updateCartItemDiscount({
                                productId: item.product.id,
                                discountPercent: d,
                              })
                            )
                          }
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                            item.discountPercent === d
                              ? 'bg-amber-900/60 text-amber-300 border border-amber-700 font-bold'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {d}%
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => dispatch(removeFromCart(item.product.id))}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors ml-1 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Global Discount Row */}
      {cart.length > 0 && (
        <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Tag className="w-3 h-3 text-indigo-400" />
              <span>{t.cartDiscount}</span>
            </span>
            <div className="flex items-center gap-1">
              {[0, 5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  onClick={() => dispatch(applyCartDiscount(pct))}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                    activeDiscountPercent === pct
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {pct}%
                </button>
              ))}
              <button
                onClick={() => setShowDiscountRow(!showDiscountRow)}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 hover:text-indigo-300 border border-slate-800 cursor-pointer"
              >
                {t.customDiscount}
              </button>
            </div>
          </div>

          {showDiscountRow && (
            <form onSubmit={handleApplyCustomDiscount} className="flex items-center gap-2 mt-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={customDiscount}
                  onChange={(e) => setCustomDiscount(e.target.value)}
                  placeholder="Custom % (0-100)"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
                <Percent className="w-3 h-3 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-500 cursor-pointer"
              >
                {t.apply}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Financial Breakdown & Checkout Button */}
      <div className="p-3.5 bg-slate-950 border-t border-slate-800 space-y-2">
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>{t.subtotal}</span>
            <span className="font-mono text-slate-200">${subtotal.toFixed(2)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-amber-400">
              <span>{t.discountsApplied}</span>
              <span className="font-mono">-${discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-400">
            <span>{t.salesTax} (Est. 8%)</span>
            <span className="font-mono text-slate-200">${taxAmount.toFixed(2)}</span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
            <span className="font-bold text-sm text-slate-100">{t.grandTotal}</span>
            <span className="font-mono font-extrabold text-2xl text-emerald-400 tracking-tight">
              ${grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={() => dispatch(openPaymentModal())}
          disabled={cart.length === 0}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
        >
          <CreditCard className="w-5 h-5" />
          <span>{t.payCheckout}</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};
