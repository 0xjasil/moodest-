'use client';

import React, { useState } from 'react';
import { useAddress, type Address } from '@/context/AddressContext';

interface AddressFormProps {
  address?: Address;
  onSuccess: (address: Address) => void;
  onCancel: () => void;
}

export default function AddressForm({ address, onSuccess, onCancel }: AddressFormProps) {
  const { createAddress, updateAddress, isLoading, error, clearError } = useAddress();

  const [formData, setFormData] = useState({
    name: address?.name || '',
    phone: address?.phone || '',
    email: address?.email || '',
    addressLine1: address?.addressLine1 || '',
    addressLine2: address?.addressLine2 || '',
    city: address?.city || '',
    state: address?.state || '',
    pincode: address?.pincode || '',
    country: address?.country || 'India',
    type: (address?.type || 'HOME') as 'HOME' | 'WORK' | 'OTHER',
    isDefault: address?.isDefault || false,
  });

  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    setLocalError(null);
    clearError();
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setLocalError('Name is required');
      return false;
    }
    if (!formData.phone.match(/^\d{10}$/)) {
      setLocalError('Phone must be 10 digits');
      return false;
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setLocalError('Invalid email address');
      return false;
    }
    if (!formData.addressLine1.trim()) {
      setLocalError('Address is required');
      return false;
    }
    if (!formData.city.trim()) {
      setLocalError('City is required');
      return false;
    }
    if (!formData.state.trim()) {
      setLocalError('State is required');
      return false;
    }
    if (!formData.pincode.match(/^\d{6}$/)) {
      setLocalError('Pincode must be 6 digits');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!validateForm()) {
      return;
    }

    try {
      let result: Address;
      if (address) {
        result = await updateAddress(address.id, formData);
      } else {
        result = await createAddress(formData);
      }
      onSuccess(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save address';
      setLocalError(msg);
    }
  };

  const displayError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {displayError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{displayError}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#000000] mb-1.5">
            Full Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter full name"
            className="w-full px-3 py-2 border border-[#CDD3D8] rounded-lg focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071]"
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-[#000000] mb-1.5">
            Phone Number *
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="10-digit mobile number"
            maxLength={10}
            className="w-full px-3 py-2 border border-[#CDD3D8] rounded-lg focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071]"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[#000000] mb-1.5">
          Email Address *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="your@email.com"
          className="w-full px-3 py-2 border border-[#CDD3D8] rounded-lg focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071]"
        />
      </div>

      {/* Address Line 1 */}
      <div>
        <label htmlFor="addressLine1" className="block text-sm font-medium text-[#000000] mb-1.5">
          Address Line 1 *
        </label>
        <input
          id="addressLine1"
          name="addressLine1"
          type="text"
          required
          value={formData.addressLine1}
          onChange={handleChange}
          placeholder="House No., Building Name"
          className="w-full px-3 py-2 border border-[#CDD3D8] rounded-lg focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071]"
        />
      </div>

      {/* Address Line 2 */}
      <div>
        <label htmlFor="addressLine2" className="block text-sm font-medium text-[#000000] mb-1.5">
          Address Line 2 (Optional)
        </label>
        <input
          id="addressLine2"
          name="addressLine2"
          type="text"
          value={formData.addressLine2}
          onChange={handleChange}
          placeholder="Road name, Area, Colony"
          className="w-full px-3 py-2 border border-[#CDD3D8] rounded-lg focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071]"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-[#000000] mb-1.5">
            City *
          </label>
          <input
            id="city"
            name="city"
            type="text"
            required
            value={formData.city}
            onChange={handleChange}
            placeholder="City"
            className="w-full px-3 py-2 border border-[#CDD3D8] rounded-lg focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071]"
          />
        </div>

        {/* State */}
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-[#000000] mb-1.5">
            State *
          </label>
          <input
            id="state"
            name="state"
            type="text"
            required
            value={formData.state}
            onChange={handleChange}
            placeholder="State"
            className="w-full px-3 py-2 border border-[#CDD3D8] rounded-lg focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071]"
          />
        </div>

        {/* Pincode */}
        <div>
          <label htmlFor="pincode" className="block text-sm font-medium text-[#000000] mb-1.5">
            Pincode *
          </label>
          <input
            id="pincode"
            name="pincode"
            type="text"
            required
            value={formData.pincode}
            onChange={handleChange}
            placeholder="6-digit pincode"
            maxLength={6}
            className="w-full px-3 py-2 border border-[#CDD3D8] rounded-lg focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071]"
          />
        </div>
      </div>

      {/* Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-[#000000] mb-1.5">
          Address Type *
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-[#CDD3D8] rounded-lg focus:border-[#E80071] focus:outline-none focus:ring-1 focus:ring-[#E80071]"
        >
          <option value="HOME">Home</option>
          <option value="WORK">Work</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Set as Default */}
      <label className="flex items-center gap-2 p-3 border border-[#CDD3D8] rounded-lg hover:bg-[#F4F4F4] cursor-pointer transition-colors">
        <input
          type="checkbox"
          name="isDefault"
          checked={formData.isDefault}
          onChange={handleChange}
          className="w-4 h-4 rounded border-[#CDD3D8]"
        />
        <span className="text-sm font-medium text-[#000000]">Set as default address</span>
      </label>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2.5 bg-[#E80071] text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isLoading ? 'Saving...' : address ? 'Update Address' : 'Add Address'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 py-2.5 border border-[#CDD3D8] text-[#000000] font-medium rounded-lg hover:bg-[#F4F4F4] disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
