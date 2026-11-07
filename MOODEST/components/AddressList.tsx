'use client';

import React, { useState } from 'react';
import { useAddress, type Address } from '@/context/AddressContext';

interface AddressListProps {
  onSelect: (address: Address) => void;
  selectedId?: number;
}

export default function AddressList({ onSelect, selectedId }: AddressListProps) {
  const {
    addresses,
    deleteAddress,
    setDefaultAddress,
    isLoading,
  } = useAddress();

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    setDeletingId(id);
    try {
      await deleteAddress(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultAddress(id);
    } catch {
      // Error handled by context
    }
  };

  if (addresses.length === 0) {
    return (
      <div className="p-6 bg-[#F4F4F4] border border-[#CDD3D8] rounded-lg text-center">
        <p className="text-[#595E63]">No addresses added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {addresses.map((address) => (
        <div
          key={address.id}
          className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
            selectedId === address.id
              ? 'border-[#E80071] bg-[#FFF0F6]'
              : 'border-[#CDD3D8] hover:border-[#E80071] bg-white'
          }`}
          onClick={() => onSelect(address)}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              {/* Address Type Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2 py-1 bg-[#E80071] text-white rounded">
                  {address.type}
                </span>
                {address.isDefault && (
                  <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-800 rounded">
                    DEFAULT
                  </span>
                )}
              </div>

              {/* Address Details */}
              <p className="font-semibold text-[#000000]">{address.name}</p>
              <p className="text-sm text-[#595E63] mt-1">{address.addressLine1}</p>
              {address.addressLine2 && (
                <p className="text-sm text-[#595E63]">{address.addressLine2}</p>
              )}
              <p className="text-sm text-[#595E63] mt-1">
                {address.city}, {address.state} {address.pincode}
              </p>
              <p className="text-sm text-[#595E63]">{address.country}</p>

              {/* Contact Details */}
              <div className="mt-2 space-y-0.5 text-xs text-[#595E63]">
                <p>📞 {address.phone}</p>
                <p>📧 {address.email}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {!address.isDefault && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetDefault(address.id);
                  }}
                  disabled={isLoading}
                  className="text-xs px-3 py-1.5 border border-[#E80071] text-[#E80071] rounded hover:bg-[#FFF0F6] disabled:opacity-50 transition-colors"
                >
                  Set Default
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(address.id);
                }}
                disabled={isLoading || deletingId === address.id}
                className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {deletingId === address.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
