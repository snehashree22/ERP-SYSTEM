import { Link } from "react-router-dom";
import { FiBox, FiDollarSign, FiShield, FiTrendingUp, FiLayers, FiFileText } from "react-icons/fi";

function LandingPage() {
  const features = [
    {
      icon: <FiBox className="w-6 h-6" />,
      title: "Inventory Management",
      description: "Real-time stock tracking, automatic deductions on sales, and low-stock alerts.",
    },
    {
      icon: <FiDollarSign className="w-6 h-6" />,
      title: "Sales & Purchases",
      description: "Point-of-sale style order creation and tracking with seamless inventory sync.",
    },
    {
      icon: <FiShield className="w-6 h-6" />,
      title: "Secure Authentication",
      description: "Enterprise-grade JWT login with 3-tier Role-Based Access Control.",
    },
    {
      icon: <FiTrendingUp className="w-6 h-6" />,
      title: "AI Insights",
      description: "Integrated Google Gemini AI for smart business intelligence and data analysis.",
    },
    {
      icon: <FiLayers className="w-6 h-6" />,
      title: "Modern UI/UX",
      description: "Beautiful, fully responsive dark mode interface powered by React and Tailwind.",
    },
    {
      icon: <FiFileText className="w-6 h-6" />,
      title: "PDF Reports",
      description: "Downloadable financial, sales, and inventory reports generated on the fly.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0F0A25] text-white font-sans selection:bg-[#7C3AED] selection:text-white">
      {/* ── Background Decorative Elements ── */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#7C3AED]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#A78BFA]/10 rounded-full blur-[120px]" />
      </div>

      {/* ── Navigation ── */}
      <nav className="relative z-10 border-b border-white/5 bg-[#0F0A25]/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-900/50">
              R
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              RetailFlow ERP
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-gray-300 hover:text-white font-medium text-sm transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="bg-[#7C3AED] hover:bg-purple-600 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-all shadow-lg shadow-purple-900/40 hover:shadow-purple-900/60"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-[#A78BFA] font-medium mb-8 animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A78BFA] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A78BFA]"></span>
          </span>
          v1.0 Now Available
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
          Manage your retail business <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A78BFA] to-[#7C3AED]">
            with complete clarity.
          </span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          The all-in-one ERP system designed to unify your inventory, sales, purchases, and workforce under one intelligent dashboard.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto bg-[#7C3AED] hover:bg-purple-600 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-purple-900/40 hover:shadow-purple-900/60 hover:-translate-y-0.5"
          >
            Start Free Trial
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-xl border border-white/10 transition-all hover:-translate-y-0.5"
          >
            Sign In to Workspace
          </Link>
        </div>
      </header>

      {/* ── Features Grid ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to scale</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Powerful tools connected seamlessly, helping you make data-driven decisions and streamline operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/20 text-[#A78BFA] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#7C3AED] group-hover:text-white transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-r from-[#7C3AED]/20 to-[#5B21B6]/20 border border-purple-500/20 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#7C3AED]/30 blur-[80px] rounded-full mix-blend-screen" />
          <h2 className="text-3xl font-bold mb-4 relative z-10">Ready to transform your retail operations?</h2>
          <p className="text-purple-200/70 mb-8 max-w-xl mx-auto relative z-10">
            Join modern businesses using RetailFlow to manage inventory, track sales, and empower employees.
          </p>
          <Link
            to="/register"
            className="inline-block bg-white text-[#5B21B6] hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl transition-all shadow-xl hover:-translate-y-0.5 relative z-10"
          >
            Create Your Account
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 mt-12 py-8 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} RetailFlow ERP. Built for efficient retail management.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
