/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { verifyDeviceTrust } from '../lib/deviceTrustService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deviceTrust, setDeviceTrust] = useState(null); // { trusted, visitorId, reason? }

  // Verify device trust when user session changes
  const checkDeviceTrust = useCallback(async (currentUser) => {
    if (!currentUser?.id || !currentUser?.email) {
      setDeviceTrust(null);
      return;
    }
    try {
      const result = await verifyDeviceTrust(supabase, currentUser.id, currentUser.email);
      setDeviceTrust(result);
    } catch (err) {
      console.error('AuthContext: Error verificando dispositivo:', err);
      // Fail-open: don't block users if fingerprint check fails
      setDeviceTrust({ trusted: true, visitorId: 'error', reason: 'Error de verificación' });
    }
  }, []);

  useEffect(() => {
    // Check active sessions and sets the user
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      if (currentUser) checkDeviceTrust(currentUser);
    };
    checkSession();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      if (currentUser) checkDeviceTrust(currentUser);
    });

    return () => subscription.unsubscribe();
  }, [checkDeviceTrust]);

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    user,
    loading,
    deviceTrust,  // { trusted, visitorId, reason? } — null if not checked yet
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

