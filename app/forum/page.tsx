"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Layout from "../components/Layout/Layout"
import { supabase } from "@/lib/supabase"
import ForumList from "../components/Forum/ForumList"
import CreateForumForm from "../components/Forum/CreateForumForm"

export default function Forum() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      } else {
        router.push("/auth")
      }
    }
    getUser()
  }, [router])

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Forums</h1>
        <CreateForumForm userId={user.id} />
        <ForumList />
      </div>
    </Layout>
  )
}

