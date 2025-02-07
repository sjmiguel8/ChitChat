"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Layout from "../components/Layout/Layout"
import ForumList from "../components/Forum/ForumList"
import CreateForumForm from "../components/Forum/CreateForumForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import styles from "../../app/forum/forum.module.css"
import { useUser } from "../lib/hooks"

export default function ForumPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const router = useRouter()
  const { user } = useUser()

  const handleForumCreated = () => {
    setIsCreateOpen(false)
    router.refresh()
  }

  return (
    <Layout>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Discussion Forums</h1>
          <p className={styles.description}>
            Join our vibrant community discussions on various topics. Create a new forum or
            participate in existing ones.
          </p>
          {user && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className={styles.createButton}
            >
              Create New Forum
            </button>
          )}
        </header>

        <ForumList />

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Forum</DialogTitle>
            </DialogHeader>
            <CreateForumForm
              userId={user?.id || ""}
              onForumCreated={handleForumCreated}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
