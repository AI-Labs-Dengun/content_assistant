"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

// Define the context type
type SupabaseContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, company?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

// Create the context
const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

// Create a hook to use the context
export const useSupabase = () => useContext(SupabaseContext);

// Provider component
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for user on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error("Error checking auth session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, name: string, company?: string) => {
    try {
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            company: company || null
          }
        }
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        // Check if it's a database error
        if (signUpError.message.includes('Database error')) {
          console.error('Database error details:', signUpError);
          return { 
            error: new Error('Unable to create user profile. Please try again or contact support.') 
          };
        }
        return { error: signUpError };
      }

      if (!data.user) {
        console.error('No user data returned from signup');
        return { error: new Error('No user data returned') };
      }

      // Log successful signup
      console.log('User created successfully:', data.user.id);
      
      return { error: null };
    } catch (error) {
      console.error('Unexpected error during signup:', error);
      return { error };
    }
  };

  // Sign out function
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
} 