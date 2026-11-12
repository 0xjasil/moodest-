'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useAddress, type Address } from '@/context/AddressContext';

interface AddressListProps {
  onSelect: (address: Address) => void;
  selectedId?: number | string;
}

export default function AddressList({ onSelect, selectedId }: AddressListProps) {
  const {
    addresses,
    deleteAddress,
    setDefaultAddress,
    isLoading,
  } = useAddress();

  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  const handleDelete = async (id: number | string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    setDeletingId(id);
    try {
      await deleteAddress(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: number | string) => {
    try {
      await setDefaultAddress(id);
    } catch {
      // Error handled by context
    }
  };

  if (addresses.length === 0) {
    return (
      <div className="p-6 bg-mb-bg border border-mb-border rounded-[8px] text-center">
        <p className="text-sm text-mb-body">No addresses added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {addresses.map((address) => {
        const isSelected = selectedId === address.id;
        return (
          <div
            key={address.id}
            className={`p-4 border-2 rounded-[8px] transition-all cursor-pointer ${
              isSelected
                ? 'border-mb-primary bg-mb-bg shadow-sm'
                : 'border-mb-border-lite hover:border-mb-accent bg-mb-surface'
            }`}
            onClick={() => onSelect(address)}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                {/* Address Type Badge */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] px-2.5 py-0.5 bg-mb-primary text-mb-bg rounded-[6px]">
                    {address.type || 'HOME'}
                  </span>
                  {address.isDefault && (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] px-2.5 py-0.5 bg-mb-success/15 text-mb-success rounded-[6px]">
                      DEFAULT
                    </span>
                  )}
                </div>

                {/* Address Details */}
                <p className="font-semibold text-mb-text">{address.name || address.fullName}</p>
                <p className="text-sm text-mb-body mt-1">{address.addressLine1 || address.line1}</p>
                {(address.addressLine2 || address.line2) && (
                  <p className="text-sm text-mb-body">{address.addressLine2 || address.line2}</p>
                )}
                <p className="text-sm text-mb-body mt-1">
                  {address.city}, {address.state} {address.pincode}
                </p>
                <p className="text-sm text-mb-muted">{address.country || 'India'}</p>

                {/* Contact Details */}
                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mb-muted">
                  <p className="inline-flex items-center gap-1">
                    <Icon icon="lucide:phone" className="w-3.5 h-3.5 text-mb-primary" />
                    <span>{address.phone}</span>
                  </p>
                  {address.email && (
                    <p className="inline-flex items-center gap-1">
                      <Icon icon="lucide:mail" className="w-3.5 h-3.5 text-mb-primary" />
                      <span>{address.email}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 shrink-0">
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDefault(address.id);
                    }}
                    disabled={isLoading}
                    className="text-xs font-semibold px-3 py-1.5 border border-mb-primary text-mb-primary rounded-[8px] hover:bg-mb-primary/5 disabled:opacity-50 transition-colors"
                  >
                    Set Default
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(address.id);
                  }}
                  disabled={isLoading || deletingId === address.id}
                  className="text-xs font-semibold px-3 py-1.5 border border-mb-error/40 text-mb-error rounded-[8px] hover:bg-mb-error/10 disabled:opacity-50 transition-colors"
                >
                  {deletingId === address.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
