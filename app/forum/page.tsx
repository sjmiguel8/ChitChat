"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Layout from "../components/Layout/Layout"
import ForumList from "../components/Forum/ForumList"
import { Button } from "@/components/ui/button" // Add Button import
import styles from "./forum.module.css"
import { useUser } from "../lib/hooks"

export default function ForumPage() {
  const router = useRouter()
  const { user, loading } = useUser() // Get loading state from useUser

  // Show loading state while checking auth
  if (loading) {
    return (
      <Layout>
        <div className={styles.container}>
          <p className="text-center">Loading...</p>
        </div>
      </Layout>
    )
  }

  if (!user) {
    return (
      <Layout>
        <div className={styles.container}>
          <p className="text-center">Please log in to view forums.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Current Forums</h1>
          <p className={styles.description}>
            Join discussions or start your own forum
          </p>
          {user && (
            <Button
              onClick={() => router.push("/forum/new")}
              className={styles.createButton}
              size="lg"
            >
              Create New Forum
            </Button>
          )}
        </header>
        <main>
          <ForumList />
        </main>
      </div>
    </Layout>
  )
}
