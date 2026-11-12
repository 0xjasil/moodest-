"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Icon } from "@iconify/react";

const makeIcon = (iconName: string) => function SettingsIcon({ className }: { className?: string }) {
  return <Icon icon={iconName} className={className} />;
};

const User = makeIcon("lucide:user");
const Lock = makeIcon("lucide:lock");
const Eye = makeIcon("lucide:eye");
const EyeOff = makeIcon("lucide:eye-off");
const Check = makeIcon("lucide:check");
const X = makeIcon("lucide:x");
const Mail = makeIcon("lucide:mail");
const Phone = makeIcon("lucide:phone");
const UploadCloud = makeIcon("lucide:upload-cloud");
const Sparkles = makeIcon("lucide:sparkles");
const CheckCircle2 = makeIcon("lucide:check-circle-2");
const RefreshCw = makeIcon("lucide:refresh-cw");
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { fallBackImage } from '@/constants/values';
import AdminLoader from './AdminLoader';
import { API_URL } from '@/lib/api-client';
import { uploadToCloudinary } from '@/lib/cloudinary';

const DEFAULT_AVATARS = [
  "/images/avatars/1.webp",
  "/images/avatars/2.webp",
  "/images/avatars/3.webp",
  "/images/avatars/4.webp",
  "/images/avatars/5.webp",
  "/images/avatars/6.webp",
  "/images/avatars/7.webp",
  "/images/avatars/8.webp",
  "/images/avatars/9.webp",
  "/images/avatars/10.webp",
  "/images/avatars/11.webp",
  "/images/avatars/12.webp",
  "/images/avatars/13.webp",
  "/images/avatars/14.webp",
  "/images/avatars/15.webp",
  "/images/avatars/16.webp",
];

type AdminProfile = {
    id: string;
    name: string;
    email: string;
    phone: string;
    image: string;
    role: string;
};

type PasswordData = {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
};

