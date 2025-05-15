import React, { useEffect, useState } from "react";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

const CustomerData: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const response = await fetch("http://localhost:4000/cust/data/");
        const data = await response.json();

        if (data.success) {
          setCustomers(data.data);
        } else {
          setError("No customers found.");
        }
      } catch (err) {
        setError("Error fetching data.");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, []);

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1.5rem", color: "#333" }}>
        Customer List
      </h2>

      {loading ? (
        <p style={{ textAlign: "center" }}>Loading customer data...</p>
      ) : error ? (
        <p style={{ textAlign: "center", color: "red" }}>{error}</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            }}
          >
            <thead style={{ backgroundColor: "#f4f4f4" }}>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Phone</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr
                  key={customer.id}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa",
                    transition: "background-color 0.3s",
                  }}
                >
                  <td style={tdStyle}>{customer.id}</td>
                  <td style={tdStyle}>{customer.name}</td>
                  <td style={tdStyle}>{customer.email}</td>
                  <td style={tdStyle}>{customer.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Styles
const thStyle: React.CSSProperties = {
  padding: "12px",
  textAlign: "left",
  borderBottom: "2px solid #ccc",
  fontWeight: 600,
  color: "#333",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #eee",
  color: "#555",
};

export default CustomerData;
