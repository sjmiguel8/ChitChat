"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "../../lib/hooks"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import styles from "./layout.module.css"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  const { user } = useUser()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const isActive = (path: string) => {
    return pathname === path ? styles.activeLink : ""
  }

  return (
    <div>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            ChitChat
          </Link>

          <div className={styles.links}>
            {user ? (
              <>
                <Link
                  href="/forum"
                  className={`${styles.navLink} ${isActive("/forum")}`}
                >
                  Forums
                </Link>
                <Link
                  href="/explore"
                  className={`${styles.navLink} ${isActive("/explore")}`}
                >
                  Explore
                </Link>
                <Link
                  href="/messages"
                  className={`${styles.navLink} ${isActive("/messages")}`}
                >
                  Messages
                </Link>
                <Link
                  href="/trending"
                  className={`${styles.navLink} ${isActive("/trending")}`}
                >
                  Trending
                </Link>
                <Link
                  href="/profile"
                  className={`${styles.navLink} ${isActive("/profile")}`}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className={styles.authButton}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/auth" className={styles.authButton}>
                Sign In
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