function Settings() {
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [passwordData, setPasswordData] = useState<PasswordData>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordValid, setPasswordValid] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

    // Fetch admin profile
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                let storedAvatar = "";
                try {
                    storedAvatar = localStorage.getItem("admin_avatar") || "";
                } catch {}

                // Real NestJS endpoint: GET /api/users/me
                const response = await fetch(`${API_URL}/users/me`);
                if (response.ok) {
                    const user = await response.json() as {
                      id: number | string;
                      email?: string;
                      firstName?: string;
                      lastName?: string;
                      phone?: string;
                      role?: string;
                      avatar?: string;
                      image?: string;
                    };
                    setProfile({
                        id: String(user.id),
                        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Modest Admin",
                        email: user.email ?? "",
                        phone: user.phone ?? "",
                        image: storedAvatar || user.avatar || user.image || DEFAULT_AVATARS[0],
                        role: user.role ?? "ADMINISTRATOR",
                    });
                } else {
                    setProfile({
                        id: "admin-1",
                        name: "Modest Admin",
                        email: "admin@modeststudio.com",
                        phone: "+971 50 123 4567",
                        image: storedAvatar || DEFAULT_AVATARS[0],
                        role: "ADMINISTRATOR",
                    });
                }
            } catch (error) {
                let storedAvatar = "";
                try {
                    storedAvatar = localStorage.getItem("admin_avatar") || "";
                } catch {}
                setProfile({
                    id: "admin-1",
                    name: "Modest Admin",
                    email: "admin@modeststudio.com",
                    phone: "+971 50 123 4567",
                    image: storedAvatar || DEFAULT_AVATARS[0],
                    role: "ADMINISTRATOR",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    // Avatar Selection from Presets
    const handleAvatarSelect = (avatarUrl: string) => {
        try {
            localStorage.setItem("admin_avatar", avatarUrl);
            window.dispatchEvent(new Event("admin_avatar_updated"));
            setProfile(prev => prev ? ({ ...prev, image: avatarUrl }) : null);
            toast.success("Default avatar selected & saved successfully!");
        } catch {
            toast.error("Failed to save avatar");
        }
    };

    // Custom Avatar Upload
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select a valid image file");
            return;
        }

        try {
            setIsUploadingAvatar(true);
            const toastId = toast.loading("Uploading picture to Cloudinary CDN...");
            const secureUrl = await uploadToCloudinary(file, "modest/admin");
            toast.dismiss(toastId);

            localStorage.setItem("admin_avatar", secureUrl);
            window.dispatchEvent(new Event("admin_avatar_updated"));
            setProfile(prev => prev ? ({ ...prev, image: secureUrl }) : null);
            toast.success("Admin picture uploaded and saved successfully!");
        } catch (err: any) {
            console.warn("Cloudinary upload failed, saving as high-quality local image:", err);
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result as string;
                localStorage.setItem("admin_avatar", dataUrl);
                window.dispatchEvent(new Event("admin_avatar_updated"));
                setProfile(prev => prev ? ({ ...prev, image: dataUrl }) : null);
                toast.success("Admin picture saved successfully!");
            };
            reader.readAsDataURL(file);
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Password validation
    const validatePassword = (password: string): string[] => {
        const errors: string[] = [];
        if (password.length < 8) errors.push('At least 8 characters');
        if (!/\d/.test(password)) errors.push('One number');
        return errors;
    };

    const handlePasswordChange = (field: keyof PasswordData, value: string) => {
        setPasswordData(prev => ({ ...prev, [field]: value }));

        if (field === 'newPassword') {
            setPasswordErrors(validatePassword(value));
        }

        if (value.length >= 8 && /\d/.test(value)) {
            setPasswordValid(true);
        }
    };

    // Toggle password visibility
    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    // Handle password reset
    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error('Please fill in all password fields');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New password and confirm password must match');
            return;
        }

        if (passwordErrors.length > 0) {
            toast.error('Please meet all password requirements');
            return;
        }

        try {
            setPasswordLoading(true);
            // Real NestJS endpoint: POST /api/auth/change-password
            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            if (response.ok) {
                toast.success('Password updated successfully. Please log in again.');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                const result = await response.json().catch(() => ({})) as { message?: string };
                toast.error(result.message || 'Failed to update password');
            }
        } catch (error) {
            toast.error('An error occurred');
            console.error('Password update error:', error);
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLoader/>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-3xl font-bold">Settings</h1>

            {/* Profile Information */}
            <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-indigo-600" />
                            Admin Profile & Avatar
                        </CardTitle>
                        <CardDescription>
                            Customize your administrator picture or choose from project presets. Updates everywhere across the header and sidebar in real-time.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {profile ? (
                            <>
                                {/* Avatar Control Section */}
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-indigo-500 shadow-md flex items-center justify-center">
                                            {profile.image ? (
                                                <Image 
                                                    src={profile.image || fallBackImage} 
                                                    width={96} 
                                                    height={96} 
                                                    alt="Admin Avatar" 
                                                    className="w-24 h-24 rounded-full object-cover" 
                                                    unoptimized
                                                />
                                            ) : (
                                                <User className="h-10 w-10 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-2 text-center sm:text-left">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Admin Profile Picture</h3>
                                        <p className="text-xs text-muted-foreground max-w-md">
                                            Upload your own custom image (JPG, PNG, WebP) or click any preset avatar below to apply instantly.
                                        </p>
                                        <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleAvatarUpload}
                                            />
                                            <Button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploadingAvatar}
                                                className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs gap-1.5 cursor-pointer"
                                            >
                                                {isUploadingAvatar ? (
                                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <UploadCloud className="h-3.5 w-3.5" />
                                                )}
                                                <span>{isUploadingAvatar ? "Uploading..." : "Upload Admin Picture"}</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Default Avatar Presets Chooser */}
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-amber-500" />
                                        <Label className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                                            Choose Default Avatar Preset
                                        </Label>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#181818]">
                                        {DEFAULT_AVATARS.map((avatarUrl, idx) => {
                                            const isSelected = profile.image === avatarUrl;
                                            return (
                                                <button
                                                    key={avatarUrl}
                                                    type="button"
                                                    onClick={() => handleAvatarSelect(avatarUrl)}
                                                    className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer hover:scale-105 ${
                                                        isSelected
                                                            ? "border-indigo-600 ring-2 ring-indigo-500/30 shadow-md"
                                                            : "border-transparent hover:border-gray-300 dark:hover:border-white/20"
                                                    }`}
                                                    title={`Avatar Preset #${idx + 1}`}
                                                >
                                                    <img
                                                        src={avatarUrl}
                                                        alt={`Preset ${idx + 1}`}
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                    {isSelected && (
                                                        <div className="absolute top-1 right-1 bg-indigo-600 text-white rounded-full p-0.5 shadow-sm">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Profile Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-white/5">
                                    <div className="p-3 rounded-lg border border-gray-200/60 dark:border-white/5">
                                        <p className="text-xs font-medium text-muted-foreground">Admin Name</p>
                                        <p className="font-semibold text-sm mt-0.5">{profile.name || "Modest Admin"}</p>
                                    </div>
                                    
                                    <div className="p-3 rounded-lg border border-gray-200/60 dark:border-white/5">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                            <Mail className="h-3.5 w-3.5" />
                                            Email Address
                                        </p>
                                        <p className="font-semibold text-sm mt-0.5">{profile.email || "admin@modeststudio.com"}</p>
                                    </div>
                                    
                                    <div className="p-3 rounded-lg border border-gray-200/60 dark:border-white/5">
                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                            <Phone className="h-3.5 w-3.5" />
                                            Phone Number
                                        </p>
                                        <p className="font-semibold text-sm mt-0.5">{profile.phone || "+971 50 123 4567"}</p>
                                    </div>

                                    <div className="p-3 rounded-lg border border-gray-200/60 dark:border-white/5">
                                        <p className="text-xs font-medium text-muted-foreground">Store Role</p>
                                        <p className="font-semibold text-sm mt-0.5 capitalize">{profile.role || "Administrator"}</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-center text-muted-foreground">
                                No profile information available.
                            </p>
                        )}
                    </CardContent>
                </Card>

            {/* Change Password */}
            <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Change Password
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordReset} className="space-y-4">
                            {/* Current Password */}
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        id="current-password"
                                        type={showPasswords.current ? 'text' : 'password'}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                        placeholder="Enter current password"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => togglePasswordVisibility('current')}
                                    >
                                        {showPasswords.current ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="new-password"
                                        type={showPasswords.new ? 'text' : 'password'}
                                        value={passwordData.newPassword}
                                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                        placeholder="Enter new password"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => togglePasswordVisibility('new')}
                                    >
                                        {showPasswords.new ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>

                                {/* Password Requirements */}
                                {passwordData.newPassword && (
                                    <div className="text-sm space-y-1">
                                        {['At least 8 characters', 'One number'].map((requirement) => {
                                            const isValid = !passwordErrors.includes(requirement);
                                            return (
                                                <div key={requirement} className="flex items-center gap-2">
                                                    {isValid ? (
                                                        <Check className="h-3 w-3 text-green-500" />
                                                    ) : (
                                                        <X className="h-3 w-3 text-red-500" />
                                                    )}
                                                    <span className={isValid ? 'text-green-600' : 'text-red-600'}>
                                                        {requirement}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirm-password"
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                        placeholder="Confirm new password"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => togglePasswordVisibility('confirm')}
                                    >
                                        {showPasswords.confirm ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>

                                {/* Password Match Indicator */}
                                {passwordData.confirmPassword && (
                                    <div className="flex items-center gap-2 text-sm">
                                        {passwordData.newPassword === passwordData.confirmPassword ? (
                                            <>
                                                <Check className="h-3 w-3 text-green-500" />
                                                <span className="text-green-600">Passwords match</span>
                                            </>
                                        ) : (
                                            <>
                                                <X className="h-3 w-3 text-red-500" />
                                                <span className="text-red-600">Passwords do not match</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={passwordLoading || !passwordValid || passwordData.newPassword !== passwordData.confirmPassword}
                                className="w-full"
                            >
                                {passwordLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Updating Password...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4 mr-2" />
                                        Update Password
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
        </div>
    );
}

export default Settings;
