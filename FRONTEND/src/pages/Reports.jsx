import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { FiDownload, FiTrendingUp, FiTrendingDown } from "react-icons/fi";

const PIE_COLORS = ["#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899"];

function Reports() {
  const [revenueVsExpense, setRevenueVsExpense] = useState([]);
  const [byCategory, setByCategory]             = useState([]);
  const [dashboard, setDashboard]               = useState({});
  const [loading, setLoading]                   = useState(true);
  const [generatingReport, setGeneratingReport] = useState(""); // tracks which report is generating

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rveRes, catRes, dashRes] = await Promise.all([
        api.get("/sales/revenue-vs-expense"),
        api.get("/sales/by-category"),
        api.get("/sales/dashboard"),
      ]);
      setRevenueVsExpense(rveRes.data);
      setByCategory(catRes.data);
      setDashboard(dashRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (type, title) => {
    setGeneratingReport(type);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://127.0.0.1:8000/reports/generate?type=${type}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to generate report");
      }
      // Trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/ /g, "-")}-Report.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Error generating report: ${err.message}`);
    } finally {
      setGeneratingReport("");
    }
  };

  const totalRevenue = revenueVsExpense.reduce((s, m) => s + m.revenue, 0);
  const totalExpense = revenueVsExpense.reduce((s, m) => s + m.expense, 0);
  const profit = totalRevenue - totalExpense;

  const reportCards = [
    {
      title: "Sales Reports",
      type: "sales",
      desc: "Sales summary, order analysis and customer insights",
      icon: "📊",
      color: "#7C3AED",
    },
    {
      title: "Purchase & Order",
      type: "purchases",
      desc: "Purchase history, vendor analysis and order tracking",
      icon: "🛒",
      color: "#3B82F6",
    },
    {
      title: "Inventory & Stock",
      type: "inventory",
      desc: "Stock levels, reorder alerts and valuation reports",
      icon: "📦",
      color: "#10B981",
    },
    {
      title: "Financial Statements",
      type: "financial",
      desc: "Revenue, expenses, profit & loss summaries",
      icon: "💰",
      color: "#F59E0B",
    },
    {
      title: "Profit & Loss",
      type: "pl",
      desc: "Monthly P&L breakdown with trend analysis",
      icon: "📈",
      color: "#EF4444",
    },
    {
      title: "Inventory Valuation",
      type: "valuation",
      desc: "Current inventory worth and category-wise breakdown",
      icon: "🏷️",
      color: "#EC4899",
    },
  ];

  return (
    <DashboardLayout>
      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Reports Center</h1>
          <p className="text-gray-500 text-sm mt-1">
            Generate detailed revenue insights and business performance reports.
          </p>
        </div>
        <button className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition text-sm font-medium">
          <FiDownload size={16} />
          Export All
        </button>
      </div>

      {/* ── Summary KPI Row ── */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <FiTrendingUp className="text-green-500" size={18} />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            ₹{Number(totalRevenue).toLocaleString("en-IN")}
          </p>
          {dashboard.revenue_change_pct !== undefined && (
            <p className={`text-xs mt-1 font-medium ${dashboard.revenue_change_pct >= 0 ? "text-green-600" : "text-red-500"}`}>
              {dashboard.revenue_change_pct >= 0 ? "↑" : "↓"} {Math.abs(dashboard.revenue_change_pct)}% vs last month
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <FiTrendingDown className="text-red-400" size={18} />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            ₹{Number(totalExpense).toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-gray-400 mt-1">Total purchase costs</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Net Profit</p>
            <span className="text-lg">💹</span>
          </div>
          <p className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-500"}`}>
            ₹{Number(Math.abs(profit)).toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-gray-400 mt-1">{profit >= 0 ? "Profitable" : "Loss"}</p>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Revenue vs Expense Line Chart */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Revenue vs Expenses</h2>
          <p className="text-xs text-gray-400 mb-4">Financial performance over time</p>

          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">Loading chart…</div>
          ) : revenueVsExpense.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-300">
              <span className="text-4xl mb-2">📊</span>
              <p className="text-sm">No data yet. Add some sales and purchases.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueVsExpense}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`}
                />
                <Legend />
                <Line
                  type="monotone" dataKey="revenue" name="Revenue"
                  stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 4 }}
                />
                <Line
                  type="monotone" dataKey="expense" name="Expense"
                  stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sales by Category Bar Chart */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Sales by Category</h2>
          <p className="text-xs text-gray-400 mb-4">Top performing product categories</p>

          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">Loading chart…</div>
          ) : byCategory.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-300">
              <span className="text-4xl mb-2">🏷️</span>
              <p className="text-sm">No category data yet. Add some sale items.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="units_sold" name="Units Sold" radius={[0, 6, 6, 0]}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Report Directory ── */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Report Directory</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {reportCards.map((card) => (
            <div
              key={card.title}
              className="border border-gray-100 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition cursor-pointer group"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform"
                style={{ background: card.color + "20" }}
              >
                {card.icon}
              </div>
              <p className="font-semibold text-gray-800 text-sm">{card.title}</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{card.desc}</p>
              <button
                onClick={() => handleGenerateReport(card.type, card.title)}
                disabled={generatingReport === card.type}
                className="mt-3 text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                style={{ color: card.color }}
              >
                {generatingReport === card.type ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Generating…
                  </>
                ) : (
                  "Download PDF →"
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Reports;