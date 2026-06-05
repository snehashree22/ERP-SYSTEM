import { Link, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-5">
      <h1 className="text-2xl font-bold mb-8">
        ERP System
      </h1>

      <nav className="flex flex-col gap-4">
        <Link to="/dashboard">Dashboard</Link>
<Link to="/employees">Employees</Link>
<Link to="/products">Products</Link>
<Link to="/suppliers">Suppliers</Link>
<Link to="/customers">Customers</Link>
<Link to="/sales">Sales</Link>

        <button
          onClick={handleLogout}
          className="mt-8 bg-red-600 p-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </nav>
    </div>
  );
}

export default Sidebar;