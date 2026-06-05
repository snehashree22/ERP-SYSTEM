import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

function Sales() {
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");

  const [dashboard, setDashboard] = useState({
    total_sales: 0,
    total_revenue: 0,
  });

  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    fetchDashboard();
    fetchTopProducts();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get("/sales/dashboard");
      setDashboard(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTopProducts = async () => {
    try {
      const response = await api.get("/sales/top-products");
      setTopProducts(response.data);
    } catch (error) {
      console.error(error);
    }
  };

const handleCreateSale = async () => {
  try {
    await api.post("/sales", {
      customer_id: Number(customerId),
      total_amount: Number(amount),
    });

    // Force refresh dashboard data
    const dashboardResponse = await api.get("/sales/dashboard");
    setDashboard(dashboardResponse.data);

    // Force refresh top products
    const topProductsResponse = await api.get("/sales/top-products");
    setTopProducts(topProductsResponse.data);

    setCustomerId("");
    setAmount("");

    alert("Sale Created Successfully");
  } catch (error) {
    console.error(error);
    alert("Failed To Create Sale");
  }
};

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-8">
        Sales Dashboard
      </h1>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-green-500 text-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold">
            Total Revenue
          </h2>

          <p className="text-3xl mt-2">
            ₹{dashboard.total_revenue}
          </p>
        </div>

        <div className="bg-blue-500 text-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold">
            Total Sales
          </h2>

          <p className="text-3xl mt-2">
            {dashboard.total_sales}
          </p>
        </div>
      </div>

      {/* Create Sale */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">
          Create Sale
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="Customer ID"
            className="border p-3 rounded"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />

          <input
            type="number"
            placeholder="Total Amount"
            className="border p-3 rounded"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <button
          onClick={handleCreateSale}
          className="bg-blue-600 text-white px-6 py-3 rounded mt-4"
        >
          Create Sale
        </button>

        <button
  onClick={() =>
    window.open(
      "http://127.0.0.1:8000/invoice/1",
      "_blank"
    )
  }
  className="bg-green-600 text-white px-6 py-3 rounded mt-4 ml-4"
>
  Download Invoice
</button>
      </div>

      {/* Top Products */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">
          Top Products
        </h2>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">
                Product ID
              </th>

              <th className="text-left p-3">
                Sold
              </th>
            </tr>
          </thead>

          <tbody>
            {topProducts.map((product, index) => (
              <tr key={index} className="border-b">
                <td className="p-3">
                  {product.product_id}
                </td>

                <td className="p-3">
                  {product.sold}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

export default Sales;