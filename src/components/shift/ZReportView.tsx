import React, { useState } from 'react';
import {
  Download,
  Printer,
  Lock,
  Unlock,
  PlusCircle,
  ArrowDownCircle,
  History,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  recordCashDrop,
  closeShift,
  startNewShift,
} from '../../store/slices/shiftSlice';
import { useTranslation } from '../../i18n/useTranslation';

export const ZReportView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t, language } = useTranslation();
  const currentShift = useAppSelector((state) => state.shift.currentShift);
  const shiftHistory = useAppSelector((state) => state.shift.shiftHistory);
  const branches = useAppSelector((state) => state.inventory.branches);
  const activeBranchId = useAppSelector((state) => state.pos.activeBranchId);
  const currentCashier = useAppSelector((state) => state.pos.currentCashier);

  const [isCashDropModalOpen, setIsCashDropModalOpen] = useState(false);
  const [cashDropAmount, setCashDropAmount] = useState('');

  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [actualCountedCash, setActualCountedCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  const [isNewShiftModalOpen, setIsNewShiftModalOpen] = useState(false);
  const [newOpeningFloat, setNewOpeningFloat] = useState('200.00');

  const branch = branches.find((b) => b.id === currentShift.branchId) || branches[0];

  const expectedCashInDrawer =
    currentShift.openingFloat + currentShift.cashSales - currentShift.cashDrop;

  const handleCashDrop = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(cashDropAmount);
    if (!isNaN(val) && val > 0) {
      dispatch(recordCashDrop(val));
      setCashDropAmount('');
      setIsCashDropModalOpen(false);
    }
  };

  const handleConfirmCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    const counted = parseFloat(actualCountedCash);
    if (!isNaN(counted) && counted >= 0) {
      dispatch(closeShift({ actualCountedCash: counted, notes: closingNotes }));
      setIsCloseShiftModalOpen(false);
    }
  };

  const handleStartShift = (e: React.FormEvent) => {
    e.preventDefault();
    const flt = parseFloat(newOpeningFloat) || 0;
    dispatch(
      startNewShift({
        branchId: activeBranchId,
        cashierName: currentCashier,
        openingFloat: flt,
      })
    );
    setIsNewShiftModalOpen(false);
  };

  const handleExportCSV = () => {
    const rows = [
      [language === 'vi' ? 'BÁO CÁO CA & ĐỐI SOÁT TÀI CHÍNH' : 'Z-REPORT RECONCILIATION & AUDIT EXPORT'],
      [language === 'vi' ? 'Chi Nhánh' : 'Branch', branch.name],
      [language === 'vi' ? 'Thu Ngân' : 'Cashier', currentShift.cashierName],
      [language === 'vi' ? 'Mở Ca Lúc' : 'Shift Opened At', new Date(currentShift.openedAt).toLocaleString()],
      [language === 'vi' ? 'Đóng Ca Lúc' : 'Shift Closed At', currentShift.closedAt ? new Date(currentShift.closedAt).toLocaleString() : 'ACTIVE'],
      [language === 'vi' ? 'Tổng Số Đơn' : 'Total Orders', currentShift.orderCount.toString()],
      [language === 'vi' ? 'Tiền Vốn Đầu Ca ($)' : 'Opening Float ($)', currentShift.openingFloat.toFixed(2)],
      [language === 'vi' ? 'Doanh Thu Tiền Mặt ($)' : 'Gross Cash Sales ($)', currentShift.cashSales.toFixed(2)],
      [language === 'vi' ? 'Doanh Thu Qua Thẻ ($)' : 'Gross Card Sales ($)', currentShift.cardSales.toFixed(2)],
      [language === 'vi' ? 'Tổng Doanh Thu ($)' : 'Total Gross Revenue ($)', currentShift.totalSales.toFixed(2)],
      [language === 'vi' ? 'Rút Tiền Về Két ($)' : 'Cash Drops to Safe ($)', currentShift.cashDrop.toFixed(2)],
      [language === 'vi' ? 'Tiền Ngăn Kéo Tính Toán ($)' : 'System Expected Cash ($)', expectedCashInDrawer.toFixed(2)],
      [language === 'vi' ? 'Tiền Đếm Thực Tế ($)' : 'Actual Counted Cash ($)', (currentShift.actualCountedCash ?? 0).toFixed(2)],
      [language === 'vi' ? 'Chênh Lệch ($)' : 'Discrepancy ($)', (currentShift.discrepancy ?? 0).toFixed(2)],
      [language === 'vi' ? 'Ghi Chú' : 'Notes', currentShift.notes || 'None'],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Z_Report_${branch.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintZReport = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100">{t.zReportTitle}</h2>
            <span
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                currentShift.isClosed
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {currentShift.isClosed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span>{currentShift.isClosed ? t.shiftClosedAudited : t.activeShiftOpen}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{t.zReportSubtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportCSV}</span>
          </button>

          <button
            onClick={handlePrintZReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.printReport}</span>
          </button>

          {!currentShift.isClosed ? (
            <button
              onClick={() => {
                setActualCountedCash(expectedCashInDrawer.toFixed(2));
                setIsCloseShiftModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t.closeShiftReconcile}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsNewShiftModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t.openNewShift}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Shift Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Card 1: Gross Sales */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            {t.totalRevenue}
          </span>
          <div className="font-mono text-2xl font-bold text-white mt-1">
            ${currentShift.totalSales.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {currentShift.orderCount} {t.transactionsProcessed}
          </div>
        </div>

        {/* Card 2: Cash vs Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            {t.tenderSplit}
          </span>
          <div className="flex items-center justify-between mt-1 text-xs font-mono">
            <span className="text-slate-300">{t.cashSales}:</span>
            <span className="text-emerald-400 font-bold">${currentShift.cashSales.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono mt-0.5">
            <span className="text-slate-300">{t.cardSales}:</span>
            <span className="text-indigo-400 font-bold">${currentShift.cardSales.toFixed(2)}</span>
          </div>
        </div>

        {/* Card 3: Opening Float & Cash Drops */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              {t.drawerFloatDrops}
            </span>
            {!currentShift.isClosed && (
              <button
                onClick={() => setIsCashDropModalOpen(true)}
                className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
              >
                {t.dropToSafe}
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-1 text-xs font-mono">
            <span className="text-slate-300">{t.openingFloat}:</span>
            <span className="text-slate-100">${currentShift.openingFloat.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono mt-0.5">
            <span className="text-slate-300">{t.cashDrops}:</span>
            <span className="text-amber-400">-${currentShift.cashDrop.toFixed(2)}</span>
          </div>
        </div>

        {/* Card 4: Drawer Status & Reconciliation */}
        <div
          className={`p-4 rounded-xl border shadow-md ${
            currentShift.isClosed && currentShift.discrepancy !== 0
              ? 'bg-amber-950/40 border-amber-800/80'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            {t.drawerExpectedTotal}
          </span>
          <div className="font-mono text-2xl font-bold text-emerald-400 mt-1">
            ${expectedCashInDrawer.toFixed(2)}
          </div>
          {currentShift.isClosed ? (
            <div className="text-[11px] font-mono mt-1">
              {language === 'vi' ? 'Đếm:' : 'Counted:'} ${(currentShift.actualCountedCash ?? 0).toFixed(2)} (
              <span
                className={
                  (currentShift.discrepancy ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }
              >
                {(currentShift.discrepancy ?? 0) >= 0 ? '+' : ''}
                {(currentShift.discrepancy ?? 0).toFixed(2)}
              </span>
              )
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 mt-1">{t.drawerInSession}</div>
          )}
        </div>
      </div>

      {/* Printable Z-Report Official Document Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5 max-w-3xl mx-auto">
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs uppercase text-indigo-400 tracking-wider">
              {t.officialZReport}
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">{branch.name}</h3>
            <p className="text-xs text-slate-400 font-mono">
              Store #{branch.code} · Session ID: {currentShift.id}
            </p>
          </div>

          <div className="text-right text-xs text-slate-400 font-mono space-y-0.5">
            <div>{language === 'vi' ? 'Mở ca:' : 'Opened:'} {new Date(currentShift.openedAt).toLocaleTimeString()}</div>
            <div>
              {language === 'vi' ? 'Đóng ca:' : 'Closed:'}{' '}
              {currentShift.closedAt
                ? new Date(currentShift.closedAt).toLocaleTimeString()
                : (language === 'vi' ? 'ĐANG CHẠY' : 'PENDING')}
            </div>
            <div>{t.cashier}: {currentShift.cashierName}</div>
          </div>
        </div>

        {/* Detailed Financial Ledger */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-300 font-medium">{t.openingCashFloat}</span>
            <span className="font-mono text-slate-100">${currentShift.openingFloat.toFixed(2)}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-300 font-medium">{t.grossCashCollected}</span>
            <span className="font-mono text-emerald-400">+${currentShift.cashSales.toFixed(2)}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-300 font-medium">{t.midshiftDrops}</span>
            <span className="font-mono text-amber-400">-${currentShift.cashDrop.toFixed(2)}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-700 font-bold bg-slate-950/40 px-2 rounded">
            <span className="text-slate-100">{t.systemExpectedCash}</span>
            <span className="font-mono text-emerald-400">${expectedCashInDrawer.toFixed(2)}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-300 font-medium">{t.integratedCardSales}</span>
            <span className="font-mono text-indigo-400">${currentShift.cardSales.toFixed(2)}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-800/80">
            <span className="text-slate-300 font-medium">{t.totalFiscalRevenue}</span>
            <span className="font-mono font-bold text-white">${currentShift.totalSales.toFixed(2)}</span>
          </div>

          {currentShift.isClosed && (
            <div className="pt-2 space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-300 font-medium">{t.actualPhysicalCash}</span>
                <span className="font-mono font-bold text-white">
                  ${(currentShift.actualCountedCash ?? 0).toFixed(2)}
                </span>
              </div>

              <div
                className={`flex justify-between py-2 px-2 rounded font-bold ${
                  (currentShift.discrepancy ?? 0) === 0
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                }`}
              >
                <span>
                  {(currentShift.discrepancy ?? 0) === 0
                    ? t.drawerBalanced
                    : (currentShift.discrepancy ?? 0) > 0
                    ? t.drawerOver
                    : t.drawerShort}
                </span>
                <span className="font-mono">
                  {(currentShift.discrepancy ?? 0) >= 0 ? '+' : ''}
                  ${(currentShift.discrepancy ?? 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {currentShift.notes && (
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 block font-semibold">{t.reconciliationNotes}:</span>
            <p className="text-slate-200 mt-1 italic">{currentShift.notes}</p>
          </div>
        )}
      </div>

      {/* Historical Z-Reports */}
      {shiftHistory.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <h4 className="font-bold text-sm text-slate-100">
              {language === 'vi' ? 'Lịch Sử Lưu Trữ Ca Đã Đóng' : 'Shift Reconciliation Archive'}
            </h4>
          </div>
          <div className="space-y-2">
            {shiftHistory.map((sh) => (
              <div
                key={sh.id}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-mono font-bold text-slate-200">{sh.id}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {language === 'vi' ? 'Đóng:' : 'Closed:'} {sh.closedAt ? new Date(sh.closedAt).toLocaleString() : 'N/A'} · {t.cashier}: {sh.cashierName}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-emerald-400">${sh.totalSales.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-400">
                    {language === 'vi' ? 'Chênh lệch:' : 'Discrepancy:'} ${(sh.discrepancy ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cash Drop Modal */}
      {isCashDropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-slate-100">{t.recordCashDrop}</h3>
            </div>
            <p className="text-xs text-slate-400">
              {language === 'vi'
                ? 'Chuyển bớt lượng tiền mặt dư thừa từ ngăn kéo vào két sắt an toàn.'
                : 'Transfer excess currency from register drawer to the back-office drop safe.'}
            </p>

            <form onSubmit={handleCashDrop} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.dropAmount}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={expectedCashInDrawer}
                  value={cashDropAmount}
                  onChange={(e) => setCashDropAmount(e.target.value)}
                  placeholder="e.g. 150.00"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 font-mono text-base font-bold px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCashDropModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  {t.confirmCashDrop}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {isCloseShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-rose-400" />
              <h3 className="font-bold text-base text-slate-100">{t.endShiftTitle}</h3>
            </div>
            <p className="text-xs text-slate-400">
              {t.endShiftSubtitle}
            </p>

            <form onSubmit={handleConfirmCloseShift} className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs flex justify-between">
                <span className="text-slate-400">{t.systemExpectedCash}:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ${expectedCashInDrawer.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.actualPhysicalCash} ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={actualCountedCash}
                  onChange={(e) => setActualCountedCash(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 font-mono text-lg font-bold px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.reconciliationNotes}
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder={language === 'vi' ? 'Giải thích lý do chênh lệch thừa/thiếu, tiền tip...' : 'Explain any drawer discrepancy, coupon variances, or manager approval...'}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCloseShiftModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  {t.finalizeClose}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Shift Modal */}
      {isNewShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-slate-100">{t.startNewShiftTitle}</h3>
            </div>
            <p className="text-xs text-slate-400">
              {language === 'vi'
                ? 'Nhập lượng tiền lẻ đầu ca cấp vào ngăn kéo để chuẩn bị trả lại khách.'
                : 'Input opening cash float placed into the register drawer for change.'}
            </p>

            <form onSubmit={handleStartShift} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.openingFloat} ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newOpeningFloat}
                  onChange={(e) => setNewOpeningFloat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 font-mono text-base font-bold px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewShiftModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  {t.openDrawer}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
