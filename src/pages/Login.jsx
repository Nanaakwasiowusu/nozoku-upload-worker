import React, { useState } from "react";
import { auth } from "../firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      console.error(err);
      let message = err.message;
      if (message.includes("user-not-found")) message = "No account found with this email.";
      if (message.includes("wrong-password")) message = "Incorrect password.";
      setError(message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        <h2 className="text-center mb-2">Login to Nozoku</h2>
        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>
        </form>

        <p className="text-center mt-2">
          Don’t have an account? <a href="/register">Register</a>
        </p>
      </div>

      {/* Dark Theme Styles */}
      <style>{`
        .login-page {
          width: 100%;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          background: #0a0a0a; /* deep dark */
          color: #fff;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 30px;
          border-radius: 12px;
          background: #111;
          border: 1px solid #222;
          box-shadow: 0 4px 25px rgba(0,0,0,0.4);
        }

        .login-card h2 {
          color: #fff;
          margin-bottom: 15px;
        }

        .login-card input {
          width: 100%;
          padding: 12px;
          margin: 10px 0;
          font-size: 16px;
          border-radius: 8px;
          border: 1px solid #333;
          outline: none;
          background: #1a1a1a;
          color: #fff;
        }

        .login-card input:focus {
          border-color: #0aa83f;
        }

        .login-card button {
          width: 100%;
          padding: 12px;
          background: #0aa83f;
          color: white;
          font-size: 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 10px;
          transition: 0.2s;
        }

        .login-card button:hover {
          background: #099238;
        }

        .login-card a {
          color: #0aa83f;
          text-decoration: none;
        }

        .error-text {
          color: #ff4d4d;
          text-align: center;
          margin-bottom: 10px;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 22px;
          }

          .login-card h2 {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}

export default Login;
