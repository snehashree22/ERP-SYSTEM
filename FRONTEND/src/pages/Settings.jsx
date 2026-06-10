import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

// ── tiny Toast component ──────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors =
    type === "success"
      ? "bg-green-500 text-white"
      : "bg-red-500 text-white";

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-medium animate-fade-in-up ${colors}`}
    >
      <span>{type === "success" ? "✅" : "❌"}</span>
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  );
}

// ── Section card wrapper ──────────────────────────────────
function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <span className="text-xl">{icon}</span>
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── Main Settings page ────────────────────────────────────
function Settings() {
  // Company settings
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency]       = useState("INR");
  const [timezone, setTimezone]       = useState("Asia/Kolkata");

  // Theme
  const [theme, setTheme] = useState("light");

  // Password
  const [currentPassword,  setCurrentPassword]  = useState("");
  const [newPassword,      setNewPassword]      = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [showPasswords,    setShowPasswords]    = useState(false);

  // Notifications
  const [notifLowStock, setNotifLowStock]   = useState(true);
  const [notifNewSale,  setNotifNewSale]    = useState(true);
  const [notifReports,  setNotifReports]    = useState(false);

  // UI state
  const [toast,        setToast]       = useState(null);
  const [pwdLoading,   setPwdLoading]  = useState(false);

  // Read saved settings on mount
  useEffect(() => {
    setCompanyName(localStorage.getItem("companyName") || "RetailFlow ERP");
    setTheme(localStorage.getItem("theme")             || "light");
    setCurrency(localStorage.getItem("currency")       || "INR");
    setTimezone(localStorage.getItem("timezone")       || "Asia/Kolkata");
    setNotifLowStock(localStorage.getItem("notifLowStock") !== "false");
    setNotifNewSale(localStorage.getItem("notifNewSale")   !== "false");
    setNotifReports(localStorage.getItem("notifReports")   === "true");
  }, []);

  // Apply theme to <html> immediately whenever it changes
  const applyTheme = (t) => {
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const showToast = (message, type = "success") => setToast({ message, type });

  // ── Save company + theme + notifications ──────────────────
  const handleSaveGeneral = () => {
    localStorage.setItem("companyName",    companyName.trim() || "RetailFlow ERP");
    localStorage.setItem("theme",          theme);
    localStorage.setItem("currency",       currency);
    localStorage.setItem("timezone",       timezone);
    localStorage.setItem("notifLowStock",  notifLowStock);
    localStorage.setItem("notifNewSale",   notifNewSale);
    localStorage.setItem("notifReports",   notifReports);

    // Notify all other components (Sidebar / Navbar) that settings changed
    window.dispatchEvent(new Event("settings-updated"));

    showToast("Settings saved successfully!");
  };

  // ── Change password ───────────────────────────────────────
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill in all password fields.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters.", "error");
      return;
    }
    setPwdLoading(true);
    try {
      await api.post("/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      showToast("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to change password.", "error");
    } finally {
      setPwdLoading(false);
    }
  };

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  })();

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
        value ? "bg-[#7C3AED]" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
          value ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your company preferences and account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Company Information */}
          <Section title="Company Information" icon="🏢">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. RetailFlow ERP"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
                <p className="text-xs text-gray-400 mt-1">This name appears in the sidebar and reports.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  >
                    <option value="INR">₹ Indian Rupee (INR)</option>
                    <option value="USD">$ US Dollar (USD)</option>
                    <option value="EUR">€ Euro (EUR)</option>
                    <option value="GBP">£ British Pound (GBP)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
              </div>
            </div>
          </Section>

          {/* Appearance */}
          <Section title="Appearance" icon="🎨">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                Theme
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "light", label: "Light Mode", icon: "☀️", desc: "Clean white interface" },
                  { value: "dark",  label: "Dark Mode",  icon: "🌙", desc: "Easy on the eyes" },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      theme === t.value
                        ? "border-[#7C3AED] bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl">{t.icon}</span>
                    <div>
                      <p className={`text-sm font-semibold ${theme === t.value ? "text-[#7C3AED]" : "text-gray-700"}`}>
                        {t.label}
                      </p>
                      <p className="text-xs text-gray-400">{t.desc}</p>
                    </div>
                    {theme === t.value && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* Notifications */}
          <Section title="Notifications" icon="🔔">
            <div className="space-y-4">
              {[
                { label: "Low Stock Alerts",    desc: "Notify when product stock falls below reorder level", value: notifLowStock, onChange: setNotifLowStock },
                { label: "New Sale Orders",     desc: "Notify when a new sale order is placed",              value: notifNewSale,  onChange: setNotifNewSale },
                { label: "Report Generation",   desc: "Notify when reports are ready to download",           value: notifReports,  onChange: setNotifReports },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle value={item.value} onChange={item.onChange} />
                </div>
              ))}
            </div>
          </Section>

          {/* Save button */}
          <button
            onClick={handleSaveGeneral}
            className="w-full bg-[#7C3AED] hover:bg-purple-700 text-white font-semibold py-3.5 rounded-xl transition shadow-lg shadow-purple-900/30 text-sm"
          >
            💾 Save All Settings
          </button>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-6">

          {/* Profile Card */}
          <Section title="Your Profile" icon="👤">
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-16 h-16 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-900/30 mb-3">
                {user?.username?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <p className="font-bold text-gray-800 text-sm">{user?.username || "Admin"}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.email || "—"}</p>
              <span className={`mt-2 text-xs px-3 py-1 rounded-full font-semibold ${
                user?.role === "admin"   ? "bg-purple-100 text-purple-700" :
                user?.role === "manager" ? "bg-blue-100 text-blue-700" :
                                           "bg-green-100 text-green-700"
              }`}>
                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Employee"}
              </span>
            </div>
          </Section>

          {/* Change Password */}
          <Section title="Change Password" icon="🔒">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Current Password</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">New Password</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Confirm New Password</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>

              {/* Password match indicator */}
              {newPassword && confirmPassword && (
                <p className={`text-xs font-medium ${newPassword === confirmPassword ? "text-green-600" : "text-red-500"}`}>
                  {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                </p>
              )}

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs text-gray-500">Show passwords</span>
              </label>

              <button
                onClick={handleChangePassword}
                disabled={pwdLoading}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2.5 rounded-xl transition text-sm disabled:opacity-50 mt-1"
              >
                {pwdLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating…
                  </span>
                ) : (
                  "Update Password"
                )}
              </button>
            </div>
          </Section>

          {/* App Info */}
          <Section title="About" icon="ℹ️">
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between"><span>Version</span><span className="font-semibold text-gray-700">1.0.0</span></div>
              <div className="flex justify-between"><span>Backend</span><span className="font-semibold text-gray-700">FastAPI</span></div>
              <div className="flex justify-between"><span>Frontend</span><span className="font-semibold text-gray-700">React</span></div>
              <div className="flex justify-between"><span>Database</span><span className="font-semibold text-gray-700">PostgreSQL</span></div>
              <div className="flex justify-between"><span>AI</span><span className="font-semibold text-gray-700">Google Gemini</span></div>
            </div>
          </Section>

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </DashboardLayout>
  );
}

export default Settings;