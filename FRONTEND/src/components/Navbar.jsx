import { useEffect, useState } from "react";
import api from "../services/api";
import { MdNotifications } from "react-icons/md";

function Navbar() {
  const [alerts, setAlerts]       = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState([]);

  // ── Read logged-in user from localStorage
  const getUser = () => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  };
  const [currentUser, setCurrentUser] = useState(getUser);

  useEffect(() => {
    fetchAlerts();
    // Refresh user info if settings change
    const refresh = () => setCurrentUser(getUser());
    window.addEventListener("settings-updated", refresh);
    return () => window.removeEventListener("settings-updated", refresh);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get("/inventory/alerts");
      setAlerts(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async (value) => {
    setQuery(value);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    try {
      const response = await api.get(
        `/search?query=${value}`
      );

      setResults(response.data.products);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="bg-white h-16 px-6 flex items-center justify-between border-b">

      {/* Search */}

      <div className="relative">

        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) =>
            handleSearch(e.target.value)
          }
          className="w-96 px-4 py-2 border rounded-lg outline-none"
        />

        {results.length > 0 && (
          <div className="absolute left-0 top-12 w-full bg-white shadow-lg rounded-lg z-50">

            {results.map((product) => (
              <div
                key={product.id}
                className="p-3 border-b hover:bg-gray-100 cursor-pointer"
              >
                📦 {product.name}
              </div>
            ))}

          </div>
        )}

      </div>

      {/* Right Side */}

      <div className="flex items-center gap-6">

        <div className="relative">

          <button
            onClick={() =>
              setShowAlerts(!showAlerts)
            }
            className="relative"
          >
            <MdNotifications
              size={28}
              className="text-purple-600"
            />

            {alerts.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
                {alerts.length}
              </span>
            )}

          </button>

          {showAlerts && (
            <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg p-4 z-50">

              <h3 className="font-bold mb-3">
                Low Stock Alerts
              </h3>

              {alerts.length === 0 ? (
                <p>No Alerts</p>
              ) : (
                alerts.map((item) => (
                  <div
                    key={item.id}
                    className="border-b py-2"
                  >
                    <p className="font-medium">
                      {item.name}
                    </p>

                    <p className="text-red-500 text-sm">
                      Stock: {item.stock}
                    </p>
                  </div>
                ))
              )}

            </div>
          )}

        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700">
            {currentUser?.username?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">
              {currentUser?.username || "Admin"}
            </p>
            <p className="text-xs text-gray-400 capitalize">
              {currentUser?.role || "Administrator"}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}

export default Navbar;