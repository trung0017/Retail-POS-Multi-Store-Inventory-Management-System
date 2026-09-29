import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product, Branch, StockItem, StockTransfer } from '../../types';
import { SEED_PRODUCTS, SEED_BRANCHES, SEED_STOCK } from '../../data/seedData';

interface InventoryState {
  products: Product[];
  branches: Branch[];
  stock: StockItem[];
  transfers: StockTransfer[];
}

const initialTransfers: StockTransfer[] = [
  {
    id: 'trf-001',
    transferNumber: 'TRF-20260929-01',
    sourceBranchId: 'warehouse-01',
    targetBranchId: 'branch-a',
    items: [
      { productId: 'prod-001', productName: 'Organic Cold Brew Coffee 330ml', quantity: 24 },
      { productId: 'prod-006', productName: 'Sea Salt & Vinegar Avocado Chips 150g', quantity: 36 },
    ],
    status: 'in_transit',
    notes: 'Weekly safety restock shipment',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

const initialState: InventoryState = {
  products: SEED_PRODUCTS,
  branches: SEED_BRANCHES,
  stock: SEED_STOCK,
  transfers: initialTransfers,
};

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    deductStockForOrder: (
      state,
      action: PayloadAction<{ branchId: string; items: { productId: string; quantity: number }[] }>
    ) => {
      const { branchId, items } = action.payload;
      items.forEach((item) => {
        const stockRecord = state.stock.find(
          (s) => s.branchId === branchId && s.productId === item.productId
        );
        if (stockRecord) {
          stockRecord.quantity = Math.max(0, stockRecord.quantity - item.quantity);
          stockRecord.lastUpdated = new Date().toISOString();
        }
      });
    },
    adjustStock: (
      state,
      action: PayloadAction<{ branchId: string; productId: string; newQuantity: number }>
    ) => {
      const { branchId, productId, newQuantity } = action.payload;
      const record = state.stock.find((s) => s.branchId === branchId && s.productId === productId);
      if (record) {
        record.quantity = Math.max(0, newQuantity);
        record.lastUpdated = new Date().toISOString();
      } else {
        state.stock.push({
          branchId,
          productId,
          quantity: Math.max(0, newQuantity),
          reserved: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    },
    createTransferRequest: (
      state,
      action: PayloadAction<{
        sourceBranchId: string;
        targetBranchId: string;
        items: { productId: string; productName: string; quantity: number }[];
        notes?: string;
      }>
    ) => {
      const newTransfer: StockTransfer = {
        id: `trf-${Date.now()}`,
        transferNumber: `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
          100 + Math.random() * 900
        )}`,
        sourceBranchId: action.payload.sourceBranchId,
        targetBranchId: action.payload.targetBranchId,
        items: action.payload.items,
        status: 'pending',
        notes: action.payload.notes,
        createdAt: new Date().toISOString(),
      };
      state.transfers.unshift(newTransfer);
    },
    updateTransferStatus: (
      state,
      action: PayloadAction<{ transferId: string; status: 'in_transit' | 'completed' | 'cancelled' }>
    ) => {
      const { transferId, status } = action.payload;
      const transfer = state.transfers.find((t) => t.id === transferId);
      if (transfer) {
        // If transitioning to completed, update source and target stocks
        if (status === 'completed' && transfer.status !== 'completed') {
          transfer.items.forEach((item) => {
            // Deduct source
            const src = state.stock.find(
              (s) => s.branchId === transfer.sourceBranchId && s.productId === item.productId
            );
            if (src) {
              src.quantity = Math.max(0, src.quantity - item.quantity);
              src.lastUpdated = new Date().toISOString();
            }
            // Add target
            const tgt = state.stock.find(
              (s) => s.branchId === transfer.targetBranchId && s.productId === item.productId
            );
            if (tgt) {
              tgt.quantity += item.quantity;
              tgt.lastUpdated = new Date().toISOString();
            } else {
              state.stock.push({
                branchId: transfer.targetBranchId,
                productId: item.productId,
                quantity: item.quantity,
                reserved: 0,
                lastUpdated: new Date().toISOString(),
              });
            }
          });
          transfer.completedAt = new Date().toISOString();
        }
        transfer.status = status;
      }
    },
    updateProductThreshold: (
      state,
      action: PayloadAction<{ productId: string; minStockThreshold: number }>
    ) => {
      const product = state.products.find((p) => p.id === action.payload.productId);
      if (product) {
        product.minStockThreshold = action.payload.minStockThreshold;
      }
    },
  },
});

export const {
  deductStockForOrder,
  adjustStock,
  createTransferRequest,
  updateTransferStatus,
  updateProductThreshold,
} = inventorySlice.actions;

export default inventorySlice.reducer;
