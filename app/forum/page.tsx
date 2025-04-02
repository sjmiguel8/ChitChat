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

  return (
    <Layout>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.title}>Current Forums</p>
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
              <DialogDescription>
                Create a new discussion forum. Enter a name and description for your forum.
              </DialogDescription>
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
