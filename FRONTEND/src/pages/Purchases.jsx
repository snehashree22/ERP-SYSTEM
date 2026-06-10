import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

// Status badge styling
const STATUS_STYLES = {
  Received:  "bg-green-100 text-green-700",
  Pending:   "bg-yellow-100 text-yellow-700",
  Cancelled: "bg-red-100 text-red-600",
};

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts]   = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Form state
  const [productId, setProductId]   = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [quantity, setQuantity]     = useState("");
  const [unitPrice, setUnitPrice]   = useState("");
  const [showForm, setShowForm]     = useState(false);
  const [loading, setLoading]       = useState(false);

  // Filter state
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [pRes, prodRes, supRes] = await Promise.all([
        api.get("/purchases/with-details"),
        api.get("/products"),
        api.get("/suppliers"),
      ]);
      setPurchases(pRes.data);
      setProducts(prodRes.data);
      setSuppliers(supRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!productId || !supplierId || !quantity || !unitPrice) {
      return alert("Please fill all fields.");
    }
    setLoading(true);
    try {
      await api.post("/purchases", {
        product_id: Number(productId),
        supplier_id: Number(supplierId),
        quantity: Number(quantity),
        unit_price: Number(unitPrice),
      });
      setProductId(""); setSupplierId(""); setQuantity(""); setUnitPrice("");
      setShowForm(false);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to add purchase.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/purchases/${id}/status?status=${newStatus}`);
      fetchAll();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  // Summary KPIs
  const totalPurchases   = purchases.reduce((s, p) => s + (p.total_amount || 0), 0);
  const pendingOrders    = purchases.filter((p) => p.status === "Pending").length;
  const pendingPayments  = purchases.filter((p) => p.status === "Received").reduce((s, p) => s + p.total_amount, 0);
  const totalVendors     = [...new Set(purchases.map((p) => p.supplier_id))].length;

  // Filter
  const filtered = purchases.filter((p) => {
    const matchSearch =
      p.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.po_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All Statuses" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Purchases</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage purchase orders, invoice section, goods receiving, and payment modules.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#7C3AED] hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow"
        >
          + New Purchase
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {[
          { label: "Total Purchases", value: `₹${Number(totalPurchases).toLocaleString("en-IN")}`, icon: "🛒", color: "#7C3AED" },
          { label: "Pending Orders",  value: pendingOrders, icon: "📦", color: "#F59E0B" },
          { label: "Pending Payments",value: `₹${Number(pendingPayments).toLocaleString("en-IN")}`, icon: "💳", color: "#EF4444" },
          { label: "Total Vendors",   value: totalVendors, icon: "🏭", color: "#10B981" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-5 shadow hover:shadow-lg transition">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-xl mb-3"
              style={{ background: k.color }}
            >
              {k.icon}
            </div>
            <p className="text-2xl font-bold text-gray-800">{k.value}</p>
            <p className="text-sm text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Create Purchase Form ── */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow p-6 mb-6 border border-purple-100">
          <h2 className="text-lg font-bold mb-4">Add New Purchase</h2>
          <div className="grid grid-cols-2 gap-4">
            <select
              className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input
              type="number" placeholder="Quantity"
              className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={quantity} onChange={(e) => setQuantity(e.target.value)}
            />
            <input
              type="number" placeholder="Unit Price (₹)"
              className="border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)}
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSubmit} disabled={loading}
              className="bg-[#7C3AED] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-60 transition"
            >
              {loading ? "Adding…" : "Add Purchase"}
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

      {/* ── Purchases Table ── */}
      <div className="bg-white rounded-2xl shadow">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 gap-3 border-b">
          <input
            type="text"
            placeholder="Search PO, product or vendor..."
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 w-72"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            {["All Statuses", "Received", "Pending", "Cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                  statusFilter === s
                    ? "bg-[#7C3AED] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-purple-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs uppercase text-gray-400 border-b">
                <th className="text-left px-5 py-3">PO Number</th>
                <th className="text-left px-5 py-3">Vendor Name</th>
                <th className="text-left px-5 py-3">Product</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-5 py-3">Qty</th>
                <th className="text-left px-5 py-3">Total Amount</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Change Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    No purchases found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-5 py-3 font-mono text-sm text-purple-700 font-semibold">
                      {p.po_number}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{p.vendor_name}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">{p.product_name}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{p.created_at}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{p.quantity}</td>
                    <td className="px-5 py-3 font-semibold text-gray-800">
                      ₹{Number(p.total_amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[p.status] || "bg-gray-100 text-gray-600"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={p.status}
                        onChange={(e) => handleStatusChange(p.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400"
                      >
                        <option>Pending</option>
                        <option>Received</option>
                        <option>Cancelled</option>
                      </select>
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

export default Purchases;