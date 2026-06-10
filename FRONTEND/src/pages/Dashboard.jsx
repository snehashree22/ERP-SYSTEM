import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { MdInventory, MdPeople, MdShoppingCart } from "react-icons/md";
import { FaUsers, FaTruck, FaRupeeSign } from "react-icons/fa";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";

// ── Trend Badge ──────────────────────────────────────────────────────────────
function TrendBadge({ pct }) {
  if (pct === null || pct === undefined) return null;
  const isUp = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
      isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
    }`}>
      {isUp ? "↑" : "↓"} {Math.abs(pct)}%
      <span className="font-normal ml-0.5 text-[10px]">{isUp ? "vs last mo" : "vs last mo"}</span>
    </span>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, pct, icon, bgColor }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white`} style={{ background: bgColor }}>
          {icon}
        </div>
        <TrendBadge pct={pct} />
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function Dashboard() {
  const [productsCount, setProductsCount] = useState(0);
  const [employeesCount, setEmployeesCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [suppliersCount, setSuppliersCount] = useState(0);
  const [salesDash, setSalesDash]     = useState({});
  const [chartData, setChartData]     = useState([]);
  const [aiInsights, setAiInsights]   = useState([]);
  const [anomalyCount, setAnomalyCount] = useState(0);

  // Get username from localStorage
  const userRaw = localStorage.getItem("user");
  const user    = userRaw ? JSON.parse(userRaw) : null;

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [prod, emp, cust, sup, dash, chart, ai, anomaly] = await Promise.all([
        api.get("/products"),
        api.get("/employees"),
        api.get("/customers"),
        api.get("/suppliers"),
        api.get("/sales/dashboard"),
        api.get("/sales/chart"),
        api.get("/ai/dashboard-insights"),
        api.get("/ai/anomalies"),
      ]);
      setProductsCount(prod.data.length);
      setEmployeesCount(emp.data.length);
      setCustomersCount(cust.data.length);
      setSuppliersCount(sup.data.length);
      setSalesDash(dash.data);
      setChartData(chart.data);
      setAiInsights(ai.data.insights || []);
      setAnomalyCount(anomaly.data.total_anomalies || 0);
    } catch (err) {
      console.error(err);
    }
  };



  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, <span className="font-semibold text-purple-600">{user?.username || "Admin"}</span> 👋
          {anomalyCount > 0 && (
            <span className="ml-3 inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-semibold">
              🚨 {anomalyCount} anomal{anomalyCount === 1 ? "y" : "ies"} detected
            </span>
          )}
        </p>
      </div>

      {/* ── KPI CARDS with Trend Badges ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        <KpiCard label="Products" value={productsCount} pct={null} bgColor="#7C3AED"
          icon={<MdInventory size={22} />} />
        <KpiCard label="Employees" value={employeesCount} pct={null} bgColor="#3B82F6"
          icon={<FaUsers size={20} />} />
        <KpiCard label="Customers" value={customersCount} pct={null} bgColor="#EC4899"
          icon={<MdPeople size={22} />} />
        <KpiCard label="Suppliers" value={suppliersCount} pct={null} bgColor="#F59E0B"
          icon={<FaTruck size={20} />} />
        <KpiCard
          label="Total Sales"
          value={salesDash.total_sales ?? 0}
          pct={salesDash.sales_change_pct}
          bgColor="#10B981"
          icon={<MdShoppingCart size={22} />}
        />
        <KpiCard
          label="Revenue"
          value={`₹${Number(salesDash.total_revenue || 0).toLocaleString("en-IN")}`}
          pct={salesDash.revenue_change_pct}
          bgColor="#EF4444"
          icon={<FaRupeeSign size={20} />}
        />
      </div>

      {/* CHARTS */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-bold mb-4">
            Revenue Trend
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />

              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#7C3AED"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-bold mb-4">
            Sales Trend
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />

              <Bar
                dataKey="sales"
                fill="#10B981"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ── AI INSIGHTS WIDGET ── */}
      {aiInsights.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-[#7C3AED] rounded-lg flex items-center justify-center text-white text-sm">🧠</div>
            <h2 className="text-lg font-bold text-gray-800">AI Insights</h2>
            <span className="text-xs text-gray-400 ml-1">— live business intelligence</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {aiInsights.map((insight, i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-4 hover:border-purple-200 hover:shadow-sm transition">
                <div className="text-2xl mb-2">{insight.icon}</div>
                <p className="text-xs text-gray-500">{insight.title}</p>
                <p className="font-bold text-gray-800 text-sm mt-0.5 truncate">{insight.value}</p>
                <p className="text-xs mt-1" style={{ color: insight.color }}>{insight.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

export default Dashboard;