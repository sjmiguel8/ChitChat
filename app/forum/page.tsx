"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Layout from "../components/Layout/Layout"
import { supabase } from "@/lib/supabase"
import ForumList from "../components/Forum/ForumList"
import CreateForumForm from "../components/Forum/CreateForumForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Forum() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const forumListRef = useRef<import("@/app/components/Forum/ForumList").ForumListHandle | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setUser(user)
        } else {
          router.push("/auth")
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        router.push("/auth")
      } finally {
        setIsLoading(false)
      }
    }
    getUser()
  }, [router])

  const handleForumCreated = () => {
    forumListRef.current?.fetchForums()
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    )
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-red-500">Please log in to access forums</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Forums</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create a New Forum</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateForumForm userId={user.id} onForumCreated={handleForumCreated} />
          </CardContent>
        </Card>

        <ForumList ref={forumListRef} />
      </div>
    </Layout>
  )
}
