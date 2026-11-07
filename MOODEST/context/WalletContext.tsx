import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";
import { walletAPI } from "@/lib/api";
import type { Wallet as BaseWallet, WalletTransaction } from "@/lib/types";

/* ── Types ────────────────────────────────────────────────────── */
export interface Wallet extends BaseWallet {
  totalSpent?: number;
  totalEarned?: number;
}

export type { WalletTransaction };

interface WalletState {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  isLoading: boolean;
  error: string | null;
}

type WalletAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; wallet: Wallet; transactions: WalletTransaction[] }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "UPDATE_BALANCE"; balance: number }
  | { type: "ADD_TRANSACTION"; transaction: WalletTransaction }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_LOADING"; isLoading: boolean };

export interface WalletContextValue {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  isLoading: boolean;
  error: string | null;
  balance: number;

  // Actions
  fetchWallet(): Promise<void>;
  addMoney(amount: number, description?: string): Promise<void>;
  deductMoney(amount: number, description: string): Promise<void>;
  withdraw(amount: number): Promise<void>;
  clearError(): void;
}

/* ── Reducer ──────────────────────────────────────────────────── */
function reducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };

    case "FETCH_SUCCESS":
      return {
        ...state,
        wallet: action.wallet,
        transactions: action.transactions,
        isLoading: false,
        error: null,
      };

    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.error };

    case "UPDATE_BALANCE":
      return {
        ...state,
        wallet: state.wallet ? { ...state.wallet, balance: action.balance } : null,
      };

    case "ADD_TRANSACTION":
      return {
        ...state,
        transactions: [action.transaction, ...state.transactions],
      };

    case "SET_ERROR":
      return { ...state, error: action.error };

    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };

    default:
      return state;
  }
}

/* ── Context ──────────────────────────────────────────────────── */
const WalletContext = createContext<WalletContextValue | null>(null);

/* ── Provider ─────────────────────────────────────────────────── */
export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    wallet: null,
    transactions: [],
    isLoading: false,
    error: null,
  });

  const fetchWallet = useCallback(async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const [wallet, transactions] = await Promise.all([
        walletAPI.get().catch(() => ({ id: 0, userId: 0, balance: 0, currency: "INR" })),
        walletAPI.getTransactions().catch(() => []),
      ]);

      dispatch({
        type: "FETCH_SUCCESS",
        wallet,
        transactions: Array.isArray(transactions) ? transactions : [],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch wallet";
      dispatch({ type: "FETCH_ERROR", error: message });
    }
  }, []);

  const addMoney = useCallback(
    async (amount: number, description: string = "Wallet top-up") => {
      // In the NestJS backend, customer wallet is credited through cashback or admin credits
      // We simulate local optimistic balance update for top-ups
      const currentBalance = state.wallet?.balance ?? 0;
      const newBalance = currentBalance + amount;
      dispatch({ type: "UPDATE_BALANCE", balance: newBalance });
      dispatch({
        type: "ADD_TRANSACTION",
        transaction: {
          id: Date.now(),
          walletId: state.wallet?.id ?? 0,
          amount,
          type: "CREDIT",
          description,
          createdAt: new Date().toISOString(),
        },
      });
    },
    [state.wallet]
  );

  const deductMoney = useCallback(
    async (amount: number, description: string) => {
      const currentBalance = state.wallet?.balance ?? 0;
      const newBalance = Math.max(0, currentBalance - amount);
      dispatch({ type: "UPDATE_BALANCE", balance: newBalance });
      dispatch({
        type: "ADD_TRANSACTION",
        transaction: {
          id: Date.now(),
          walletId: state.wallet?.id ?? 0,
          amount,
          type: "DEBIT",
          description,
          createdAt: new Date().toISOString(),
        },
      });
    },
    [state.wallet]
  );

  const withdraw = useCallback(async (amount: number) => {
    try {
      dispatch({ type: "SET_LOADING", isLoading: true });
      await walletAPI.withdraw(amount);
      await fetchWallet();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Withdrawal failed";
      dispatch({ type: "SET_ERROR", error: message });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", isLoading: false });
    }
  }, [fetchWallet]);

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", error: null });
  }, []);

  const value: WalletContextValue = {
    wallet: state.wallet,
    transactions: state.transactions,
    isLoading: state.isLoading,
    error: state.error,
    balance: state.wallet?.balance ?? 0,

    fetchWallet,
    addMoney,
    deductMoney,
    withdraw,
    clearError,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

/* ── Hook ─────────────────────────────────────────────────────── */
export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
