import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

function Dashboard() {
  const [productsCount, setProductsCount] = useState(0);
  const [employeesCount, setEmployeesCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [suppliersCount, setSuppliersCount] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchProducts();
    fetchEmployees();
    fetchCustomers();
    fetchSuppliers();
    fetchSalesDashboard();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products");
      setProductsCount(response.data.length);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/employees");
      setEmployeesCount(response.data.length);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get("/customers");
      setCustomersCount(response.data.length);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get("/suppliers");
      setSuppliersCount(response.data.length);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSalesDashboard = async () => {
    try {
      const response = await api.get("/sales/dashboard");
      setTotalSales(response.data.total_sales);
      setTotalRevenue(response.data.total_revenue);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-8">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-blue-500 text-white p-6 rounded-lg shadow">
          <h2 className="text-lg">Products</h2>
          <p className="text-3xl font-bold">{productsCount}</p>
        </div>

        <div className="bg-green-500 text-white p-6 rounded-lg shadow">
          <h2 className="text-lg">Employees</h2>
          <p className="text-3xl font-bold">{employeesCount}</p>
        </div>

        <div className="bg-purple-500 text-white p-6 rounded-lg shadow">
          <h2 className="text-lg">Customers</h2>
          <p className="text-3xl font-bold">{customersCount}</p>
        </div>

        <div className="bg-indigo-500 text-white p-6 rounded-lg shadow">
          <h2 className="text-lg">Suppliers</h2>
          <p className="text-3xl font-bold">{suppliersCount}</p>
        </div>

        <div className="bg-orange-500 text-white p-6 rounded-lg shadow">
          <h2 className="text-lg">Total Sales</h2>
          <p className="text-3xl font-bold">{totalSales}</p>
        </div>

        <div className="bg-red-500 text-white p-6 rounded-lg shadow">
          <h2 className="text-lg">Revenue</h2>
          <p className="text-3xl font-bold">₹{totalRevenue}</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;