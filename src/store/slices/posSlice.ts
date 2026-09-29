import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, Product, Order } from '../../types';

interface PosState {
  activeBranchId: string;
  currentCashier: string;
  cart: CartItem[];
  activeDiscountPercent: number;
  barcodeInput: string;
  networkStatus: 'online' | 'offline';
  isReceiptModalOpen: boolean;
  isPaymentModalOpen: boolean;
  recentCompletedOrder: Order | null;
  activeCategory: string;
  searchQuery: string;
}

const initialState: PosState = {
  activeBranchId: 'branch-a',
  currentCashier: 'Alex Rivera (Staff #104)',
  cart: [],
  activeDiscountPercent: 0,
  barcodeInput: '',
  networkStatus: 'online',
  isReceiptModalOpen: false,
  isPaymentModalOpen: false,
  recentCompletedOrder: null,
  activeCategory: 'All Products',
  searchQuery: '',
};

export const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    setActiveBranch: (state, action: PayloadAction<string>) => {
      state.activeBranchId = action.payload;
    },
    setCurrentCashier: (state, action: PayloadAction<string>) => {
      state.currentCashier = action.payload;
    },
    setActiveCategory: (state, action: PayloadAction<string>) => {
      state.activeCategory = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setBarcodeInput: (state, action: PayloadAction<string>) => {
      state.barcodeInput = action.payload;
    },
    setNetworkStatus: (state, action: PayloadAction<'online' | 'offline'>) => {
      state.networkStatus = action.payload;
    },
    toggleNetworkStatus: (state) => {
      state.networkStatus = state.networkStatus === 'online' ? 'offline' : 'online';
    },
    addToCart: (state, action: PayloadAction<{ product: Product; quantity?: number }>) => {
      const { product, quantity = 1 } = action.payload;
      const existing = state.cart.find((item) => item.product.id === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.cart.push({
          product,
          quantity,
          discountPercent: 0,
        });
      }
    },
    updateCartItemQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) => {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        state.cart = state.cart.filter((item) => item.product.id !== productId);
      } else {
        const item = state.cart.find((i) => i.product.id === productId);
        if (item) {
          item.quantity = quantity;
        }
      }
    },
    updateCartItemDiscount: (
      state,
      action: PayloadAction<{ productId: string; discountPercent: number }>
    ) => {
      const { productId, discountPercent } = action.payload;
      const item = state.cart.find((i) => i.product.id === productId);
      if (item) {
        item.discountPercent = Math.min(100, Math.max(0, discountPercent));
      }
    },
    applyCartDiscount: (state, action: PayloadAction<number>) => {
      state.activeDiscountPercent = Math.min(100, Math.max(0, action.payload));
      state.cart.forEach((item) => {
        item.discountPercent = state.activeDiscountPercent;
      });
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cart = state.cart.filter((item) => item.product.id !== action.payload);
    },
    clearCart: (state) => {
      state.cart = [];
      state.activeDiscountPercent = 0;
      state.barcodeInput = '';
    },
    openPaymentModal: (state) => {
      state.isPaymentModalOpen = true;
    },
    closePaymentModal: (state) => {
      state.isPaymentModalOpen = false;
    },
    openReceiptModal: (state, action: PayloadAction<Order>) => {
      state.recentCompletedOrder = action.payload;
      state.isReceiptModalOpen = true;
    },
    closeReceiptModal: (state) => {
      state.isReceiptModalOpen = false;
    },
  },
});

export const {
  setActiveBranch,
  setCurrentCashier,
  setActiveCategory,
  setSearchQuery,
  setBarcodeInput,
  setNetworkStatus,
  toggleNetworkStatus,
  addToCart,
  updateCartItemQuantity,
  updateCartItemDiscount,
  applyCartDiscount,
  removeFromCart,
  clearCart,
  openPaymentModal,
  closePaymentModal,
  openReceiptModal,
  closeReceiptModal,
} = posSlice.actions;

export default posSlice.reducer;
