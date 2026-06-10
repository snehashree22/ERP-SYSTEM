import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const CATEGORY_COLORS = ["#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899", "#14B8A6"];

// ── Spinner ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );
}

// ── Status Health Badge ───────────────────────────────────────────────────────
function HealthBadge({ status }) {
  const map = {
    Good:     "bg-green-100 text-green-700",
    Warning:  "bg-yellow-100 text-yellow-700",
    Critical: "bg-red-100 text-red-600",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

// ── Custom Pie Label ─────────────────────────────────────────────────────────
const RADIAN = Math.PI / 180;
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function InventoryDashboard() {
  const [data, setData]                 = useState({});
  const [byCategory, setByCategory]     = useState([]);
  const [lowStock, setLowStock]         = useState([]);
  const [outOfStock, setOutOfStock]     = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dash, cat, low, out] = await Promise.all([
        api.get("/inventory/dashboard"),
        api.get("/inventory/by-category"),
        api.get("/inventory/low-stock"),
        api.get("/inventory/out-of-stock"),
      ]);
      setData(dash.data);
      setByCategory(cat.data);
      setLowStock(low.data);
      setOutOfStock(out.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = byCategory.reduce((s, c) => s + c.total_value, 0);

  return (
    <DashboardLayout>
      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Inventory Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time stock monitoring, valuation & health analytics
          </p>
        </div>
        <HealthBadge status={data.stock_status || "Good"} />
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {[
          { label: "Total Products",   value: data.total_products ?? 0,   icon: "📦", color: "#7C3AED", sub: "SKUs tracked" },
          { label: "Inventory Value",  value: `₹${Number(data.inventory_value || 0).toLocaleString("en-IN")}`, icon: "💰", color: "#10B981", sub: "Stock × price" },
          { label: "Low Stock Items",  value: data.low_stock ?? 0,        icon: "⚠️", color: "#F59E0B", sub: `${data.low_stock_percentage ?? 0}% of catalog` },
          { label: "Out of Stock",     value: data.out_of_stock ?? 0,     icon: "🔴", color: "#EF4444", sub: `${data.out_of_stock_percentage ?? 0}% of catalog` },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-5 shadow hover:shadow-lg transition">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-3" style={{ background: k.color + "18" }}>
              {k.icon}
            </div>
            <p className="text-2xl font-bold text-gray-800">{k.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{k.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Inventory Valuation Donut Chart */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Inventory Valuation</h2>
          <p className="text-xs text-gray-400 mb-1">Stock value distribution by category</p>
          <p className="text-2xl font-bold text-purple-600 mb-4">
            ₹{Number(totalValue).toLocaleString("en-IN")}
            <span className="text-sm text-gray-400 font-normal ml-2">total value</span>
          </p>

          {loading ? <Spinner /> : byCategory.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-300">
              <span className="text-4xl mb-2">📦</span>
              <p className="text-sm">No products yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="total_value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  labelLine={false}
                  label={PieLabel}
                >
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, n) => [`₹${Number(v).toLocaleString("en-IN")}`, n]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stock by Category Bar Chart */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Stock by Category</h2>
          <p className="text-xs text-gray-400 mb-4">Total units available per category</p>

          {loading ? <Spinner /> : byCategory.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-300">
              <span className="text-4xl mb-2">📊</span>
              <p className="text-sm">No data yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="total_stock" name="Units in Stock" radius={[0, 6, 6, 0]}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Inventory Health Bar ── */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Inventory Health Score</h2>
            <p className="text-xs text-gray-400">Based on low stock vs total products ratio</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-purple-600">{data.inventory_health ?? 100}%</p>
            <HealthBadge status={data.stock_status || "Good"} />
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${
              (data.inventory_health ?? 100) >= 80 ? "bg-green-500" :
              (data.inventory_health ?? 100) >= 50 ? "bg-yellow-500" : "bg-red-500"
            }`}
            style={{ width: `${data.inventory_health ?? 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>Critical (0%)</span>
          <span>Warning (50%)</span>
          <span>Healthy (100%)</span>
        </div>
      </div>

      {/* ── Low Stock + Out of Stock Tables ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Low Stock */}
        <div className="bg-white rounded-2xl shadow">
          <div className="flex items-center justify-between p-5 border-b">
            <div>
              <h2 className="font-bold text-gray-800">⚠️ Low Stock Alerts</h2>
              <p className="text-xs text-gray-400 mt-0.5">Products below reorder level</p>
            </div>
            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {lowStock.length} items
            </span>
          </div>
          <div className="overflow-auto max-h-64">
            {loading ? <Spinner /> : lowStock.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">All stock levels are healthy ✅</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs uppercase text-gray-400 border-b">
                    <th className="text-left px-5 py-2.5">Product</th>
                    <th className="text-left px-5 py-2.5">Category</th>
                    <th className="text-left px-5 py-2.5">Stock</th>
                    <th className="text-left px-5 py-2.5">Reorder</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-5 py-3 font-medium text-gray-800 text-sm">{p.name}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">{p.category || "General"}</td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-bold text-yellow-600">{p.stock}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">{p.reorder_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white rounded-2xl shadow">
          <div className="flex items-center justify-between p-5 border-b">
            <div>
              <h2 className="font-bold text-gray-800">🔴 Out of Stock</h2>
              <p className="text-xs text-gray-400 mt-0.5">Products with zero inventory</p>
            </div>
            <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
              {outOfStock.length} items
            </span>
          </div>
          <div className="overflow-auto max-h-64">
            {loading ? <Spinner /> : outOfStock.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No out-of-stock products 🎉</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs uppercase text-gray-400 border-b">
                    <th className="text-left px-5 py-2.5">Product</th>
                    <th className="text-left px-5 py-2.5">SKU</th>
                    <th className="text-left px-5 py-2.5">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {outOfStock.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-5 py-3 font-medium text-gray-800 text-sm">{p.name}</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-400">{p.sku}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">{p.category || "General"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default InventoryDashboard;