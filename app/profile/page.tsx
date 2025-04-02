"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Layout from "@/app/components/Layout/Layout"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StatusUpdate from "@/app/components/Profile/StatusUpdate"
import styles from "./profile.module.css"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [username, setUsername] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    getUser()
    fetchUserProfile()
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

  const fetchUserProfile = async () => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()

    if (data) {
      setUsername(data.username || '')
      setAvatarUrl(data.avatar_url || '')
    }
  }

  const fetchUserContent = async () => {
    if (!user) return

    try {
      const [postsResult, statusResult] = await Promise.all([
        supabase
          .from('posts')
          .select(`
            *,
            forums!inner(name),
            profiles!posts_user_id_fkey(username)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('status_updates')
          .select('*, profiles!status_updates_user_id_fkey(username)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ])

      if (postsResult.error) throw postsResult.error
      if (statusResult.error) throw statusResult.error

      setPosts(postsResult.data || [])
      // ... rest of the function
    } catch (error) {
      console.error('Error fetching content:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch content',
        variant: 'destructive'
      })
    }
  }

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError
      
      setAvatarUrl(data.publicUrl)
      toast({
        title: "Success",
        description: "Avatar updated successfully!"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error uploading avatar",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarSection}>
            <Avatar className={styles.avatar}>
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className={styles.uploadSection}>
              <Input
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                className={styles.fileInput}
              />
              <p className={styles.username}>{username}</p>
            </div>
          </div>
        </div>

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
