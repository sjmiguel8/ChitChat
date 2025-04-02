"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "../lib/hooks"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import Layout from "../components/Layout/Layout"
import { format } from "date-fns"
import { MessageCircle, ThumbsUp, Heart, User, Clock } from "lucide-react"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import styles from "./trending.module.css"

interface ForumPost {
  id: number
  content: string
  created_at: string
  user_id: string
  forum_id: number
  forums: {
    id: number
    name: string
  }
  profiles: {
    username: string
  }
  replies: any[] // Change this to reflect replies array
}

interface StatusUpdate {
  id: number
  content: string
  created_at: string
  likes: number
  user_id: string
  profiles: {
    username: string
  }
}

export default function TrendingPage() {
  const [trendingPosts, setTrendingPosts] = useState<ForumPost[]>([])
  const [trendingStatuses, setTrendingStatuses] = useState<StatusUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchTrendingContent()
  }, [])

  const fetchTrendingContent = async () => {
    try {
      setIsLoading(true)
      const [postsResult, statusResult] = await Promise.all([
        supabase
          .from('posts')
          .select(`
            *,
            forums!inner(id, name),
            profiles!posts_user_id_fkey(username),
            replies(id)
          `)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('status_updates')
          .select(`
            *,
            profiles!status_updates_user_id_fkey(username)
          `)
          .order('likes', { ascending: false })
          .limit(10)
      ])

      if (postsResult.error) throw postsResult.error
      if (statusResult.error) throw statusResult.error

      // Transform posts data to include reply counts
      const postsWithCounts = (postsResult.data || []).map(post => ({
        ...post,
        _count: {
          replies: post.replies?.length || 0
        }
      }))

      setTrendingPosts(postsWithCounts)
      setTrendingStatuses(statusResult.data || [])
    } catch (error) {
      console.error('Error fetching trending content:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch trending content'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Trending Now</h1>
          <p className={styles.description}>
            Check out what's popular across ChitChat
          </p>
        </header>

        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status">Status Updates</TabsTrigger>
            <TabsTrigger value="posts">Forum Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="status">
            <div className={styles.trendingGrid}>
              {isLoading ? (
                <div className={styles.emptyState}>Loading trending status updates...</div>
              ) : trendingStatuses.length === 0 ? (
                <div className={styles.emptyState}>No trending status updates yet</div>
              ) : (
                trendingStatuses.map((status) => (
                  <div key={status.id} className={styles.trendingCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.userInfo}>
                        <User className="h-4 w-4" />
                        <span className={styles.username}>{status.profiles.username}</span>
                      </div>
                      <div className={styles.metadata}>
                        <Clock className="h-4 w-4" />
                        <span>{format(new Date(status.created_at), "MMMM d, yyyy 'at' h:mm a")}</span>
                      </div>
                    </div>
                    <p className={styles.content}>{status.content}</p>
                    <div className={styles.stats}>
                      <div className={styles.stat}>
                        <Heart className="h-4 w-4" />
                        <span>{status.likes} likes</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="posts" className="mt-6">
            <div className="grid gap-6">
              {isLoading ? (
                <div className="text-center py-8">Loading trending posts...</div>
              ) : trendingPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No trending forum posts yet
                </div>
              ) : (
                trendingPosts.map((post) => (
                  <Card 
                    key={post.id} 
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => router.push(`/forum/${post.forum_id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{post.profiles.username}</span>
                        <span className="text-sm text-muted-foreground">
                          in {post.forums.name}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(post.created_at), "MMMM d, yyyy 'at' h:mm a")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground/80 mb-4">{post.content}</p>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post._count.replies} replies</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
