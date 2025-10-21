"use client";

import { IoSettings, IoPerson, IoNotifications, IoColorPalette, IoCamera, IoTrash, IoMail, IoLockClosed } from "react-icons/io5";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { createSupabaseClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { uploadProfilePicture, getProfilePictureUrl, deleteProfilePicture, validateProfilePictureFile } from "@/utils/storage/profile-pictures";

interface UserProfile {
  public_user_id: string;
  auth_user_id: string;
  [key: string]: unknown;
}

interface AuthUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

export default function SettingsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Form states
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      // Allow visitors too - they just won't have email/password features
      if (authUser) {
        setUser(authUser);
        setEmail(authUser.email || "");

        // Load profile data for authenticated users
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select(`
            *,
            public_users:public_user_id (
              first_name,
              last_name,
              email,
              profile_image_url
            )
          `)
          .eq("auth_user_id", authUser.id)
          .single();

        if (profileData) {
          setProfile(profileData);
          const publicUser = profileData.public_users as { first_name?: string; last_name?: string; profile_image_url?: string } | null;
          if (publicUser) {
            setDisplayName(`${publicUser.first_name || ''} ${publicUser.last_name || ''}`.trim());
            // Load profile image if available
            if (publicUser.profile_image_url) {
              setProfileImage(publicUser.profile_image_url);
            }
          }
        }
      } else {
        // Visitor mode - load from localStorage if available
        const savedName = localStorage.getItem('visitor_display_name');
        if (savedName) {
          setDisplayName(savedName);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      if (profile) {
        // Authenticated user - save to database
        const [firstName, ...lastNameParts] = displayName.split(' ');
        const lastName = lastNameParts.join(' ');

        const { error } = await supabase
          .from("public_users")
          .update({
            first_name: firstName || null,
            last_name: lastName || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", profile.public_user_id);

        if (error) throw error;

        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        // Visitor - save to localStorage
        localStorage.setItem('visitor_display_name', displayName);
        setMessage({ type: 'success', text: 'Profile updated locally! Sign up to save permanently.' });
      }
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: errorMessage || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleEmailUpdate = async () => {
    if (!email || email === user?.email) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const { error } = await supabase.auth.updateUser({ email });
      
      if (error) throw error;

      setMessage({ 
        type: 'success', 
        text: 'Check your new email to confirm the change!' 
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: errorMessage || 'Failed to update email' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setSaving(true);
    setMessage(null);
    
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: errorMessage || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if user is authenticated
    if (!user) {
      setMessage({ type: 'error', text: 'Please sign in to upload a profile picture' });
      return;
    }

    // Validate file
    const validation = validateProfilePictureFile(file);
    if (!validation.valid) {
      setMessage({ type: 'error', text: validation.error || 'Invalid file' });
      return;
    }

    setUploadingImage(true);
    setMessage(null);

    try {
      // Show preview immediately for better UX
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const { url, error } = await uploadProfilePicture(supabase, file);
      
      if (error) {
        setMessage({ type: 'error', text: error });
        // Reload the original image if upload failed
        await loadUserData();
      } else {
        setProfileImage(url);
        setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: `Upload failed: ${errorMessage}` });
      // Reload the original image
      await loadUserData();
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      "⚠️ Are you absolutely sure?\n\n" +
      "This will permanently delete:\n" +
      "• Your account\n" +
      "• All connected wallets\n" +
      "• Your portfolio data\n" +
      "• All settings and preferences\n\n" +
      "This action CANNOT be undone!"
    );

    if (!confirmed) return;

    const doubleConfirm = prompt(
      "Type 'DELETE' to confirm account deletion:"
    );

    if (doubleConfirm !== 'DELETE') {
      setMessage({ type: 'error', text: 'Account deletion cancelled' });
      return;
    }

    setSaving(true);
    setMessage(null);
    
    try {
      // Delete user data (RLS will handle cascade)
      if (profile?.public_user_id) {
        await supabase
          .from("public_users")
          .delete()
          .eq("id", profile.public_user_id);
      }

      // Delete auth user (requires admin/service role in production)
      // For now, sign out and show message
      await supabase.auth.signOut();
      
      router.push('/?deleted=true');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: errorMessage || 'Failed to delete account' });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl">
            <IoSettings className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Settings
          </h1>
        </div>
        <p className="text-gray-400">
          Manage your account preferences and security
        </p>
      </div>

      {/* Global Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Profile Picture */}
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl">
              <IoCamera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-1">
                Profile Picture
              </h2>
              <p className="text-sm text-gray-400">
                {user ? 'Upload a profile picture to personalize your account' : 'Sign in to upload a profile picture'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#25d695] to-[#25d695] flex items-center justify-center overflow-hidden">
                {uploadingImage ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <IoPerson className="w-12 h-12 text-white" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!user || uploadingImage}
                className="absolute bottom-0 right-0 p-2 card-coreum rounded-full border-2 border-[#1b1d23] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IoCamera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={!user || uploadingImage}
              />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">
                JPG, PNG, GIF or WebP. Max size 5MB.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={!user || uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : 'Upload Photo'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Profile Settings */}
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
              <IoPerson className="w-5 h-5 text-[#25d695] dark:text-[#25d695]" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-1">
                Profile Information
              </h2>
              <p className="text-sm text-gray-400">
                Update your display name
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleProfileUpdate}
              disabled={saving || !displayName}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>

        {/* Email Settings - Only for authenticated users */}
        {user && (
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                <IoMail className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-1">
                  Email Address
                </h2>
                <p className="text-sm text-gray-400">
                  Update your email address (requires confirmation)
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current: {user?.email}
                </p>
              </div>
              <Button 
                onClick={handleEmailUpdate}
                disabled={saving || !email || email === user?.email}
              >
                {saving ? 'Updating...' : 'Update Email'}
              </Button>
            </div>
          </Card>
        )}

        {/* Notifications */}
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl">
              <IoNotifications className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-1">
                Notifications
              </h2>
              <p className="text-sm text-gray-400">
                Choose what updates you want to receive
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 border border-[#1b1d23] rounded-lg">
              <span className="text-sm text-gray-300">
                Portfolio updates
              </span>
              <input type="checkbox" disabled className="opacity-50" />
            </label>
            <label className="flex items-center justify-between p-3 border border-[#1b1d23] rounded-lg">
              <span className="text-sm text-gray-300">
                Price alerts
              </span>
              <input type="checkbox" disabled className="opacity-50" />
            </label>
            <label className="flex items-center justify-between p-3 border border-[#1b1d23] rounded-lg">
              <span className="text-sm text-gray-300">
                Membership updates
              </span>
              <input type="checkbox" disabled className="opacity-50" />
            </label>
          </div>
        </Card>

        {/* Security / Password - Only for authenticated users */}
        {user && (
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                <IoLockClosed className="w-5 h-5 text-[#25d695] dark:text-[#25d695]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-1">
                  Change Password
                </h2>
                <p className="text-sm text-gray-400">
                  Update your password to keep your account secure
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Must be at least 8 characters
                </p>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <Button 
                onClick={handlePasswordChange}
                disabled={saving || !currentPassword || !newPassword || !confirmPassword}
              >
                {saving ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </Card>
        )}

        {/* Visitor Upgrade Prompt */}
        {!user && (
          <Card className="p-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                <IoPerson className="w-5 h-5 text-[#25d695] dark:text-[#25d695]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  Create an Account
                </h2>
                <p className="text-sm text-[#179b69] dark:text-blue-300 mb-4">
                  Sign up to unlock additional features like email/password management, 
                  cloud-synced settings, and access across devices.
                </p>
                <Link href="/sign-up">
                  <Button className="bg-[#25d695] hover:bg-[#179b69]">
                    Create Free Account
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Appearance */}
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-xl">
              <IoColorPalette className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-1">
                Appearance
              </h2>
              <p className="text-sm text-gray-400">
                Customize how ShieldNest looks for you
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg card-coreum text-white"
                onChange={(e) => {
                  const theme = e.target.value;
                  if (theme === 'system') {
                    // Use system preference
                    document.documentElement.classList.remove('dark');
                    localStorage.removeItem('theme');
                  } else {
                    document.documentElement.classList.toggle('dark', theme === 'dark');
                    localStorage.setItem('theme', theme);
                  }
                  // Reload to apply theme
                  window.location.reload();
                }}
              >
                <option value="system">System default</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Danger Zone - Delete Account (only for authenticated users) */}
        {user && (
          <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl">
                <IoTrash className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-1">
                  Danger Zone
                </h2>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Permanently delete your account and all associated data
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-white mb-2 font-medium">
                  This action will permanently delete:
                </p>
                <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                  <li>Your account and profile</li>
                  <li>All connected wallets</li>
                  <li>Portfolio tracking data</li>
                  <li>Settings and preferences</li>
                </ul>
                <p className="text-sm text-red-600 dark:text-red-400 mt-3 font-medium">
                  ⚠️ This action cannot be undone!
                </p>
              </div>
              <Button 
                onClick={handleDeleteAccount}
                disabled={saving}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {saving ? 'Deleting Account...' : 'Delete My Account'}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}

