import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Order } from '../../types';
import { SEED_ORDERS } from '../../data/seedData';

interface OrdersState {
  orders: Order[];
  offlineSyncQueue: string[]; // Order IDs pending sync
  isSyncing: boolean;
  lastSyncTime: string | null;
}

const initialState: OrdersState = {
  orders: SEED_ORDERS,
  offlineSyncQueue: [],
  isSyncing: false,
  lastSyncTime: new Date().toISOString(),
};

export const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    addOrder: (state, action: PayloadAction<Order>) => {
      const order = action.payload;
      state.orders.unshift(order);
      if (order.offlineCreated || order.status === 'pending_sync') {
        if (!state.offlineSyncQueue.includes(order.id)) {
          state.offlineSyncQueue.push(order.id);
        }
      }
    },
    startSyncing: (state) => {
      state.isSyncing = true;
    },
    finishSyncingSuccess: (state) => {
      state.isSyncing = false;
      state.lastSyncTime = new Date().toISOString();
      const now = new Date().toISOString();
      state.orders.forEach((o) => {
        if (state.offlineSyncQueue.includes(o.id) || o.status === 'pending_sync') {
          o.status = 'synced';
          o.syncedAt = now;
        }
      });
      state.offlineSyncQueue = [];
    },
    finishSyncingFailed: (state) => {
      state.isSyncing = false;
    },
    refundOrder: (state, action: PayloadAction<string>) => {
      const order = state.orders.find((o) => o.id === action.payload);
      if (order) {
        order.status = 'refunded';
      }
    },
  },
});

export const {
  addOrder,
  startSyncing,
  finishSyncingSuccess,
  finishSyncingFailed,
  refundOrder,
} = ordersSlice.actions;

export default ordersSlice.reducer;
