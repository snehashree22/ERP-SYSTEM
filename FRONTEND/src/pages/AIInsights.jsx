import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { FaBrain, FaChartLine, FaExclamationTriangle, FaLightbulb } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";

// ── Urgency badge ─────────────────────────────────────────────────────────────
const URGENCY_STYLES = {
  CRITICAL: "bg-red-100 text-red-700 border border-red-200",
  HIGH:     "bg-orange-100 text-orange-700 border border-orange-200",
  MEDIUM:   "bg-yellow-100 text-yellow-700 border border-yellow-200",
  LOW:      "bg-green-100 text-green-700 border border-green-200",
};

const SEVERITY_STYLES = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH:     "bg-orange-100 text-orange-700",
  MEDIUM:   "bg-yellow-100 text-yellow-700",
  LOW:      "bg-green-100 text-green-700",
};

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );
}

function AIInsights() {
  const [forecast, setForecast]   = useState([]);
  const [revenue, setRevenue]     = useState({});
  const [anomalies, setAnomalies] = useState({});
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("demand");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [fc, rv, an] = await Promise.all([
        api.get("/ai/forecast-all"),
        api.get("/ai/revenue-forecast"),
        api.get("/ai/anomalies"),
      ]);
      setForecast(fc.data);
      setRevenue(rv.data);
      setAnomalies(an.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    { key: "demand",   label: "🧠 Demand Forecast",    count: forecast.filter(f => f.urgency !== "LOW").length },
    { key: "revenue",  label: "📈 Revenue Forecast",    count: null },
    { key: "anomaly",  label: "🚨 Anomaly Detection",   count: anomalies.total_anomalies },
  ];

  return (
    <DashboardLayout>
      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-[#7C3AED] rounded-xl flex items-center justify-center text-white">
              <FaBrain size={20} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">AI Insights</h1>
          </div>
          <p className="text-gray-500 text-sm ml-13">
            AI-powered demand forecasting, revenue prediction & anomaly detection
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          <MdRefresh size={16} /> Refresh
        </button>
      </div>

      {/* ── Summary Row ── */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow">
            <p className="text-xs text-gray-500">Needs Reorder</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {forecast.filter(f => f.suggested_reorder_qty > 0).length}
            </p>
            <p className="text-xs text-gray-400">products</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow">
            <p className="text-xs text-gray-500">Projected Revenue</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              ₹{Number(revenue.predicted_next_month || 0).toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-gray-400">{revenue.next_month_name}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow">
            <p className="text-xs text-gray-500">Anomalies Found</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {anomalies.total_anomalies || 0}
            </p>
            <p className="text-xs text-gray-400">
              {anomalies.critical_count || 0} critical
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow">
            <p className="text-xs text-gray-500">Revenue Trend</p>
            <p className={`text-2xl font-bold mt-1 ${
              (revenue.last_month_growth_pct || 0) >= 0 ? "text-green-600" : "text-red-500"
            }`}>
              {(revenue.last_month_growth_pct || 0) >= 0 ? "↑" : "↓"}{" "}
              {Math.abs(revenue.last_month_growth_pct || 0)}%
            </p>
            <p className="text-xs text-gray-400">vs last month</p>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-[#7C3AED] text-white shadow"
                : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300"
            }`}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.key ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {loading ? <Spinner /> : (

        <>
          {/* DEMAND FORECAST TAB */}
          {activeTab === "demand" && (
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="p-5 border-b">
                <h2 className="font-bold text-gray-800">📦 Demand Forecasting — All Products</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Based on last 30 days sales velocity. Sorted by urgency.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs uppercase text-gray-400 border-b bg-gray-50">
                      <th className="text-left px-5 py-3">Product</th>
                      <th className="text-left px-5 py-3">Category</th>
                      <th className="text-left px-5 py-3">Current Stock</th>
                      <th className="text-left px-5 py-3">Sold (30d)</th>
                      <th className="text-left px-5 py-3">Predicted (30d)</th>
                      <th className="text-left px-5 py-3">Days Left</th>
                      <th className="text-left px-5 py-3">Reorder Qty</th>
                      <th className="text-left px-5 py-3">Urgency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.map((f) => (
                      <tr key={f.product_id} className="border-b hover:bg-gray-50 transition">
                        <td className="px-5 py-3 font-medium text-gray-800 text-sm">{f.product_name}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">{f.category}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-800">{f.current_stock}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{f.sold_last_30_days}</td>
                        <td className="px-5 py-3 text-sm text-purple-700 font-semibold">{f.predicted_next_30_days}</td>
                        <td className={`px-5 py-3 text-sm font-bold ${
                          f.days_of_stock_remaining <= 7 ? "text-red-600" :
                          f.days_of_stock_remaining <= 14 ? "text-orange-500" : "text-green-600"
                        }`}>
                          {f.days_of_stock_remaining >= 999 ? "∞" : `${f.days_of_stock_remaining}d`}
                        </td>
                        <td className="px-5 py-3">
                          {f.suggested_reorder_qty > 0 ? (
                            <span className="text-sm font-bold text-red-600">+{f.suggested_reorder_qty}</span>
                          ) : (
                            <span className="text-sm text-green-600">✓ Sufficient</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${URGENCY_STYLES[f.urgency]}`}>
                            {f.urgency}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REVENUE FORECAST TAB */}
          {activeTab === "revenue" && (
            <div className="space-y-5">
              {/* Forecast Card */}
              <div className="bg-gradient-to-r from-[#7C3AED] to-purple-800 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4" />
                <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-2">AI Prediction</p>
                <p className="text-4xl font-bold mb-1">
                  ₹{Number(revenue.predicted_next_month || 0).toLocaleString("en-IN")}
                </p>
                <p className="text-purple-200 text-sm">Projected revenue for {revenue.next_month_name}</p>
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-purple-300 text-xs">Avg Monthly Growth</p>
                    <p className="font-semibold">
                      {(revenue.avg_monthly_growth || 0) >= 0 ? "↑" : "↓"} ₹{Math.abs(revenue.avg_monthly_growth || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-purple-300 text-xs">Trend</p>
                    <p className="font-semibold">{revenue.trend || "→ Stable"}</p>
                  </div>
                  <div>
                    <p className="text-purple-300 text-xs">Confidence</p>
                    <p className="font-semibold">{revenue.confidence || "Low"}</p>
                  </div>
                </div>
              </div>

              {/* Monthly Breakdown */}
              <div className="bg-white rounded-2xl shadow p-5">
                <h3 className="font-bold text-gray-800 mb-4">Last 6 Months Revenue</h3>
                <div className="space-y-3">
                  {(revenue.monthly_data || []).map((m, i) => {
                    const maxRev = Math.max(...(revenue.monthly_data || []).map(x => x.revenue), 1);
                    const pct = (m.revenue / maxRev) * 100;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-16">{m.month_short}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-2.5 rounded-full bg-[#7C3AED] transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-24 text-right">
                          ₹{Number(m.revenue).toLocaleString("en-IN")}
                        </span>
                      </div>
                    );
                  })}
                  {/* Predicted month */}
                  <div className="flex items-center gap-3 pt-2 border-t border-dashed border-purple-200">
                    <span className="text-xs text-purple-700 font-semibold w-16">Predicted</span>
                    <div className="flex-1 bg-purple-50 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-2.5 rounded-full bg-purple-400 animate-pulse"
                        style={{ width: "70%" }}
                      />
                    </div>
                    <span className="text-xs font-bold text-purple-700 w-24 text-right">
                      ₹{Number(revenue.predicted_next_month || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ANOMALY DETECTION TAB */}
          {activeTab === "anomaly" && (
            <div className="space-y-4">
              {/* Summary chips */}
              <div className="flex gap-3 flex-wrap">
                {[
                  { label: "Critical", count: anomalies.critical_count || 0, color: "bg-red-100 text-red-700" },
                  { label: "High",     count: anomalies.high_count || 0,     color: "bg-orange-100 text-orange-700" },
                  { label: "Medium",   count: anomalies.medium_count || 0,   color: "bg-yellow-100 text-yellow-700" },
                ].map(c => (
                  <span key={c.label} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${c.color}`}>
                    {c.label}: {c.count}
                  </span>
                ))}
              </div>

              {/* Anomaly cards */}
              {(anomalies.anomalies || []).length === 0 ? (
                <div className="bg-white rounded-2xl shadow p-12 text-center">
                  <p className="text-4xl mb-3">✅</p>
                  <p className="font-bold text-gray-700">No anomalies detected</p>
                  <p className="text-sm text-gray-400 mt-1">Everything looks normal in your ERP system</p>
                </div>
              ) : (
                (anomalies.anomalies || []).map((a, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow p-5 flex gap-4 hover:shadow-md transition">
                    <div className="text-2xl flex-shrink-0 mt-0.5">{a.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-800 text-sm">{a.title}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${SEVERITY_STYLES[a.severity]}`}>
                          {a.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{a.detail}</p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs font-semibold text-purple-600">→ {a.action}</p>
                        <span className="text-[10px] text-gray-400">{a.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

export default AIInsights;
