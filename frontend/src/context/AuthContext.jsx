import { createContext, useContext, useState } from "react";

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
  // Was the student already signed in? Read once, while the state is created, so there is no
  // flash of the signed-out page and no state change inside an effect.
  const [stored] = useState(() => {
    try {
      // "Keep me signed in" lives in localStorage, otherwise the tab's sessionStorage
      const store = localStorage.getItem("arivo_token") ? localStorage : sessionStorage;
      const savedToken = store.getItem("arivo_token");
      const savedUser = store.getItem("arivo_user");
      if (savedToken && savedUser) return { token: savedToken, user: JSON.parse(savedUser) };
    } catch {
      /* storage unavailable or corrupted: stay signed out */
    }
    return { token: null, user: null };
  });
  const [currentUser, setCurrentUser] = useState(stored.user);
  const [token, setToken] = useState(stored.token);
  const loading = false;

  // Save user and token after successful login
  const clearStored = () => {
    try {
      [localStorage, sessionStorage].forEach((s) => {
        s.removeItem("arivo_token");
        s.removeItem("arivo_user");
      });
    } catch {
      /* storage unavailable */
    }
  };

  const login = (userData, userToken, remember = false) => {
    setCurrentUser(userData);
    setToken(userToken);
    clearStored();
    try {
      const store = remember ? localStorage : sessionStorage;
      store.setItem("arivo_token", userToken);
      store.setItem("arivo_user", JSON.stringify(userData));
    } catch {
      /* storage unavailable: session lasts until reload */
    }
  };

  // Merge changes (e.g. onboarding done) into the user and keep storage in step
  const updateUser = (patch) => {
    setCurrentUser((prev) => {
      const next = { ...(prev || {}), ...patch };
      try {
        const store = localStorage.getItem("arivo_token") ? localStorage : sessionStorage;
        store.setItem("arivo_user", JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  };

  // Clear everything on logout
  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    clearStored();
    try {
      localStorage.removeItem("arivo_pf_context");
    } catch {
      /* storage unavailable */
    }
  };

  const value = {
    currentUser,
    token,
    login,
    logout,
    updateUser,
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
