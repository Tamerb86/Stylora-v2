import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import {
  User,
  Key,
  Globe,
  Loader2,
  Save,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'api'>('profile');
  
  // Profile form
  const [name, setName] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);

  // API Keys (placeholder - would need backend implementation)
  const [apiKeys, setApiKeys] = useState<Array<{
    id: string;
    key: string;
    label: string;
    createdAt: string;
  }>>([]);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await api.updateProfile({ name });
      await refreshProfile();
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const copyApiKey = async (key: string, id: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(id);
    toast.success('API key copied!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'api', label: 'API Keys', icon: Key },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings</p>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="input bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="label">Current Plan</label>
                <div className="flex items-center gap-2">
                  <span className="badge-primary capitalize">
                    {profile?.planName || 'Free'}
                  </span>
                </div>
              </div>

              <div>
                <label className="label">Preferred Language</label>
                <select className="input">
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* API Keys Tab */}
          {activeTab === 'api' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-medium text-gray-900">API Keys</h3>
                  <p className="text-sm text-gray-500">
                    Use API keys to integrate with the Chrome extension or external tools
                  </p>
                </div>
                <button className="btn-primary btn-sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Create Key
                </button>
              </div>

              {apiKeys.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No API keys yet</p>
                  <button className="btn-outline btn-sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Create your first API key
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((apiKey) => (
                    <div
                      key={apiKey.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{apiKey.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm text-gray-500 font-mono">
                            {showKey === apiKey.id
                              ? apiKey.key
                              : `${apiKey.key.slice(0, 8)}${'•'.repeat(24)}`}
                          </code>
                          <button
                            onClick={() =>
                              setShowKey(showKey === apiKey.id ? null : apiKey.id)
                            }
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            {showKey === apiKey.id ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Created {new Date(apiKey.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyApiKey(apiKey.key, apiKey.id)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          {copiedKey === apiKey.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-medium text-amber-800 mb-1">Security Notice</h4>
                <p className="text-sm text-amber-700">
                  Keep your API keys secure. Do not share them publicly or commit them to version control.
                  If you suspect a key has been compromised, delete it immediately and create a new one.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
