"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import Layout from "../components/Layout/Layout"
import styles from "./auth.module.css"

export default function Auth() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in")
  const router = useRouter()
  const { toast } = useToast()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!supabase) {
        throw new Error("Supabase client not initialized")
      }

      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        
        toast({
          title: "Check your email",
          description: "We've sent you a link to verify your email address.",
        })
      } else {
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          if (error) throw error

          router.push("/")
        } catch (signInError: any) {
          if (signInError.message === "Failed to fetch") {
            throw new Error("Unable to connect to authentication service. Please check your internet connection and try again.")
          }
          throw signInError
        }
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.authCard}>
          <h1 className={styles.title}>
            {mode === "sign-in" ? "Welcome Back!" : "Create Account"}
          </h1>
          <p className={styles.description}>
            {mode === "sign-in"
              ? "Sign in to continue to the platform"
              : "Sign up to start your journey"}
          </p>

          <form onSubmit={handleAuth}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.inputLabel}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.inputLabel}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className={styles.input}
              />
            </div>

            <button
              type="submit"
              className={styles.button}
              disabled={isLoading || !email || !password}
            >
              {isLoading
                ? mode === "sign-in"
                  ? "Signing in..."
                  : "Signing up..."
                : mode === "sign-in"
                ? "Sign In"
                : "Sign Up"}
            </button>
          </form>

          <div className={styles.switchMode}>
            {mode === "sign-in" ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
              className={styles.switchButton}
            >
              {mode === "sign-in" ? "Sign Up" : "Sign In"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
