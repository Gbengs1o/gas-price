// File: context/AuthContext.tsx

import React, { useState, useEffect, createContext, useContext, PropsWithChildren } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase'; // We'll use the client we already created

// Define the shape of the data and functions we want to share
type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => void;
};

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This is the main component that will wrap our app
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This function runs once when the component first mounts.
    // It checks if there's an existing user session stored in the device.
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setIsLoading(false);
    };

    fetchSession();

    // This is the magic of Supabase Auth. It sets up a listener that
    // automatically updates the session state whenever the user logs in,
    // logs out, or their session is refreshed.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // This is a cleanup function. When the component is unmounted,
    // it unsubscribes from the listener to prevent memory leaks.
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // This function signs the user out
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // The value object contains the data we want to make available to the rest of the app.
  const value = {
    session,
    user: session?.user ?? null,
    isLoading,
    signOut,
  };

  // We render the provider, passing down the value. The `children` prop will be our entire app.
  // We don't render anything until the initial session check is complete.
  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

// This is a custom hook that makes it easy to access the auth context from any component.
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}