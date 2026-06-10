import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MdDashboard, MdInventory, MdShoppingCart,
  MdSettings, MdLogout, MdWarehouse, MdPeople,
} from "react-icons/md";
import { FaUsers, FaTruck, FaChartBar, FaShoppingBag, FaBrain } from "react-icons/fa";

// All nav items in one array — easy to extend later
const NAV_ITEMS = [
  { to: "/dashboard",  label: "Dashboard",  icon: <MdDashboard size={20} /> },
  { to: "/inventory",  label: "Inventory",  icon: <MdWarehouse  size={20} /> },
  { to: "/products",   label: "Products",   icon: <MdInventory  size={20} /> },
  { to: "/employees",  label: "Employees",  icon: <FaUsers      size={18} /> },
  { to: "/customers",  label: "Customers",  icon: <MdPeople     size={20} /> },
  { to: "/suppliers",  label: "Suppliers",  icon: <FaTruck      size={18} /> },
  { to: "/sales",      label: "Sales",      icon: <MdShoppingCart size={20} /> },
  { to: "/purchases",  label: "Purchases",  icon: <FaShoppingBag size={18} /> },
];

const ADVANCED_ITEMS = [
  { to: "/reports",  label: "Reports",  icon: <FaChartBar size={18} /> },
  { to: "/ai",       label: "AI Insights", icon: <FaBrain size={18} /> },
  { to: "/settings", label: "Settings", icon: <MdSettings size={20} /> },
];

function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // ── Company name — reads from localStorage, updates live on settings save
  const [companyName, setCompanyName] = useState(
    localStorage.getItem("companyName") || "RetailFlow ERP"
  );

  useEffect(() => {
    const refresh = () =>
      setCompanyName(localStorage.getItem("companyName") || "RetailFlow ERP");
    window.addEventListener("settings-updated", refresh);
    return () => window.removeEventListener("settings-updated", refresh);
  }, []);

  // Get the stored user info from localStorage
  const userRaw   = localStorage.getItem("user");
  const user      = userRaw ? JSON.parse(userRaw) : null;
  const initials  = user?.username?.charAt(0)?.toUpperCase() || "A";
  const roleBadge = user?.role || "employee";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Helper: is this link the active page?
  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, label, icon }) => (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
        isActive(to)
          ? "bg-[#7C3AED] text-white shadow-lg shadow-purple-900/40"
          : "text-gray-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      {/* Icon container */}
      <span className={`flex-shrink-0 ${isActive(to) ? "text-white" : "text-gray-400 group-hover:text-white"}`}>
        {icon}
      </span>
      {label}

      {/* Active dot indicator on the right */}
      {isActive(to) && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-80" />
      )}
    </Link>
  );

  return (
    <div className="w-64 bg-[#0F0A25] text-white min-h-screen flex flex-col">

      {/* ── Logo / Brand ── */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-900/50">
            R
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">{companyName}</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Management System</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">

        {/* Main nav */}
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} {...item} />
        ))}

        {/* Divider + Advanced section */}
        <div className="pt-4 pb-1 px-2">
          <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
            Advanced
          </p>
        </div>

        {ADVANCED_ITEMS.map((item) => (
          <NavLink key={item.to} {...item} />
        ))}
      </nav>

      {/* ── User Profile + Logout ── */}
      <div className="px-3 py-4 border-t border-white/10">
        {/* Role badge */}
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-[#7C3AED] flex items-center justify-center font-bold text-sm shadow">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.username || "Admin"}
            </p>
            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${
              roleBadge === "admin"   ? "bg-purple-600/40 text-purple-300" :
              roleBadge === "manager" ? "bg-blue-600/40 text-blue-300" :
                                        "bg-green-600/40 text-green-300"
            }`}>
              {roleBadge.charAt(0).toUpperCase() + roleBadge.slice(1)}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-red-600/80 text-gray-300 hover:text-white px-3 py-2 rounded-xl text-sm transition-all duration-150"
        >
          <MdLogout size={18} />
          Logout
        </button>
      </div>

    </div>
  );
}

export default Sidebar;