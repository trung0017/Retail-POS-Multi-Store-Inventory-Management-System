import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import posReducer from './slices/posSlice';
import inventoryReducer from './slices/inventorySlice';
import ordersReducer from './slices/ordersSlice';
import shiftReducer from './slices/shiftSlice';

const rootReducer = combineReducers({
  pos: posReducer,
  inventory: inventoryReducer,
  orders: ordersReducer,
  shift: shiftReducer,
});

const STORAGE_KEY = 'retail_pos_store_v1';

const loadPreloadedState = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return undefined;
    const parsed = JSON.parse(serialized);
    return parsed;
  } catch (err) {
    console.warn('Failed to load state from localStorage:', err);
    return undefined;
  }
};

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: loadPreloadedState(),
});

// Subscribe to store updates to persist offline-resilient state
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
store.subscribe(() => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const state = store.getState();
      // Persist state cleanly
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          pos: {
            ...state.pos,
            isPaymentModalOpen: false,
            isReceiptModalOpen: false,
          },
          inventory: state.inventory,
          orders: state.orders,
          shift: state.shift,
        })
      );
    } catch (err) {
      console.error('Failed to persist state to localStorage:', err);
    }
  }, 300);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
