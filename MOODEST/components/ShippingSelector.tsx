'use client';

import React, { useEffect, useState } from 'react';
import { useAddress, type ShippingOption } from '@/context/AddressContext';

interface ShippingSelectorProps {
  pincode: string;
  onSelect: (option: ShippingOption) => void;
}

export default function ShippingSelector({ pincode, onSelect }: ShippingSelectorProps) {
  const { getShippingOptions, shippingOptions, isLoading, error } = useAddress();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (pincode && pincode.length === 6) {
      getShippingOptions(pincode);
    }
  }, [pincode, getShippingOptions]);

  const handleSelect = (option: ShippingOption) => {
    setSelected(option.id);
    onSelect(option);
  };

  if (!pincode) {
    return (
      <div className="p-4 bg-[#FDE8F0] border border-[#E80071] rounded-lg">
        <p className="text-sm text-[#E80071]">Please enter a valid pincode to see shipping options</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-[#F4F4F4] rounded-lg animate-pulse h-20" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (shippingOptions.length === 0) {
    return (
      <div className="p-4 bg-[#FDE8F0] border border-[#E80071] rounded-lg">
        <p className="text-sm text-[#E80071]">
          No shipping options available for pincode {pincode}. Please verify the pincode.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#000000]">Select Shipping Method</h3>
      {shippingOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => handleSelect(option)}
          className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
            selected === option.id
              ? 'border-[#E80071] bg-[#FFF0F6]'
              : 'border-[#CDD3D8] hover:border-[#E80071] bg-white'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-medium text-[#000000]">{option.name}</p>
              <p className="text-xs text-[#595E63] mt-0.5">{option.description}</p>
              {option.carrier && (
                <p className="text-xs text-[#595E63] mt-1">Carrier: {option.carrier}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold text-[#E80071]">
                ₹{option.cost.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-[#595E63] mt-1">{option.estimatedDays} days</p>
            </div>
          </div>

          {/* Radio button */}
          <div className="mt-3 flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                selected === option.id
                  ? 'border-[#E80071] bg-[#E80071]'
                  : 'border-[#CDD3D8]'
              }`}
            >
              {selected === option.id && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
            <span className="text-xs font-medium text-[#595E63]">Select this option</span>
          </div>
        </button>
      ))}

      {/* Estimated Delivery Info */}
      {selected && (
        <div className="mt-4 p-3 bg-[#E0F7FF] border border-[#0066cc] rounded-lg">
          <p className="text-xs font-medium text-[#0066cc]">
            ✓ Estimated delivery: {shippingOptions
              .find((o) => o.id === selected)
              ?.estimatedDays} working days
          </p>
        </div>
      )}
    </div>
  );
}
