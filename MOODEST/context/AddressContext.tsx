import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";
import { addressAPI, type CreateAddressDto } from "@/lib/api";
import type { Address as BaseAddress } from "@/lib/types";

/* ── Types ────────────────────────────────────────────────────── */
export interface Address extends BaseAddress {
  email?: string;
  type?: "HOME" | "WORK" | "OTHER";
}

export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  estimatedDays: number;
  cost: number;
  carrier?: string;
}

interface AddressState {
  addresses: Address[];
  selectedAddress: Address | null;
  shippingOptions: ShippingOption[];
  selectedShipping: ShippingOption | null;
  isLoading: boolean;
  error: string | null;
}

type AddressAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; addresses: Address[] }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "ADD_ADDRESS"; address: Address }
  | { type: "UPDATE_ADDRESS"; address: Address }
  | { type: "DELETE_ADDRESS"; id: number | string }
  | { type: "SET_DEFAULT"; id: number | string }
  | { type: "SELECT_ADDRESS"; address: Address }
  | { type: "LOAD_SHIPPING"; options: ShippingOption[] }
  | { type: "SELECT_SHIPPING"; option: ShippingOption }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_LOADING"; isLoading: boolean };

export interface AddressContextValue {
  addresses: Address[];
  selectedAddress: Address | null;
  shippingOptions: ShippingOption[];
  selectedShipping: ShippingOption | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAddresses(): Promise<void>;
  createAddress(data: Partial<Address> & { fullName?: string; phone?: string; line1?: string; city?: string; state?: string; pincode?: string }): Promise<Address>;
  updateAddress(id: number | string, data: Partial<Address>): Promise<Address>;
  deleteAddress(id: number | string): Promise<void>;
  setDefaultAddress(id: number | string): Promise<void>;
  selectAddress(address: Address): void;
  getShippingOptions(pincode: string, subtotal?: number): Promise<ShippingOption[]>;
  selectShipping(option: ShippingOption): void;
  clearError(): void;
}

function normalizeAddress(a: any): Address {
  const fullName = a.fullName || a.name || "";
  const line1 = a.line1 || a.addressLine1 || "";
  const line2 = a.line2 || a.addressLine2 || "";
  return {
    ...a,
    fullName,
    line1,
    line2,
    name: fullName,
    addressLine1: line1,
    addressLine2: line2,
    isDefault: Boolean(a.isDefault),
    country: a.country || "India",
  };
}

/* ── Standard Store Shipping Rules (Matches OrdersService: subtotal > 1500 ? 0 : 99) ──── */
function buildShippingOptions(subtotal?: number): ShippingOption[] {
  const isComplimentary = (subtotal ?? 0) > 1500;
  return [
    {
      id: "standard",
      name: "Standard Delivery",
      description: isComplimentary
        ? "Complimentary delivery applied on orders above ₹1,500"
        : "Complimentary delivery on orders above ₹1,500 (₹99 standard fee)",
      estimatedDays: 4,
      cost: isComplimentary ? 0 : 99,
      carrier: "Modest Studio Courier",
    },
  ];
}

const STANDARD_SHIPPING_OPTIONS: ShippingOption[] = buildShippingOptions(0);

/* ── Reducer ──────────────────────────────────────────────────── */
function reducer(state: AddressState, action: AddressAction): AddressState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };

    case "FETCH_SUCCESS": {
      const defaultAddr = action.addresses.find((a) => a.isDefault) || action.addresses[0] || null;
      return {
        ...state,
        addresses: action.addresses,
        selectedAddress: state.selectedAddress || defaultAddr,
        isLoading: false,
        error: null,
      };
    }

    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.error };

    case "ADD_ADDRESS":
      return {
        ...state,
        addresses: [action.address, ...state.addresses],
        selectedAddress: action.address.isDefault ? action.address : state.selectedAddress || action.address,
      };

    case "UPDATE_ADDRESS":
      return {
        ...state,
        addresses: state.addresses.map((a) =>
          a.id === action.address.id ? action.address : a
        ),
        selectedAddress:
          state.selectedAddress?.id === action.address.id
            ? action.address
            : state.selectedAddress,
      };

    case "DELETE_ADDRESS": {
      const remaining = state.addresses.filter((a) => a.id !== action.id);
      return {
        ...state,
        addresses: remaining,
        selectedAddress:
          state.selectedAddress?.id === action.id
            ? remaining[0] || null
            : state.selectedAddress,
      };
    }

    case "SET_DEFAULT":
      return {
        ...state,
        addresses: state.addresses.map((a) => ({
          ...a,
          isDefault: a.id === action.id,
        })),
      };

    case "SELECT_ADDRESS":
      return { ...state, selectedAddress: action.address };

    case "LOAD_SHIPPING":
      return {
        ...state,
        shippingOptions: action.options,
        selectedShipping: action.options[0] || state.selectedShipping,
      };

    case "SELECT_SHIPPING":
      return { ...state, selectedShipping: action.option };

    case "SET_ERROR":
      return { ...state, error: action.error };

    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };

    default:
      return state;
  }
}

