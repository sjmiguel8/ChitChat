"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Layout from "../components/Layout/Layout"
import ForumList from "../components/Forum/ForumList"
import CreateForumForm from "../components/Forum/CreateForumForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import styles from "./forum.module.css"
import { useUser } from "../lib/hooks"

export default function ForumPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const router = useRouter()
  const { user } = useUser()
  const dialogDescription = "Create a new discussion forum. Enter a name and description for your forum."

  const handleForumCreated = () => {
    setIsCreateOpen(false)
    router.refresh()
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
          <p className={styles.title}>Current Forums</p>
          {user && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className={styles.createButton}
              type="button"
            >
              Create New Forum
            </button>
          )}
        </header>

        <ForumList />

        {isCreateOpen && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Forum</DialogTitle>
                <DialogDescription>
                  {dialogDescription}
                </DialogDescription>
              </DialogHeader>
              <CreateForumForm
                userId={user?.id || ""}
                onForumCreated={handleForumCreated}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  )
}
