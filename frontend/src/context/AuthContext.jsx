import { createContext, useContext, useState, useEffect } from "react";

// ─────────────────────────────────────────────
// Create the context — this is the shared space
// where auth data lives across all components
// ─────────────────────────────────────────────
const AuthContext = createContext(null);

// ─────────────────────────────────────────────
// AUTH PROVIDER
// Wraps the entire app in App.jsx
// Makes currentUser and token available
// to every single component in the app
// ─────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user was already logged in
  // Runs once when app first loads
  useEffect(() => {
    const savedToken = sessionStorage.getItem("arivo_token");
    const savedUser = sessionStorage.getItem("arivo_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Save user and token after successful login
  const login = (userData, userToken) => {
    setCurrentUser(userData);
    setToken(userToken);
    sessionStorage.setItem("arivo_token", userToken);
    sessionStorage.setItem("arivo_user", JSON.stringify(userData));
  };

  // Clear everything on logout
  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    sessionStorage.removeItem("arivo_token");
    sessionStorage.removeItem("arivo_user");
  };

  const value = {
    currentUser,
    token,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────
// CUSTOM HOOK — useAuth
// Shortcut to access auth context anywhere
// Usage: const { currentUser, token } = useAuth()
// ─────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
