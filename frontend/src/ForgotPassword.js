import React, { useState } from "react";
import { Auth } from "aws-amplify";

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  card: {
    background: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
    width: "100%",
    maxWidth: "450px",
    padding: "48px 40px",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logo: {
    fontSize: "36px",
    fontWeight: "bold",
    color: "#667eea",
    marginBottom: "8px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "600",
    color: "#1a1a1a",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    margin: "0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#333",
    marginBottom: "8px",
    display: "block",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxSizing: "border-box",
    transition: "border-color 0.3s, box-shadow 0.3s",
    fontFamily: "inherit",
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "24px",
  },
  primaryButton: {
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: "600",
    border: "none",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  secondaryButton: {
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: "500",
    border: "1px solid #ddd",
    borderRadius: "8px",
    background: "#fff",
    color: "#333",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  message: {
    marginTop: "16px",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
  },
  successMessage: {
    background: "#d4edda",
    color: "#155724",
    border: "1px solid #c3e6cb",
  },
  errorMessage: {
    background: "#f8d7da",
    color: "#721c24",
    border: "1px solid #f5c6cb",
  },
  infoMessage: {
    background: "#d1ecf1",
    color: "#0c5460",
    border: "1px solid #bee5eb",
  },
  stepIndicator: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "24px",
    fontSize: "12px",
    fontWeight: "600",
  },
  step: {
    padding: "8px 12px",
    borderRadius: "6px",
    color: "#999",
  },
  activeStep: {
    background: "#667eea",
    color: "#fff",
  },
};

export default function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [step, setStep] = useState("email"); // email, code
  const [loading, setLoading] = useState(false);

  async function requestPasswordReset(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await Auth.forgotPassword(email);
      setMessageType("success");
      setMessage("✓ Reset code sent to your email");
      setStep("code");
    } catch (err) {
      setMessageType("error");
      setMessage(err.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  }

  async function confirmPasswordReset(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await Auth.forgotPasswordSubmit(email, code, newPassword);
      setMessageType("success");
      setMessage("✓ Password reset successful! Redirecting to sign in...");
      setTimeout(() => {
        onBackToLogin();
      }, 1500);
    } catch (err) {
      setMessageType("error");
      setMessage(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  const getMessageStyle = () => {
    switch (messageType) {
      case "error":
        return { ...styles.message, ...styles.errorMessage };
      case "success":
        return { ...styles.message, ...styles.successMessage };
      default:
        return { ...styles.message, ...styles.infoMessage };
    }
  };

  return (
    <>
      <div style={styles.header}>
        <div style={styles.logo}>🔐</div>
        <h1 style={styles.title}>Reset Password</h1>
        <p style={styles.subtitle}>
          We'll help you regain access to your account
        </p>
      </div>

      <div style={styles.stepIndicator}>
        <div
          style={{
            ...styles.step,
            ...(step === "email" && styles.activeStep),
          }}
        >
          Step 1: Email
        </div>
        <div
          style={{
            ...styles.step,
            ...(step === "code" && styles.activeStep),
          }}
        >
          Step 2: Code & Password
        </div>
      </div>

      {step === "email" && (
        <form onSubmit={requestPasswordReset} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@example.com"
              style={styles.input}
              disabled={loading}
            />
          </div>
          {message && <div style={getMessageStyle()}>{message}</div>}
          <div style={styles.buttonGroup}>
            <button
              type="submit"
              style={styles.primaryButton}
              disabled={loading}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow =
                  "0 5px 15px rgba(102, 126, 234, 0.3)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
            <button
              type="button"
              onClick={onBackToLogin}
              style={styles.secondaryButton}
              disabled={loading}
            >
              Back to Sign In
            </button>
          </div>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={confirmPasswordReset} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Verification Code</label>
            <p style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
              Enter the code sent to your email
            </p>
            <input
              required
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              style={styles.input}
              disabled={loading}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>New Password</label>
            <input
              required
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              disabled={loading}
            />
          </div>
          {message && <div style={getMessageStyle()}>{message}</div>}
          <div style={styles.buttonGroup}>
            <button
              type="submit"
              style={styles.primaryButton}
              disabled={loading}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow =
                  "0 5px 15px rgba(102, 126, 234, 0.3)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setNewPassword("");
                setMessage("");
              }}
              style={styles.secondaryButton}
              disabled={loading}
            >
              Back
            </button>
          </div>
        </form>
      )}
    </>
  );
}
