"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, Lock, Eye, EyeOff, Check, X, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";;
import { toast } from 'sonner';
import { fallBackImage } from '@/constants/values';
import AdminLoader from './AdminLoader';
import { API_URL } from '@/lib/api-client';

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
                    };
                    setProfile({
                        id: String(user.id),
                        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "",
                        email: user.email ?? "",
                        phone: user.phone ?? "",
                        image: "",
                        role: user.role ?? "",
                    });
                }
            } catch (error) {
                toast.error('Failed to load profile');
                console.error('Failed to fetch profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

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
                            <User className="h-5 w-5" />
                            Profile Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {profile ? (
                            <>
                                {/* Profile Image */}
                                <div className="flex justify-center mb-4">
                                    <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                                        {profile.image ? (
                                            <Image 
                                                src={profile.image || fallBackImage} 
                                                width={80} 
                                                height={80} 
                                                alt="Profile" 
                                                className="w-20 h-20 rounded-full object-cover" 
                                            />
                                        ) : (
                                            <User className="h-8 w-8 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>

                                {/* Profile Details */}
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                                        <p className="font-medium">{profile.name || "N/A"}</p>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            <Mail className="h-4 w-4" />
                                            Email
                                        </p>
                                        <p className="font-medium">{profile.email}</p>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            <Phone className="h-4 w-4" />
                                            Phone
                                        </p>
                                        <p className="font-medium">{profile.phone || "N/A"}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Role</p>
                                        <p className="font-medium capitalize">{profile.role}</p>
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
