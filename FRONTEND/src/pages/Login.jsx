import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/login", { email, password });

      // Save token
      localStorage.setItem("token", response.data.access_token);
      // Save user info so sidebar can show name + role badge
      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0F0A25]">

      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 bg-purple-800/20 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white font-bold text-xl shadow-lg">
            R
          </div>
          <span className="text-white font-bold text-xl">RetailFlow ERP</span>
        </div>

        {/* Headline */}
        <div className="z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage your entire<br />
            <span className="text-[#A78BFA]">retail business</span><br />
            from one place.
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
            Inventory, sales, purchases, employees, suppliers — all connected.
            Powered with AI insights.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-6">
            {["📦 Inventory", "💰 Sales", "🤖 AI Insights", "👥 RBAC Security", "📊 Reports"].map((f) => (
              <span key={f} className="bg-white/10 text-gray-300 text-xs px-3 py-1 rounded-full">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <p className="text-gray-600 text-xs z-10">
          © 2025 RetailFlow ERP • Built with FastAPI + React
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center text-white font-bold">R</div>
            <span className="text-white font-bold">RetailFlow ERP</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-gray-400 text-sm mb-8">Sign in to your workspace</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email address</label>
              <input
                id="login-email"
                type="email"
                placeholder="admin@company.com"
                autoComplete="email"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-[#7C3AED] hover:bg-purple-700 text-white font-semibold py-3 rounded-xl text-sm transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-purple-900/40 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#A78BFA] hover:text-purple-400 font-medium transition">
              Register here
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}

export default Login;