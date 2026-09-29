import React, { useState, useMemo } from 'react';
import { Search, AlertTriangle, Check, Plus, Package } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { addToCart, setActiveCategory, setSearchQuery } from '../../store/slices/posSlice';
import { SEED_CATEGORIES } from '../../data/seedData';
import { sounds } from '../../utils/audio';
import { useTranslation } from '../../i18n/useTranslation';

export const ProductGrid: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t, language } = useTranslation();
  const products = useAppSelector((state) => state.inventory.products);
  const stock = useAppSelector((state) => state.inventory.stock);
  const activeBranchId = useAppSelector((state) => state.pos.activeBranchId);
  const activeCategory = useAppSelector((state) => state.pos.activeCategory);
  const searchQuery = useAppSelector((state) => state.pos.searchQuery);

  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  // Category translation mapping
  const categoryName = (cat: string) => {
    if (language !== 'vi') return cat;
    switch (cat) {
      case 'All Products': return 'Tất Cả Sản Phẩm';
      case 'Beverages': return 'Đồ Uống & Nước Giải Khát';
      case 'Snacks & Confectionery': return 'Bánh Kẹo & Ăn Vặt';
      case 'Dairy & Fresh': return 'Sữa & Thực Phẩm Tươi';
      case 'Bakery & Deli': return 'Bánh Mì & Deli';
      case 'Pantry & Staples': return 'Gia Vị & Đồ Khô';
      case 'Personal Care': return 'Chăm Sóc Cá Nhân';
      case 'Household': return 'Hàng Tiêu Dùng Gia Đình';
      default: return cat;
    }
  };

  // Filter products by category and search text
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesCategory =
        activeCategory === 'All Products' || prod.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        prod.sku.toLowerCase().includes(q) ||
        prod.barcode.toLowerCase().includes(q) ||
        prod.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const handleProductClick = (product: typeof products[0]) => {
    sounds.playScanBeep();
    dispatch(addToCart({ product, quantity: 1 }));
    setLastAddedId(product.id);
    setTimeout(() => setLastAddedId(null), 500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Search & Category Filter Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/95 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            placeholder={t.searchPlaceholder}
            className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 pl-10 pr-4 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => dispatch(setSearchQuery(''))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              {t.clear}
            </button>
          )}
        </div>

        {/* Category Horizontal Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SEED_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => dispatch(setActiveCategory(cat))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
                }`}
              >
                {categoryName(cat)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Items Grid */}
      <div className="flex-1 p-3 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Package className="w-10 h-10 text-slate-600 stroke-1" />
            <p className="text-sm">
              {t.noItemsFound} &quot;{searchQuery}&quot;
            </p>
            <button
              onClick={() => {
                dispatch(setSearchQuery(''));
                dispatch(setActiveCategory('All Products'));
              }}
              className="text-xs text-indigo-400 hover:underline mt-1 cursor-pointer"
            >
              {t.resetFilters}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filteredProducts.map((prod) => {
              const stockRecord = stock.find(
                (s) => s.branchId === activeBranchId && s.productId === prod.id
              );
              const branchStock = stockRecord ? stockRecord.quantity : 0;
              const isLowStock = branchStock <= prod.minStockThreshold;
              const isOutOfStock = branchStock <= 0;
              const isRecentlyAdded = lastAddedId === prod.id;

              return (
                <button
                  key={prod.id}
                  onClick={() => handleProductClick(prod)}
                  className={`group relative text-left p-3 rounded-xl border transition-all flex flex-col justify-between bg-slate-950/70 hover:bg-slate-800/80 active:scale-[0.98] ${
                    isRecentlyAdded
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : isLowStock
                      ? 'border-amber-900/60 hover:border-amber-700/80'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Category subtle label & Stock level */}
                  <div className="flex items-start justify-between gap-1 w-full text-[10px] text-slate-400 mb-1">
                    <span className="truncate">{categoryName(prod.category)}</span>
                    <div
                      className={`flex items-center gap-1 font-mono font-medium px-1.5 py-0.5 rounded text-[10px] ${
                        isOutOfStock
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : isLowStock
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800/80 text-emerald-400'
                      }`}
                    >
                      {isLowStock && <AlertTriangle className="w-2.5 h-2.5 shrink-0" />}
                      <span>{branchStock} {prod.unit}s</span>
                    </div>
                  </div>

                  {/* Product Title */}
                  <div className="my-1.5 flex-1">
                    <h4 className="font-semibold text-xs text-slate-100 group-hover:text-white line-clamp-2 leading-snug">
                      {prod.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {prod.sku}
                    </p>
                  </div>

                  {/* Bottom Row: Price & Add Icon */}
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between w-full">
                    <div>
                      <span className="font-mono font-bold text-sm text-emerald-400">
                        ${prod.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        +{(prod.taxRate * 100).toFixed(0)}% {t.tax}
                      </span>
                    </div>

                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        isRecentlyAdded
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white'
                      }`}
                    >
                      {isRecentlyAdded ? (
                        <Check className="w-3.5 h-3.5 animate-bounce" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>

                  {/* Low stock badge */}
                  {isLowStock && !isOutOfStock && (
                    <div className="absolute top-1 left-1.5 flex items-center gap-1 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                      <span>{t.lowStockAlert}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
