import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 3;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [salary, setSalary] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/employees");
      setEmployees(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setDepartment("");
    setSalary("");
  };

  const handleSubmit = async () => {
    try {
      const employeeData = {
        name,
        email,
        department,
        salary: Number(salary),
      };

      if (editingId) {
        await api.put(`/employees/${editingId}`, employeeData);
        alert("Employee Updated Successfully");
      } else {
        await api.post("/employees", employeeData);
        alert("Employee Added Successfully");
      }

      resetForm();
      fetchEmployees();
    } catch (error) {
      console.error(error);
      alert("Operation Failed");
    }
  };

  const handleEditEmployee = (employee) => {
    setEditingId(employee.id);
    setName(employee.name);
    setEmail(employee.email);
    setDepartment(employee.department);
    setSalary(employee.salary || "");
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await api.delete(`/employees/${id}`);
      alert("Employee Deleted Successfully");
      fetchEmployees();
    } catch (error) {
      console.error(error);
      alert("Failed to Delete Employee");
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-8">
        Employees
      </h1>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">
          {editingId ? "Edit Employee" : "Add Employee"}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Employee Name"
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
            placeholder="Department"
            className="border p-3 rounded"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />

          <input
            type="number"
            placeholder="Salary"
            className="border p-3 rounded"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-6 py-3 rounded"
          >
            {editingId ? "Update Employee" : "Add Employee"}
          </button>

          <button
            onClick={() =>
              window.open(
                "http://127.0.0.1:8000/employees/export",
                "_blank"
              )
            }
            className="bg-green-600 text-white px-6 py-3 rounded"
          >
            Export Excel
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
        <input
          type="text"
          placeholder="Search Employee..."
          className="border p-3 rounded mb-4 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="border p-3 rounded mb-4 w-full"
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          <option value="IT">IT</option>
          <option value="software">software</option>
        </select>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Department</th>
              <th className="text-left p-3">Salary</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {employees
              .filter((employee) =>
                employee.name
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
              )
              .filter((employee) =>
                departmentFilter === ""
                  ? true
                  : employee.department === departmentFilter
              )
              .slice(
                (currentPage - 1) * employeesPerPage,
                currentPage * employeesPerPage
              )
              .map((employee) => (
                <tr key={employee.id} className="border-b">
                  <td className="p-3">{employee.id}</td>
                  <td className="p-3">{employee.name}</td>
                  <td className="p-3">{employee.email}</td>
                  <td className="p-3">{employee.department}</td>
                  <td className="p-3">₹{employee.salary}</td>

                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => handleEditEmployee(employee)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDeleteEmployee(employee.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() =>
              setCurrentPage(
                currentPage > 1
                  ? currentPage - 1
                  : 1
              )
            }
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Previous
          </button>

          <span className="font-bold mt-2">
            Page {currentPage}
          </span>

          <button
            onClick={() =>
              setCurrentPage(currentPage + 1)
            }
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Next
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default Employees;