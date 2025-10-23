"use client";

import { useState, useEffect } from "react";
import { IoSettings, IoNotifications, IoPerson, IoShield, IoMail } from "react-icons/io5";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseClient } from "@/utils/supabase/client";
import NotificationCenter from "@/components/notifications/NotificationCenter";

/**
 * SettingsPage
 * 
 * User settings page with tabs for notifications, profile, and preferences.
 * Includes notification management and email preferences.
 * 
 * Location: /Users/exe/Downloads/Cursor/shieldv2/app/settings/page.tsx
 */

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("notifications");
  const [user, setUser] = useState<any>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [featureAnnouncements, setFeatureAnnouncements] = useState(true);
  const [liquidityAlerts, setLiquidityAlerts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUser();
    
    // Check URL params for tab
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  const loadUser = async () => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      // Load notification preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prefs) {
        setEmailNotifications(prefs.email_notifications ?? true);
        setFeatureAnnouncements(prefs.feature_announcements ?? true);
        setLiquidityAlerts(prefs.liquidity_alerts ?? true);
      }
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const supabase = createSupabaseClient();
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          email_notifications: emailNotifications,
          feature_announcements: featureAnnouncements,
          liquidity_alerts: liquidityAlerts,
          updated_at: new Date().toISOString(),
        });

      alert('Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "notifications", label: "Notifications", icon: IoNotifications },
    { id: "profile", label: "Profile", icon: IoPerson },
    { id: "preferences", label: "Preferences", icon: IoSettings },
  ];

  return (
    <main className="p-6 max-w-7xl mx-auto neo-gradient-bg min-h-screen">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
            <IoSettings className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            Settings
          </h1>
        </div>
        <p className="text-lg text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <Card className="mb-6">
        <div className="flex border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-purple-400 border-b-2 border-purple-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <NotificationCenter userId={user?.id} />

              {/* Email Notification Settings */}
              <Card className="p-6 mt-8 bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                    <IoMail className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Email Notification Preferences
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                    <div>
                      <h4 className="font-semibold text-white mb-1">
                        Email Notifications
                      </h4>
                      <p className="text-sm text-gray-400">
                        Receive updates and announcements via email
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                    <div>
                      <h4 className="font-semibold text-white mb-1">
                        Feature Announcements
                      </h4>
                      <p className="text-sm text-gray-400">
                        Get notified when new features launch
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={featureAnnouncements}
                        onChange={(e) => setFeatureAnnouncements(e.target.checked)}
                        className="sr-only peer"
                        disabled={!emailNotifications}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                    <div>
                      <h4 className="font-semibold text-white mb-1">
                        Liquidity Pool Alerts
                      </h4>
                      <p className="text-sm text-gray-400">
                        Get early access to high-earning pools
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={liquidityAlerts}
                        onChange={(e) => setLiquidityAlerts(e.target.checked)}
                        className="sr-only peer"
                        disabled={!emailNotifications}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <Button
                    onClick={savePreferences}
                    disabled={isSaving || !user}
                    className="w-full mt-4 h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isSaving ? "Saving..." : "Save Preferences"}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-gray-800 to-gray-900">
                <h3 className="text-xl font-bold text-white mb-6">Profile Settings</h3>
                {user ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email || ""}
                        disabled
                        className="mt-2"
                      />
                    </div>
                    <p className="text-sm text-gray-400">
                      More profile settings coming soon!
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">
                      Sign in to manage your profile
                    </p>
                    <Button
                      onClick={() => (window.location.href = "/sign-in")}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Sign In
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-gray-800 to-gray-900">
                <h3 className="text-xl font-bold text-white mb-6">
                  General Preferences
                </h3>
                <p className="text-gray-400">
                  Additional preferences coming soon!
                </p>
              </Card>
            </div>
          )}
        </div>
      </Card>
    </main>
  );
}
