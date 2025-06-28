import { useState, useEffect } from "react";
import { Save, Lock, User, Palette } from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

interface UserSettings {
  name: string;
  email: string;
  organization: string;
  bio: string;
  website: string;
  notificationPreferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    eventReminders: boolean;
    commentNotifications: boolean;
    newsletterSubscription: boolean;
  };
  securitySettings: {
    twoFactorAuth: boolean;
    sessionTimeout: string;
    loginNotifications: boolean;
  };
  appearanceSettings: {
    theme: string;
    fontSize: string;
    compactMode: boolean;
    animationsEnabled: boolean;
  };
}

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "appearance"
  >("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<UserSettings>({
    name: "",
    email: "",
    organization: "",
    bio: "",
    website: "",
    notificationPreferences: {
      emailNotifications: true,
      pushNotifications: true,
      eventReminders: true,
      commentNotifications: true,
      newsletterSubscription: false,
    },
    securitySettings: {
      twoFactorAuth: false,
      sessionTimeout: "30",
      loginNotifications: true,
    },
    appearanceSettings: {
      theme: "dark",
      fontSize: "medium",
      compactMode: false,
      animationsEnabled: true,
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get("/users/settings");
        setSettings(data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const { data } = await api.put("/users/settings", settings);
      setSettings(data);

      // Update user context if profile info changed
      if (activeTab === "profile") {
        updateUser({
          ...user,
          name: data.name,
          email: data.email,
        });
      }

      toast.success("Settings saved successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Settings">
        <div className="flex items-center justify-center h-96">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
          <p className="ml-4 text-dark-500">Loading settings...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">
        {/* Settings Navigation */}
        <div className="bg-dark-100 p-4 rounded-lg">
          <div className="flex flex-wrap gap-4">
            <button
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "profile"
                  ? "bg-primary-500 text-dark"
                  : "text-dark-500 hover:bg-dark-200 hover:text-white"
              }`}
              onClick={() => setActiveTab("profile")}
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </button>

            <button
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "security"
                  ? "bg-primary-500 text-dark"
                  : "text-dark-500 hover:bg-dark-200 hover:text-white"
              }`}
              onClick={() => setActiveTab("security")}
            >
              <Lock className="h-4 w-4 mr-2" />
              Security
            </button>

            <button
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "appearance"
                  ? "bg-primary-500 text-dark"
                  : "text-dark-500 hover:bg-dark-200 hover:text-white"
              }`}
              onClick={() => setActiveTab("appearance")}
            >
              <Palette className="h-4 w-4 mr-2" />
              Appearance
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="bg-dark-100 p-6 rounded-lg">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">
                Profile Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) =>
                      setSettings({ ...settings, name: e.target.value })
                    }
                    className="input"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) =>
                      setSettings({ ...settings, email: e.target.value })
                    }
                    className="input"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="label">Organization</label>
                  <input
                    type="text"
                    value={settings.organization}
                    onChange={(e) =>
                      setSettings({ ...settings, organization: e.target.value })
                    }
                    className="input"
                    placeholder="Enter your organization"
                  />
                </div>

                <div>
                  <label className="label">Website</label>
                  <input
                    type="url"
                    value={settings.website}
                    onChange={(e) =>
                      setSettings({ ...settings, website: e.target.value })
                    }
                    className="input"
                    placeholder="Enter your website"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Bio</label>
                  <textarea
                    value={settings.bio}
                    onChange={(e) =>
                      setSettings({ ...settings, bio: e.target.value })
                    }
                    className="input min-h-32"
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">
                Security Settings
              </h2>
              <div className="space-y-4">

              

                <div className="pt-4">
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to delete your account? This action cannot be undone."
                        )
                      ) {
                        // Handle account deletion
                        api
                          .delete("/users/account")
                          .then(() => {
                            // Log out and redirect to login page
                            window.location.href = "/login";
                          })
                          .catch((error: any) => {
                            toast.error(
                              error.response?.data?.message ||
                                "Failed to delete account"
                            );
                          });
                      }
                    }}
                    className="btn-secondary text-error hover:bg-error hover:text-white"
                  >
                    Delete Account
                  </button>
                  <p className="mt-2 text-dark-500 text-sm">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">
                Appearance Settings
              </h2>

              <div className="space-y-4">
                <div className="py-3 border-b border-dark-300">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">Theme</h3>
                    <select
                      value={settings.appearanceSettings.theme}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appearanceSettings: {
                            ...settings.appearanceSettings,
                            theme: e.target.value,
                          },
                        })
                      }
                      className="input bg-dark-200 h-9 text-sm w-32"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  <p className="text-dark-500 text-sm">
                    Choose your preferred color theme
                  </p>
                </div>

                <div className="py-3 border-b border-dark-300">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">Font Size</h3>
                    <select
                      value={settings.appearanceSettings.fontSize}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appearanceSettings: {
                            ...settings.appearanceSettings,
                            fontSize: e.target.value,
                          },
                        })
                      }
                      className="input bg-dark-200 h-9 text-sm w-32"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <p className="text-dark-500 text-sm">
                    Adjust the text size for better readability
                  </p>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-dark-300">
                  <div>
                    <h3 className="text-white font-medium">Compact Mode</h3>
                    <p className="text-dark-500 text-sm">
                      Reduce spacing between elements
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.appearanceSettings.compactMode}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appearanceSettings: {
                            ...settings.appearanceSettings,
                            compactMode: e.target.checked,
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-dark-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-dark-300">
                  <div>
                    <h3 className="text-white font-medium">
                      Enable Animations
                    </h3>
                    <p className="text-dark-500 text-sm">
                      Show animations and transitions
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.appearanceSettings.animationsEnabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appearanceSettings: {
                            ...settings.appearanceSettings,
                            animationsEnabled: e.target.checked,
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-dark-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 mr-2 rounded-full border-2 border-dark border-r-transparent animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
