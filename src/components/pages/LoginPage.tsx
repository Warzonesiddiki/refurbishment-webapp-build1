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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    setMessage(null);

    if (!email || !password || (mode === "register" && !fullName)) {
      setMessage("Please complete all required fields.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        await registerUser({ email, fullName, password });
        setMessage("Registration successful. You can now log in.");
        setMode("login");
      } else {
        await loginUser({ email, password });
        onAuthenticated();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid flex items-center justify-center p-4">
      <div className="glass-card neon-border max-w-md w-full p-6 space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-500/40" style={{ fontFamily: "Share Tech Mono" }}>
            ALMASFUFA ERP
          </p>
          <h1 className="text-2xl font-bold neon-text-cyan tracking-wider" style={{ fontFamily: "Orbitron" }}>
            {mode === "login" ? "Employee Login" : "Register Employee"}
          </h1>
          <p className="text-xs text-cyan-500/40 mt-1">Local network auth via Java API server</p>
        </div>

        <div className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2 rounded-lg"
            autoComplete="username"
          />

          {mode === "register" && (
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              className="w-full px-3 py-2 rounded-lg"
            />
          )}

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 rounded-lg"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          <button onClick={submit} disabled={loading} className="btn-cyber w-full py-2">
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>

          <button
            onClick={() => {
              setMode((m) => (m === "login" ? "register" : "login"));
              setMessage(null);
            }}
            className="btn-ghost w-full py-2"
          >
            {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
          </button>

          {message && (
            <div className="text-xs p-2 rounded border border-cyan-500/20 text-cyan-200/80 bg-cyan-500/5">{message}</div>
          )}

          <p className="text-[11px] text-cyan-500/45" style={{ fontFamily: "Share Tech Mono" }}>
            If you see a network error, start the Java API server (`npm run java:server`) and ensure VITE_JAVA_API_BASE is reachable.
          </p>
        </div>
      </div>
    </div>
  );
}
