import React, { useState } from "react";
import { Auth } from "aws-amplify";
import ForgotPassword from "./ForgotPassword";

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
  inputFocus: {
    borderColor: "#667eea",
    boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
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
  forgotButton: {
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: "500",
    border: "none",
    borderRadius: "8px",
    background: "#f0f0f0",
    color: "#666",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  toggleSection: {
    textAlign: "center",
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #f0f0f0",
  },
  toggleText: {
    fontSize: "14px",
    color: "#666",
  },
  toggleLink: {
    color: "#667eea",
    fontWeight: "600",
    cursor: "pointer",
    textDecoration: "none",
  },
  message: {
    marginTop: "16px",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
  },
  errorMessage: {
    background: "#fee",
    color: "#c33",
    border: "1px solid #fcc",
  },
  successMessage: {
    background: "#efe",
    color: "#3c3",
    border: "1px solid #cfc",
  },
  infoMessage: {
    background: "#eef",
    color: "#33c",
    border: "1px solid #ccf",
  },
  footer: {
    marginTop: "20px",
    fontSize: "12px",
    color: "#999",
    textAlign: "center",
    borderTop: "1px solid #f0f0f0",
    paddingTop: "16px",
  },
};

export default function Login({ onSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin"); // signin, signup, or forgot
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // info, error, success
  const [loading, setLoading] = useState(false);

  async function signIn(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const user = await Auth.signIn(email, password);
      // Fetch user attributes to get email
      const userAttributes = await Auth.userAttributes(user);
      const userWithEmail = { ...user, email: email };
      if (userAttributes && userAttributes.email) {
        userWithEmail.attributes = { email: userAttributes.email };
      }
      setMessageType("success");
      setMessage("✓ Signed in successfully!");
      if (onSignIn) onSignIn(userWithEmail);
    } catch (err) {
      setMessageType("error");
      setMessage(err.message || "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function signUp(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await Auth.signUp({ username: email, password, attributes: { email } });
      setMessageType("success");
      setMessage(
        "✓ Account created! Check your email for confirmation, then switch to Sign In."
      );
      setTimeout(() => setMode("signin"), 2000);
    } catch (err) {
      setMessageType("error");
      setMessage(err.message || "Sign up failed. Please try again.");
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
    <div style={styles.container}>
      <div style={styles.card}>
        {mode === "forgot" ? (
          <ForgotPassword onBackToLogin={() => setMode("signin")} />
        ) : (
          <>
            <div style={styles.header}>
              <div style={styles.logo}>📦</div>
              <h1 style={styles.title}>
                {mode === "signin" ? "Welcome Back" : "Create Account"}
              </h1>
              <p style={styles.subtitle}>
                {mode === "signin"
                  ? "Sign in to manage your inventory"
                  : "Start managing your inventory today"}
              </p>
            </div>

            <form
              onSubmit={mode === "signin" ? signIn : signUp}
              style={styles.form}
            >
              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={styles.input}
                  disabled={loading}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Password</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  {loading
                    ? "Loading..."
                    : mode === "signin"
                    ? "Sign In"
                    : "Create Account"}
                </button>

                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    style={styles.forgotButton}
                    disabled={loading}
                    onMouseOver={(e) => {
                      e.target.style.background = "#e8e8e8";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = "#f0f0f0";
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
            </form>

            <div style={styles.toggleSection}>
              <p style={styles.toggleText}>
                {mode === "signin"
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <span
                  style={styles.toggleLink}
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setMessage("");
                    setEmail("");
                    setPassword("");
                  }}
                >
                  {mode === "signin" ? "Sign Up" : "Sign In"}
                </span>
              </p>
            </div>

            <div style={styles.footer}>
              <p style={{ margin: "0" }}>
                AWS Cognito Authentication • Secure Login
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
