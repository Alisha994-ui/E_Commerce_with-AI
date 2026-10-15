"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  // Login states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  // =========================
  // LOGIN
  // =========================
  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/token/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError("Invalid username or password.");
        return;
      }

      // Save tokens
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      // Get current user
      const userResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/me/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${data.access}`,
          },
        }
      );

      if (!userResponse.ok) {
        setError("Unable to get user information.");
        return;
      }

      const userData = await userResponse.json();

      // Save user
      localStorage.setItem("user", JSON.stringify(userData));
      window.dispatchEvent(new Event("authChanged"));
      // Admin -> Dashboard
      if (userData.is_staff || userData.is_superuser) {
        router.replace("/dashboard");
      } else {
        // Normal user -> Home
        router.replace("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // OPEN FORGOT PASSWORD
  // =========================
  const openForgotPassword = () => {
    setShowForgotPassword(true);
    setForgotEmail("");
    setForgotError("");
    setForgotMessage("");
  };

  // =========================
  // CLOSE FORGOT PASSWORD
  // =========================
  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotEmail("");
    setForgotError("");
    setForgotMessage("");
  };

  // =========================
  // FORGOT PASSWORD
  // =========================
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setForgotError("");
    setForgotMessage("");
    setForgotLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/forgot-password/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: forgotEmail.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setForgotError(
          data.detail ||
            data.error ||
            "Unable to send password reset link."
        );
        return;
      }

      setForgotMessage(
        data.message ||
          "Password reset link has been sent to your email."
      );

      setForgotEmail("");
    } catch (error) {
      console.error("Forgot password error:", error);

      setForgotError(
        "Something went wrong. Please try again."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <>
      {/* =========================
          LOGIN PAGE
      ========================= */}

      <main className="auth-page">
        <div className="auth-card">

          {/* Header */}
          <div className="auth-header">
            <h1>Welcome back</h1>

            <p>
              Log in to continue shopping.
            </p>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleLogin}
            className="auth-form"
          >

            {/* Username */}
            <div className="form-group">
              <label>Username</label>

              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

              {/* Forgot Password */}
              <div className="forgot-password">
                <span onClick={openForgotPassword}>
                  Forgot Password?
                </span>
              </div>
            </div>

            {/* Login Error */}
            {error && (
              <p className="auth-error">
                {error}
              </p>
            )}

            {/* Login Button */}
            <button
              type="submit"
              className="auth-btn"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p>
              Don't have an account?{" "}
              <span
                onClick={() =>
                  router.push("/signup")
                }
              >
                Sign up
              </span>
            </p>
          </div>
        </div>
      </main>

      {/* =========================
          FORGOT PASSWORD MODAL
      ========================= */}

      {showForgotPassword && (
        <div
          className="forgot-overlay"
          onClick={closeForgotPassword}
        >
          <div
            className="forgot-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* Close Button */}
            <button
              type="button"
              className="forgot-close"
              onClick={closeForgotPassword}
            >
              ×
            </button>

            {/* Header */}
            <div className="forgot-header">
              <h2>
                Forgot Password?
              </h2>

              <p>
                Enter your email address and
                we'll send you a password
                reset link.
              </p>
            </div>

            {/* Forgot Password Form */}
            <form
              onSubmit={handleForgotPassword}
              className="forgot-form"
            >

              {/* Email */}
              <div className="form-group">
                <label>
                  Email Address
                </label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) =>
                    setForgotEmail(
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              {/* Error */}
              {forgotError && (
                <p className="auth-error">
                  {forgotError}
                </p>
              )}

              {/* Success */}
              {forgotMessage && (
                <p className="auth-success">
                  {forgotMessage}
                </p>
              )}

              {/* Send Button */}
              <button
                type="submit"
                className="auth-btn"
                disabled={forgotLoading}
              >
                {forgotLoading
                  ? "Sending..."
                  : "Send Reset Link"}
              </button>
            </form>

            {/* Back to Login */}
            <div className="forgot-footer">
              <button
                type="button"
                onClick={closeForgotPassword}
              >
                ← Back to Login
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}