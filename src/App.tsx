import React, { useState } from 'react';
import { HeaderNav } from './components/layout/HeaderNav';
import { BarcodeScannerBar } from './components/pos/BarcodeScannerBar';
import { ProductGrid } from './components/pos/ProductGrid';
import { CartPanel } from './components/pos/CartPanel';
import { PaymentModal } from './components/pos/PaymentModal';
import { ThermalReceiptModal } from './components/pos/ThermalReceiptModal';
import { InventoryManager } from './components/inventory/InventoryManager';
import { OrderHistory } from './components/orders/OrderHistory';
import { ZReportView } from './components/shift/ZReportView';
import { AnalyticsView } from './components/analytics/AnalyticsView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'orders' | 'shift' | 'analytics'>('pos');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-600/30 selection:text-indigo-200">
      {/* Top Fixed Header with Store Selector and Status */}
      <HeaderNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 p-3 md:p-4 max-w-[1720px] w-full mx-auto overflow-hidden">
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 h-[calc(100vh-5.5rem)]">
            {/* Left 8 Cols: Barcode scanner + Catalog grid */}
            <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-3.5 h-full min-h-0">
              <BarcodeScannerBar />
              <div className="flex-1 min-h-0">
                <ProductGrid />
              </div>
            </div>

            {/* Right 4 Cols: Register Cart & Instant Checkout */}
            <div className="lg:col-span-4 xl:col-span-4 h-full min-h-0">
              <CartPanel />
            </div>
          </div>
        )}

        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'orders' && <OrderHistory />}
        {activeTab === 'shift' && <ZReportView />}
        {activeTab === 'analytics' && <AnalyticsView />}
      </main>

      {/* Global Interactive Modals */}
      <PaymentModal />
      <ThermalReceiptModal />
    </div>
  );
};

export default App;
