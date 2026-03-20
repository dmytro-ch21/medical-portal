import { useState } from "react";
import { useAuth } from "@/context/AuthContext.jsx";
import { Input, Label } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ username, password });
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-portal-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent-light rounded-2xl mb-4">
            <span className="text-2xl">🏥</span>
          </div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Plus Surgery</h1>
          <p className="text-sm text-muted mt-1">Hollywood, FL · Internal Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-portal-border p-6 shadow-sm">
          <h2 className="text-base font-semibold mb-5">Войти в систему</h2>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="username">Логин</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Входим..." : "Войти"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