/* ── Context ──────────────────────────────────────────────────── */
const AddressContext = createContext<AddressContextValue | null>(null);

/* ── Provider ─────────────────────────────────────────────────── */
export function AddressProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    addresses: [],
    selectedAddress: null,
    shippingOptions: STANDARD_SHIPPING_OPTIONS,
    selectedShipping: STANDARD_SHIPPING_OPTIONS[0],
    isLoading: false,
    error: null,
  });

  const fetchAddresses = useCallback(async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const addresses = await addressAPI.getAll();
      const normalized = (addresses || []).map(normalizeAddress);
      dispatch({ type: "FETCH_SUCCESS", addresses: normalized });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch addresses";
      dispatch({ type: "FETCH_ERROR", error: message });
    }
  }, []);

  const createAddress = useCallback(
    async (data: any) => {
      try {
        dispatch({ type: "SET_LOADING", isLoading: true });
        const dto: CreateAddressDto = {
          fullName: data.fullName || data.name || "",
          phone: data.phone || "",
          line1: data.line1 || data.addressLine1 || "",
          line2: data.line2 || data.addressLine2 || undefined,
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
          isDefault: data.isDefault,
        };
        const raw = await addressAPI.create(dto);
        const address = normalizeAddress(raw);
        dispatch({ type: "ADD_ADDRESS", address });
        return address;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create address";
        dispatch({ type: "SET_ERROR", error: message });
        throw error;
      } finally {
        dispatch({ type: "SET_LOADING", isLoading: false });
      }
    },
    []
  );

  const updateAddress = useCallback(
    async (id: number | string, data: Partial<Address>) => {
      try {
        dispatch({ type: "SET_LOADING", isLoading: true });
        const dto: Partial<CreateAddressDto> = {
          fullName: data.fullName || data.name,
          phone: data.phone,
          line1: data.line1 || data.addressLine1,
          line2: data.line2 || data.addressLine2,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          isDefault: data.isDefault,
        };
        const raw = await addressAPI.update(id, dto);
        const address = normalizeAddress(raw);
        dispatch({ type: "UPDATE_ADDRESS", address });
        return address;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to update address";
        dispatch({ type: "SET_ERROR", error: message });
        throw error;
      } finally {
        dispatch({ type: "SET_LOADING", isLoading: false });
      }
    },
    []
  );

  const deleteAddress = useCallback(async (id: number | string) => {
    try {
      dispatch({ type: "SET_LOADING", isLoading: true });
      await addressAPI.delete(id);
      dispatch({ type: "DELETE_ADDRESS", id });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete address";
      dispatch({ type: "SET_ERROR", error: message });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", isLoading: false });
    }
  }, []);

  const setDefaultAddress = useCallback(async (id: number | string) => {
    try {
      dispatch({ type: "SET_LOADING", isLoading: true });
      const raw = await addressAPI.setDefault(id);
      const address = normalizeAddress(raw);
      dispatch({ type: "SET_DEFAULT", id });
      dispatch({ type: "SELECT_ADDRESS", address });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to set default address";
      dispatch({ type: "SET_ERROR", error: message });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", isLoading: false });
    }
  }, []);

  const selectAddress = useCallback((address: Address) => {
    dispatch({ type: "SELECT_ADDRESS", address });
  }, []);

  const getShippingOptions = useCallback(async (_pincode: string, subtotal?: number) => {
    const options = buildShippingOptions(subtotal);
    dispatch({ type: "LOAD_SHIPPING", options });
    return options;
  }, []);

  const selectShipping = useCallback((option: ShippingOption) => {
    dispatch({ type: "SELECT_SHIPPING", option });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", error: null });
  }, []);

  const value: AddressContextValue = {
    addresses: state.addresses,
    selectedAddress: state.selectedAddress,
    shippingOptions: state.shippingOptions,
    selectedShipping: state.selectedShipping,
    isLoading: state.isLoading,
    error: state.error,

    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    selectAddress,
    getShippingOptions,
    selectShipping,
    clearError,
  };

  return (
    <AddressContext.Provider value={value}>{children}</AddressContext.Provider>
  );
}

/* ── Hook ─────────────────────────────────────────────────────── */
export function useAddress(): AddressContextValue {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error("useAddress must be used inside <AddressProvider>");
  return ctx;
}
