import "../styles/Login.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

function Login() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      const response = await api.post("/api/auth/login",formData);

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      alert("Login Successful");

      navigate("/chat");

    } catch (err) {

      alert(
        err.response?.data?.message || "Login Failed"
      );

    }
  };

  return (
    <div className="login-container">

      <div className="auth-shell-topbar">
        <ThemeToggle />
      </div>

      <form
        className="login-card"
        onSubmit={handleSubmit}
      >

        <h1>Login</h1>

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
          autoComplete="current-password"
        />

        <button type="submit">
          Login
        </button>

        <div className="login-link">
          <Link to="/register">
            Don't have an account? Register
          </Link>
        </div>

      </form>

    </div>
  );
}

export default Login;