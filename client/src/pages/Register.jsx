import "../styles/Register.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

function Register() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
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

      await api.post(
        "/api/auth/register",
        formData
      );

      alert("Registered Successfully");

      navigate("/");

    } catch (err) {

      alert(
        err.response?.data?.message || "Registration Failed"
      );

    }
  };

  return (
    <div className="register-container">

      <div className="auth-shell-topbar">
        <ThemeToggle />
      </div>

      <form
        className="register-card"
        onSubmit={handleSubmit}
      >

        <h1>Create Account</h1>

        <input
          type="text"
          name="username"
          placeholder="Enter Username"
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Enter Email"
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Enter Password"
          onChange={handleChange}
          required
          autoComplete="new-password"
        />

        <button type="submit">
          Register
        </button>

        <div className="register-link">
          <Link to="/">
            Already have an account? Login
          </Link>
        </div>

      </form>

    </div>
  );
}

export default Register;