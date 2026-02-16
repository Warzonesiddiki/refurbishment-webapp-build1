import { useState } from "react";
import { loginUser, registerUser } from "@/utils/javaAuth";

type LoginPageProps = {
  onAuthenticated: () => void;
};

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const normalizedEmail = email.trim();
  const normalizedFullName = fullName.trim();
  const isFormValid = Boolean(normalizedEmail && password && (mode === "login" || normalizedFullName));

  const submit = async () => {
    if (loading) return;
    setMessage(null);

    if (!isFormValid) {
      setMessage("Please complete all required fields.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        await registerUser({ email: normalizedEmail, fullName: normalizedFullName, password });
        setMessage("Registration successful. You can now log in.");
        setMode("login");
        setPassword("");
      } else {
        await loginUser({ email: normalizedEmail, password });
        onAuthenticated();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-page="login-page" data-testid="page-login-page" className="min-h-screen bg-grid flex items-center justify-center p-4">
      <div className="glass-card neon-border max-w-md w-full p-6 space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-500/40" style={{ fontFamily: "Share Tech Mono" }}>
            TAHIR ERP
          </p>
          <h1 className="text-2xl font-bold neon-text-cyan tracking-wider" style={{ fontFamily: "Orbitron" }}>
            {mode === "login" ? "Employee Login" : "Register Employee"}
          </h1>
          <p className="text-xs text-cyan-500/40 mt-1">Local network auth via Java API server</p>
        </div>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          noValidate
        >
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2 rounded-lg"
            autoComplete="username"
            inputMode="email"
            aria-label="Email"
          />

          {mode === "register" && (
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              className="w-full px-3 py-2 rounded-lg"
              autoComplete="name"
              aria-label="Full name"
            />
          )}

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 rounded-lg pr-24"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              aria-label="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded border border-cyan-500/20 text-cyan-200/75 hover:text-cyan-100"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button type="submit" disabled={loading || !isFormValid} className="btn-cyber w-full py-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === "login" ? "register" : "login"));
              setMessage(null);
              setPassword("");
            }}
            className="btn-ghost w-full py-2"
          >
            {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
          </button>

          {message && (
            <div role="status" aria-live="polite" className="text-xs p-2 rounded border border-cyan-500/20 text-cyan-200/80 bg-cyan-500/5">{message}</div>
          )}

          <p className="text-[11px] text-cyan-500/45" style={{ fontFamily: "Share Tech Mono" }}>
            If you see a network error, start the Java API server (`npm run java:server`) and ensure VITE_JAVA_API_BASE is reachable.
          </p>
        </form>
      </div>
    </div>
  );
}
