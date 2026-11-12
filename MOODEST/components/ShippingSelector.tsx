'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { useAddress, type ShippingOption } from '@/context/AddressContext';

interface ShippingSelectorProps {
  pincode: string;
  subtotal?: number;
  onSelect: (option: ShippingOption) => void;
}

export default function ShippingSelector({ pincode, subtotal = 0, onSelect }: ShippingSelectorProps) {
  const { getShippingOptions, shippingOptions, isLoading, error } = useAddress();
  const [selected, setSelected] = useState<string | null>('standard');
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (pincode && pincode.length === 6) {
      getShippingOptions(pincode, subtotal).then((options) => {
        if (options.length > 0) {
          setSelected(options[0].id);
          onSelectRef.current(options[0]);
        }
      });
    }
  }, [pincode, subtotal, getShippingOptions]);

  const handleSelect = (option: ShippingOption) => {
    setSelected(option.id);
    onSelect(option);
  };

  if (!pincode) {
    return (
      <div className="p-4 bg-mb-bg border border-mb-border rounded-[8px]">
        <p className="text-sm text-mb-body">Please select or add a delivery address with a valid pincode to calculate shipping.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-mb-bg rounded-[8px] animate-pulse h-20" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-mb-error/10 border border-mb-error/30 rounded-[8px]">
        <p className="text-sm text-mb-error">{error}</p>
      </div>
    );
  }

  if (shippingOptions.length === 0) {
    return (
      <div className="p-4 bg-mb-bg border border-mb-border rounded-[8px]">
        <p className="text-sm text-mb-body">
          No shipping options available for pincode {pincode}. Please verify the pincode.
        </p>
      </div>
    );
  }

  const activeOption = shippingOptions.find((o) => o.id === selected) || shippingOptions[0];

  return (
    <div className="space-y-3">
      {shippingOptions.map((option) => {
        const isSelected = (selected || activeOption?.id) === option.id;
        return (
          <button
            type="button"
            key={option.id}
            onClick={() => handleSelect(option)}
            className={`w-full p-4 border-2 rounded-[8px] transition-all text-left ${
              isSelected
                ? 'border-mb-primary bg-mb-bg'
                : 'border-mb-border-lite hover:border-mb-accent bg-mb-surface'
            }`}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <p className="font-semibold text-mb-text flex items-center gap-2">
                  <Icon icon="lucide:truck" className="w-4 h-4 text-mb-primary" />
                  <span>{option.name}</span>
                </p>
                <p className="text-xs text-mb-body mt-1">{option.description}</p>
                {option.carrier && (
                  <p className="text-xs text-mb-muted mt-1">Carrier: {option.carrier}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className={`font-bold ${option.cost === 0 ? 'text-mb-success' : 'text-mb-primary'}`}>
                  {option.cost === 0 ? 'Free' : `₹${option.cost.toLocaleString('en-IN')}`}
                </p>
                <p className="text-xs text-mb-muted mt-1">{option.estimatedDays} business days</p>
              </div>
            </div>

            {/* Radio indicator */}
            <div className="mt-3 flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'border-mb-primary bg-mb-primary'
                    : 'border-mb-border'
                }`}
              >
                {isSelected && <div className="w-1.5 h-1.5 bg-mb-bg rounded-full" />}
              </div>
              <span className="text-xs font-medium text-mb-muted">
                {isSelected ? 'Selected delivery method' : 'Select this option'}
              </span>
            </div>
          </button>
        );
      })}

      {/* Estimated Delivery Info */}
      {activeOption && (
        <div className="p-3 bg-mb-bg border border-mb-border-lite rounded-[8px] flex items-center gap-2">
          <Icon icon="lucide:check-circle-2" className="w-4 h-4 text-mb-success shrink-0" />
          <p className="text-xs font-medium text-mb-body">
            Estimated delivery to pincode <span className="font-semibold text-mb-text">{pincode}</span>: {activeOption.estimatedDays} working days
          </p>
        </div>
      )}
    </div>
  );
}
