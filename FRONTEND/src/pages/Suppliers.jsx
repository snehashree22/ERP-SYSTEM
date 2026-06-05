import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get("/suppliers");
      setSuppliers(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
  };

  const handleSubmit = async () => {
    try {
      const supplierData = {
        name,
        email,
        phone,
        address,
      };

      if (editingId) {
        await api.put(`/suppliers/${editingId}`, supplierData);
        alert("Supplier Updated Successfully");
      } else {
        await api.post("/suppliers", supplierData);
        alert("Supplier Added Successfully");
      }

      resetForm();
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      alert("Operation Failed");
    }
  };

  const handleEditSupplier = (supplier) => {
    setEditingId(supplier.id);
    setName(supplier.name);
    setEmail(supplier.email);
    setPhone(supplier.phone);
    setAddress(supplier.address);
  };

  const handleDeleteSupplier = async (id) => {
    try {
      await api.delete(`/suppliers/${id}`);
      alert("Supplier Deleted Successfully");
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      alert("Failed To Delete Supplier");
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-8">
        Suppliers
      </h1>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">
          {editingId ? "Edit Supplier" : "Add Supplier"}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Supplier Name"
            className="border p-3 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email"
            className="border p-3 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="text"
            placeholder="Phone"
            className="border p-3 rounded"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            type="text"
            placeholder="Address"
            className="border p-3 rounded"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-6 py-3 rounded"
          >
            {editingId ? "Update Supplier" : "Add Supplier"}
          </button>

          {editingId && (
            <button
              onClick={resetForm}
              className="bg-gray-500 text-white px-6 py-3 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Address</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="border-b">
                <td className="p-3">{supplier.id}</td>
                <td className="p-3">{supplier.name}</td>
                <td className="p-3">{supplier.email}</td>
                <td className="p-3">{supplier.phone}</td>
                <td className="p-3">{supplier.address}</td>

                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => handleEditSupplier(supplier)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteSupplier(supplier.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

export default Suppliers;