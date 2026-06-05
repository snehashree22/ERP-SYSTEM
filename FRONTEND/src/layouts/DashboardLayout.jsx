import Sidebar from "../components/Sidebar";

function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;