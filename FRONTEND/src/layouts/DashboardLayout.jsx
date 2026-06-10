import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import AIChatWidget from "../components/AIChatWidget";

function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50 text-black">

      {/* ── Sidebar (fixed width, dark) ── */}
      <Sidebar />

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        {/* Page content */}
        <div className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </div>
      </div>

      {/* ── AI Chat Widget (floats over everything) ── */}
      <AIChatWidget />

    </div>
  );
}

export default DashboardLayout;