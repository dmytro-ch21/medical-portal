import { createContext, useContext, useState, useEffect } from "react";
import { auth as authApi } from "@/api/index.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    authApi.me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const login = async (credentials) => {
    const u = await authApi.login(credentials);
    setUser(u);
    return u;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
