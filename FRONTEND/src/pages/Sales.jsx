import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

// ── Helpers ──────────────────────────────────────────────────────────────────

function TrendBadge({ pct }) {
  if (pct === null || pct === undefined) return null;
  const isUp = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
        isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
      }`}
    >
      {isUp ? "↑" : "↓"} {Math.abs(pct)}%
    </span>
  );
}

function KpiCard({ label, value, sub, pct, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow hover:shadow-lg transition-all">
      <div className="flex justify-between items-start mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-xl"
          style={{ background: color }}
        >
          {icon}
        </div>
        <TrendBadge pct={pct} />
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// Status badge colours
const STATUS_COLORS = {
  Completed: "bg-green-100 text-green-700",
  Pending:   "bg-yellow-100 text-yellow-700",
  Cancelled: "bg-red-100 text-red-600",
};

// ── Sales Page ────────────────────────────────────────────────────────────────

function Sales() {
  const [dashboard, setDashboard] = useState({});
  const [sales, setSales] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // Create sale form
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount]         = useState("");
  const [showForm, setShowForm]     = useState(false);
  const [loading, setLoading]       = useState(false);

  // Filters
  const [search, setSearch]   = useState("");
  const [typeFilter, setType] = useState("All Types");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [dash, salesRes, chart, cat, custRes, prodRes] = await Promise.all([
        api.get("/sales/dashboard"),
        api.get("/sales/with-details"),
        api.get("/sales/chart"),
        api.get("/sales/by-category"),
        api.get("/customers"),
        api.get("/products"),
      ]);
      setDashboard(dash.data);
      setSales(salesRes.data);
      setChartData(chart.data);
      setByCategory(cat.data);
      setCustomers(custRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSale = async () => {
    if (!customerId || !amount) return alert("Please fill all fields.");
    setLoading(true);
    try {
      await api.post("/sales", {
        customer_id: Number(customerId),
        total_amount: Number(amount),
      });
      setCustomerId("");
      setAmount("");
      setShowForm(false);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create sale.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/sales/${id}/status?status=${newStatus}`);
      fetchAll();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  // Filtered table
  const filteredSales = sales.filter((s) => {
    const matchSearch =
      s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.sale_number?.toLowerCase().includes(search.toLowerCase());
    const matchType =
      typeFilter === "All Types" ||
      s.delivery_method === typeFilter;
    return matchSearch && matchType;
  });

  // Pie colours
  const PIE_COLORS = ["#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899"];

  return (
    <DashboardLayout>
      {/* ── Page Header ── */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Sales</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage sales orders, customers, vendors, delivery operations and payment workflows.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#7C3AED] hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow"
        >
          + New Sale
        </button>
      </div>

      {/* ── Create Sale Modal ── */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow p-6 mb-6 border border-purple-100">
          <h2 className="text-lg font-bold mb-4">Create New Sale</h2>
          <div className="grid grid-cols-2 gap-4">
            <select
              className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Total Amount (₹)"
              className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCreateSale}
              disabled={loading}
              className="bg-[#7C3AED] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-60 transition"
            >
              {loading ? "Creating…" : "Create Sale"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <KpiCard
          label="Total Sales"
          value={`₹${Number(dashboard.total_revenue || 0).toLocaleString("en-IN")}`}
          sub="All time revenue"
          pct={dashboard.revenue_change_pct}
          icon="₹"
          color="#7C3AED"
        />
        <KpiCard
          label="Pending Deliveries"
          value={dashboard.pending_deliveries ?? "—"}
          sub="Last 7 days"
          pct={null}
          icon="🚚"
          color="#F59E0B"
        />
        <KpiCard
          label="Pending Payments"
          value={`₹${Number(dashboard.pending_payments || 0).toLocaleString("en-IN")}`}
          sub="Unpaid balance"
          pct={null}
          icon="💳"
          color="#EF4444"
        />
        <KpiCard
          label="Total Customers"
          value={dashboard.total_customers ?? "—"}
          sub="Unique buyers"
          pct={null}
          icon="👥"
          color="#10B981"
        />
      </div>

      {/* ── Sales Table ── */}
      <div className="bg-white rounded-2xl shadow mb-6">
        {/* Table toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 gap-3 border-b">
          <input
            type="text"
            placeholder="Search by SO Number or Customer..."
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 w-72"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            {["All Types", "Local Delivery", "Warehouse Sale"].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                  typeFilter === t
                    ? "bg-[#7C3AED] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-purple-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs uppercase text-gray-400 border-b">
                <th className="text-left px-5 py-3">SO Number</th>
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-left px-5 py-3">Type</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-5 py-3">Delivery Method</th>
                <th className="text-left px-5 py-3">Total</th>
                <th className="text-left px-5 py-3">Payment</th>
                <th className="text-left px-5 py-3">Change Status</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400">
                    No sales found.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-5 py-3 font-mono text-sm text-purple-700 font-semibold">
                      {sale.sale_number}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{sale.customer_name}</p>
                      <p className="text-xs text-gray-400">{sale.customer_email}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">Walk-in Billing</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{sale.created_at}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{sale.delivery_method}</td>
                    <td className="px-5 py-3 font-semibold text-gray-800">
                      ₹{Number(sale.total_amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[sale.status] || "bg-gray-100 text-gray-600"}`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={sale.status}
                        onChange={(e) => handleStatusChange(sale.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400"
                      >
                        <option>Pending</option>
                        <option>Completed</option>
                        <option>Cancelled</option>
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => window.open(`http://127.0.0.1:8000/invoice/${sale.id}`, "_blank")}
                        className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-100 transition font-medium"
                      >
                        Invoice
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Sales;