'use client';

import React, { useState } from 'react';
import { useAddress, type Address } from '@/context/AddressContext';
import { useAuth } from '@/context/AuthContext';

interface AddressFormProps {
  address?: Address;
  onSuccess: (address: Address) => void;
  onCancel: () => void;
}

export default function AddressForm({ address, onSuccess, onCancel }: AddressFormProps) {
  const { createAddress, updateAddress, isLoading, error, clearError } = useAddress();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: address?.name || address?.fullName || '',
    phone: address?.phone || user?.phone || '',
    email: address?.email || user?.email || '',
    addressLine1: address?.addressLine1 || address?.line1 || '',
    addressLine2: address?.addressLine2 || address?.line2 || '',
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

  const inputClass =
    'w-full px-3.5 py-2.5 bg-mb-bg border border-mb-border rounded-[8px] text-sm text-mb-text placeholder:text-mb-muted focus:border-mb-primary focus:outline-none focus:ring-1 focus:ring-mb-accent transition-colors';
  const labelClass = 'block text-xs font-semibold uppercase tracking-[0.06em] text-mb-body mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {displayError && (
        <div className="p-3 bg-mb-error/10 border border-mb-error/30 rounded-[8px]">
          <p className="text-sm text-mb-error font-medium">{displayError}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className={labelClass}>
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
            className={inputClass}
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className={labelClass}>
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
            className={inputClass}
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className={labelClass}>
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
          className={inputClass}
        />
      </div>

      {/* Address Line 1 */}
      <div>
        <label htmlFor="addressLine1" className={labelClass}>
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
          className={inputClass}
        />
      </div>

      {/* Address Line 2 */}
      <div>
        <label htmlFor="addressLine2" className={labelClass}>
          Address Line 2 (Optional)
        </label>
        <input
          id="addressLine2"
          name="addressLine2"
          type="text"
          value={formData.addressLine2}
          onChange={handleChange}
          placeholder="Road name, Area, Colony"
          className={inputClass}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* City */}
        <div>
          <label htmlFor="city" className={labelClass}>
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
            className={inputClass}
          />
        </div>

        {/* State */}
        <div>
          <label htmlFor="state" className={labelClass}>
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
            className={inputClass}
          />
        </div>

        {/* Pincode */}
        <div>
          <label htmlFor="pincode" className={labelClass}>
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
            className={inputClass}
          />
        </div>
      </div>

      {/* Type */}
      <div>
        <label htmlFor="type" className={labelClass}>
          Address Type *
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="HOME">Home</option>
          <option value="WORK">Work</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Set as Default */}
      <label className="flex items-center gap-2.5 p-3 bg-mb-bg border border-mb-border rounded-[8px] hover:border-mb-accent cursor-pointer transition-colors">
        <input
          type="checkbox"
          name="isDefault"
          checked={formData.isDefault}
          onChange={handleChange}
          className="w-4 h-4 rounded border-mb-border accent-mb-primary"
        />
        <span className="text-sm font-medium text-mb-text">Set as default address</span>
      </label>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2.5 bg-mb-primary hover:bg-mb-primary-hover text-mb-bg text-sm font-semibold rounded-[10px] disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Saving...' : address ? 'Update Address' : 'Save Address'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 py-2.5 border border-mb-border text-mb-text text-sm font-semibold rounded-[10px] hover:bg-mb-bg disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
