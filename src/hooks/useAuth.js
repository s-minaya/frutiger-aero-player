// Hook central de autenticación: expone el estado del usuario a toda la app

import { useState, useEffect, useCallback } from "react";
import { isLoggedIn } from "../auth/tokenManager.js";
import { getCurrentUser } from "../api/user.js";
import { logout } from "../auth/spotifyAuth.js";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUser = useCallback(async () => {
    if (!isLoggedIn()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profile = await getCurrentUser();
      setUser(profile);
      setIsPremium(profile?.product === "premium");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    user,
    isPremium,
    isLoggedIn: !!user,
    loading,
    error,
    logout,
    reload: loadUser,
  };
}
