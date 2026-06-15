import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

function ProtectedRoute({ children }) {

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifySession = async () => {
      const cachedUser = localStorage.getItem("user");

      if (cachedUser) {
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/api/auth/profile");
        localStorage.setItem("user", JSON.stringify(response.data));
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;