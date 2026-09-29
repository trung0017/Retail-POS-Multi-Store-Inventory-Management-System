import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ShiftSession } from '../../types';
import { INITIAL_SHIFT } from '../../data/seedData';

interface ShiftState {
  currentShift: ShiftSession;
  shiftHistory: ShiftSession[];
}

const initialState: ShiftState = {
  currentShift: INITIAL_SHIFT,
  shiftHistory: [],
};

export const shiftSlice = createSlice({
  name: 'shift',
  initialState,
  reducers: {
    recordTransactionSales: (
      state,
      action: PayloadAction<{ cash: number; card: number }>
    ) => {
      if (!state.currentShift.isClosed) {
        state.currentShift.cashSales += action.payload.cash;
        state.currentShift.cardSales += action.payload.card;
        state.currentShift.totalSales += action.payload.cash + action.payload.card;
        state.currentShift.orderCount += 1;
      }
    },
    updateOpeningFloat: (state, action: PayloadAction<number>) => {
      if (!state.currentShift.isClosed) {
        state.currentShift.openingFloat = Math.max(0, action.payload);
      }
    },
    recordCashDrop: (state, action: PayloadAction<number>) => {
      if (!state.currentShift.isClosed) {
        state.currentShift.cashDrop += Math.max(0, action.payload);
      }
    },
    closeShift: (
      state,
      action: PayloadAction<{ actualCountedCash: number; notes?: string }>
    ) => {
      const { actualCountedCash, notes } = action.payload;
      const expectedCash =
        state.currentShift.openingFloat +
        state.currentShift.cashSales -
        state.currentShift.cashDrop;

      state.currentShift.actualCountedCash = actualCountedCash;
      state.currentShift.discrepancy = actualCountedCash - expectedCash;
      state.currentShift.notes = notes;
      state.currentShift.isClosed = true;
      state.currentShift.closedAt = new Date().toISOString();

      // archive into history
      state.shiftHistory.unshift({ ...state.currentShift });
    },
    startNewShift: (
      state,
      action: PayloadAction<{ branchId: string; cashierName: string; openingFloat: number }>
    ) => {
      const newShift: ShiftSession = {
        id: `shift-${Date.now()}`,
        branchId: action.payload.branchId,
        cashierName: action.payload.cashierName,
        openingFloat: action.payload.openingFloat,
        openedAt: new Date().toISOString(),
        isClosed: false,
        cashSales: 0,
        cardSales: 0,
        totalSales: 0,
        cashDrop: 0,
        orderCount: 0,
      };
      state.currentShift = newShift;
    },
  },
});

export const {
  recordTransactionSales,
  updateOpeningFloat,
  recordCashDrop,
  closeShift,
  startNewShift,
} = shiftSlice.actions;

export default shiftSlice.reducer;
