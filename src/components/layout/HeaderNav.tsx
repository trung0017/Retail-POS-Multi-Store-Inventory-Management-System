import React, { useState, useEffect } from 'react';
import {
  Store,
  Layers,
  Receipt,
  FileSpreadsheet,
  BarChart3,
  Wifi,
  WifiOff,
  RefreshCw,
  User,
  Clock,
  Warehouse,
  Globe,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setActiveBranch,
  toggleNetworkStatus,
  setLanguage,
} from '../../store/slices/posSlice';
import { startSyncing, finishSyncingSuccess } from '../../store/slices/ordersSlice';
import { useTranslation } from '../../i18n/useTranslation';

interface HeaderNavProps {
  activeTab: 'pos' | 'inventory' | 'orders' | 'shift' | 'analytics';
  setActiveTab: (tab: 'pos' | 'inventory' | 'orders' | 'shift' | 'analytics') => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ activeTab, setActiveTab }) => {
  const dispatch = useAppDispatch();
  const { t, language } = useTranslation();
  const branches = useAppSelector((state) => state.inventory.branches);
  const activeBranchId = useAppSelector((state) => state.pos.activeBranchId);
  const currentCashier = useAppSelector((state) => state.pos.currentCashier);
  const networkStatus = useAppSelector((state) => state.pos.networkStatus);
  const offlineQueue = useAppSelector((state) => state.orders.offlineSyncQueue);
  const isSyncing = useAppSelector((state) => state.orders.isSyncing);

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSync = () => {
    if (networkStatus === 'offline') return;
    dispatch(startSyncing());
    setTimeout(() => {
      dispatch(finishSyncingSuccess());
    }, 1200);
  };

  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      <div className="px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">{t.appTitle}</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  v2.4 Core
                </span>
              </div>
              <p className="text-xs text-slate-400">{t.appSubtitle}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'pos'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>{t.tabRegister}</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'inventory'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t.tabInventory}</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'orders'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>{t.tabOrders}</span>
            </button>

            <button
              onClick={() => setActiveTab('shift')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'shift'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{t.tabShift}</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{t.tabAnalytics}</span>
            </button>
          </nav>
        </div>

        {/* Right: Language Switcher, Branch Selector, Network Status, Cashier, Clock */}
        <div className="flex items-center gap-2.5">
          {/* Language Switcher (EN / VI) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 shadow-inner">
            <Globe className="w-3.5 h-3.5 text-indigo-400 ml-1.5 mr-1" />
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => dispatch(setLanguage('en'))}
                title="Switch to English"
                className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => dispatch(setLanguage('vi'))}
                title="Chuyển sang Tiếng Việt"
                className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  language === 'vi'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                VI
              </button>
            </div>
          </div>

          {/* Active Branch Selector */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            {activeBranch.isWarehouse ? (
              <Warehouse className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Store className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div className="text-left">
              <label htmlFor="branch-select" className="text-[10px] text-slate-500 block uppercase font-semibold">
                {t.storeLocation}
              </label>
              <select
                id="branch-select"
                value={activeBranchId}
                onChange={(e) => dispatch(setActiveBranch(e.target.value))}
                className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Online/Offline Status Indicator & Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(toggleNetworkStatus())}
              title="Click to toggle Online/Offline simulation"
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                networkStatus === 'online'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-amber-950/50 border-amber-700/80 text-amber-300 hover:bg-amber-900/50 animate-pulse'
              }`}
            >
              {networkStatus === 'online' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80"></span>
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.online}</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.offlineMode}</span>
                </>
              )}
            </button>

            {/* Offline sync queue badge & manual trigger */}
            {offlineQueue.length > 0 && (
              <button
                onClick={handleSync}
                disabled={networkStatus === 'offline' || isSyncing}
                title={
                  networkStatus === 'offline'
                    ? 'Go Online to sync pending transactions'
                    : 'Click to sync offline transactions'
                }
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-950 border border-indigo-700/70 text-indigo-200 rounded-lg text-xs font-medium hover:bg-indigo-900 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{t.sync} ({offlineQueue.length})</span>
              </button>
            )}
          </div>

          {/* Cashier Info */}
          <div className="hidden md:flex items-center gap-2 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-400 block leading-tight">{t.cashier}</span>
              <span className="text-xs font-medium text-slate-200 block leading-tight truncate max-w-[110px]">
                {currentCashier.split(' ')[0]}
              </span>
            </div>
          </div>

          {/* Live Clock */}
          <div className="hidden xl:flex items-center gap-1.5 text-slate-400 font-mono text-xs bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentTime}</span>
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="flex lg:hidden items-center justify-around bg-slate-950 px-2 py-2 border-t border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex flex-col items-center gap-1 px-2 py-1 ${
            activeTab === 'pos' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>{t.tabRegister}</span>
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center gap-1 px-2 py-1 ${
            activeTab === 'inventory' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t.tabInventory}</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-1 px-2 py-1 ${
            activeTab === 'orders' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>{t.tabOrders}</span>
        </button>
        <button
          onClick={() => setActiveTab('shift')}
          className={`flex flex-col items-center gap-1 px-2 py-1 ${
            activeTab === 'shift' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{t.tabShift}</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 px-2 py-1 ${
            activeTab === 'analytics' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{t.tabAnalytics}</span>
        </button>
      </div>
    </header>
  );
};
