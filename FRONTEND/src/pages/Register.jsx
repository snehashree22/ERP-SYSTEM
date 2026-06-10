import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

// Role info shown on the left panel (informational only — not selectable)
const ROLES = [
  {
    value: "admin",
    label: "Admin",
    desc: "Full access — can create, edit, delete everything",
    color: "#7C3AED",
    icon: "👑",
  },
  {
    value: "manager",
    label: "Manager",
    desc: "Can create & edit — cannot delete records",
    color: "#3B82F6",
    icon: "🏢",
  },
  {
    value: "employee",
    label: "Employee",
    desc: "Read-only + can create sales orders",
    color: "#10B981",
    icon: "👤",
  },
];

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Role is always "employee" on the backend — no matter what is sent
      await api.post("/register", { username, email, password, role: "employee" });
      navigate("/");   // go to login after successful registration
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0F0A25]">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 bg-purple-800/20 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white font-bold text-xl shadow-lg">
            R
          </div>
          <span className="text-white font-bold text-xl">RetailFlow ERP</span>
        </div>

        {/* Role explanation */}
        <div className="z-10">
          <h2 className="text-3xl font-bold text-white leading-tight mb-6">
            Role-Based<br />
            <span className="text-[#A78BFA]">Access Control</span>
          </h2>

          <div className="space-y-3">
            {ROLES.map((r) => (
              <div key={r.value} className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
                <span className="text-2xl">{r.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{r.label}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-600 text-xs z-10">© 2025 RetailFlow ERP</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">

          <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-gray-400 text-sm mb-2">Public registration creates an Employee account</p>

          {/* Security info notice */}
          <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-6">
            <span className="text-lg mt-0.5">🔒</span>
            <div>
              <p className="text-xs font-semibold text-white">Employee accounts only</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                For Admin or Manager access, contact your system administrator.
              </p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">

            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Username</label>
              <input
                type="text"
                placeholder="john_doe"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email address</label>
              <input
                type="email"
                placeholder="john@company.com"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Locked role badge */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Account Type</label>
              <div className="flex items-center gap-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl px-4 py-3">
                <span className="text-xl">👤</span>
                <div>
                  <p className="text-white text-sm font-semibold">Employee</p>
                  <p className="text-xs text-gray-400">Read-only + can create sales orders</p>
                </div>
                <span className="ml-auto text-xs bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded-full font-medium">Default</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7C3AED] hover:bg-purple-700 text-white font-semibold py-3 rounded-xl text-sm transition disabled:opacity-60 shadow-lg shadow-purple-900/40 mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                "Create Employee Account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/" className="text-[#A78BFA] hover:text-purple-400 font-medium transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;