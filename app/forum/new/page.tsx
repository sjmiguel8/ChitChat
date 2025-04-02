"use client"

import { useRouter } from "next/navigation"
import Layout from "@/app/components/Layout/Layout"
import CreateForumForm from "@/app/components/Forum/CreateForumForm"
import { useUser } from "@/app/lib/hooks"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import styles from "./new-forum.module.css"

export default function NewForumPage() {
  const router = useRouter()
  const { user, loading } = useUser()

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

  // Only redirect if we're sure there's no user
  if (!loading && !user) {
    router.push("/auth")
    return null
  }

  return (
    <Layout>
      <div className={styles.container}>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className={styles.backButton}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Forums
        </Button>

        <h1 className={styles.title}>Create New Forum</h1>
        <p className={styles.description}>
          Create a new discussion forum. Enter a name and description for your forum.
        </p>

        <div className={styles.formContainer}>
          <CreateForumForm
            userId={user?.id || ""}
            onForumCreated={() => router.push("/forum")}
          />
        </div>
      </div>
    </Layout>
  )
}
