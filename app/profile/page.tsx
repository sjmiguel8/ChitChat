"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Layout from "@/app/components/Layout/Layout"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StatusUpdate from "@/app/components/Profile/StatusUpdate"
import styles from "./profile.module.css"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    getUser()
    fetchUserContent()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
    } else {
      router.push("/auth")
    }
  }

  const fetchUserContent = async () => {
    if (!user) return

    // Fetch both forum posts and status updates
    const [postsResult, statusResult] = await Promise.all([
      supabase
        .from('posts')
        .select('*, profiles!posts_user_id_fkey(username)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('status_updates')
        .select('*, profiles!status_updates_user_id_fkey(username)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    ])

    setPosts(postsResult.data || [])
    // Status updates are handled by the StatusUpdate component
  }

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>My Profile</h1>
        
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status">Status Updates</TabsTrigger>
            <TabsTrigger value="posts">Forum Posts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status">
            {user && <StatusUpdate userId={user.id} />}
          </TabsContent>
          
          <TabsContent value="posts">
            <div className={styles.postsGrid}>
              {posts.map(post => (
                <div key={post.id} className={styles.postCard}>
                  <p className={styles.postContent}>{post.content}</p>
                  <div className={styles.postMeta}>
                    Posted in Forum #{post.forum_id}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
