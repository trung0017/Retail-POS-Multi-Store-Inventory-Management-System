import React, { useRef, useEffect, useState } from 'react';
import { ScanBarcode, Plus, Sparkles, CornerDownLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { addToCart, setBarcodeInput } from '../../store/slices/posSlice';
import { sounds } from '../../utils/audio';
import { useTranslation } from '../../i18n/useTranslation';

export const BarcodeScannerBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t, language } = useTranslation();
  const barcodeInput = useAppSelector((state) => state.pos.barcodeInput);
  const products = useAppSelector((state) => state.inventory.products);
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  // Global hotkey F2 or key press to focus barcode scanner
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) && target !== inputRef.current) {
        return;
      }

      if (e.key === 'F2' || (e.key === '/' && target !== inputRef.current)) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScanSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const product = products.find(
      (p) =>
        p.barcode.toLowerCase() === code.toLowerCase() ||
        p.sku.toLowerCase() === code.toLowerCase()
    );

    if (product) {
      sounds.playScanBeep();
      dispatch(addToCart({ product, quantity: 1 }));
      setScanNotice(language === 'vi' ? `Đã quét: ${product.name}` : `Scanned: ${product.name}`);
      dispatch(setBarcodeInput(''));
      setTimeout(() => setScanNotice(null), 2500);
    } else {
      sounds.playErrorBeep();
      setScanNotice(language === 'vi' ? `Không tìm thấy mã vạch: ${code}` : `Item not found for barcode: ${code}`);
      setTimeout(() => setScanNotice(null), 3000);
    }
  };

  const handleQuickScan = (barcode: string) => {
    dispatch(setBarcodeInput(barcode));
    const product = products.find((p) => p.barcode === barcode);
    if (product) {
      sounds.playScanBeep();
      dispatch(addToCart({ product, quantity: 1 }));
      setScanNotice(language === 'vi' ? `Đã quét: ${product.name}` : `Scanned: ${product.name}`);
      dispatch(setBarcodeInput(''));
      setTimeout(() => setScanNotice(null), 2500);
    }
  };

  const quickSamples = [
    { name: language === 'vi' ? 'Cà Phê Cold Brew' : 'Cold Brew', code: '893456780001', price: '$4.50' },
    { name: language === 'vi' ? 'Snack Bơ Muối' : 'Avocado Chips', code: '893456780006', price: '$3.95' },
    { name: language === 'vi' ? 'Phô Mai Cheddar' : 'Cheddar Block', code: '893456780012', price: '$6.90' },
    { name: language === 'vi' ? 'Dầu Ô Liu Ý' : 'Olive Oil', code: '893456780020', price: '$16.50' },
  ];

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-3 shadow-lg">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Barcode Input Form */}
        <form onSubmit={handleScanSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-400">
              <ScanBarcode className="w-5 h-5 animate-pulse" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => dispatch(setBarcodeInput(e.target.value))}
              placeholder={t.scanPlaceholder}
              className="w-full bg-slate-950 border border-indigo-900/60 text-slate-100 placeholder:text-slate-500 pl-11 pr-24 py-2.5 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner tracking-wider"
              autoFocus
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              <span className="hidden sm:inline text-[11px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                ↵ ENTER
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium text-xs rounded-lg shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t.addItem}</span>
          </button>
        </form>

        {/* Barcode Quick Simulators */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.simulateScan}</span>
          </div>
          {quickSamples.map((sample) => (
            <button
              key={sample.code}
              type="button"
              onClick={() => handleQuickScan(sample.code)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 hover:border-indigo-600/60 border border-slate-700 rounded-md text-[11px] font-medium text-slate-200 transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <CornerDownLeft className="w-2.5 h-2.5 text-indigo-400" />
              <span>{sample.name}</span>
              <span className="font-mono text-emerald-400">{sample.price}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Realtime Scan Notice toast */}
      {scanNotice && (
        <div
          className={`mt-2 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-between ${
            scanNotice.includes('not found') || scanNotice.includes('Không tìm thấy')
              ? 'bg-rose-950/60 border border-rose-800 text-rose-300'
              : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
          }`}
        >
          <span>{scanNotice}</span>
          <span className="font-mono text-[10px] opacity-75">
            {language === 'vi' ? 'Đã thêm vào giỏ hàng' : 'Auto added to register'}
          </span>
        </div>
      )}
    </div>
  );
};
