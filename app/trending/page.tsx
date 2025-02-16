"use client"

import { useState, useEffect } from "react"
import { useUser } from "../lib/hooks"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import Layout from "../components/Layout/Layout"
import { format } from "date-fns"
import styles from "./trending.module.css"

interface Post {
  id: number
  content: string
  created_at: string
  likes: number
  user: {
    username: string | null
  }
  _count?: {
    comments: number
  }
}

type TrendingTab = "status" | "forums"

export default function TrendingPage() {
  const [tab, setTab] = useState<TrendingTab>("status")
  const [items, setItems] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchTrendingItems()
  }, [tab])

  const fetchTrendingItems = async () => {
    setIsLoading(true)
    try {
      if (tab === "status") {
        const { data, error } = await supabase
          .from("status_updates")
          .select(`
            *,
            user:profiles!status_updates_user_id_fkey(username)
          `)
          .order("likes", { ascending: false })
          .limit(10)

        if (error) throw error
        setItems(data)
      } else {
        const { data, error } = await supabase
          .from("posts")
          .select(`
            *,
            user:profiles!posts_user_id_fkey(username)
          `)
          .order("likes", { ascending: false })
          .limit(10)

        if (error) throw error
        setItems(data)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch trending items",
        variant: "destructive",
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
        </header>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "status" ? styles.activeTab : ""}`}
            onClick={() => setTab("status")}
          >
            Status Updates
          </button>
          <button
            className={`${styles.tab} ${tab === "forums" ? styles.activeTab : ""}`}
            onClick={() => setTab("forums")}
          >
            Forum Posts
          </button>
        </div>

        {isLoading ? (
          <div className="text-center">Loading trending items...</div>
        ) : (
          <div className={styles.grid}>
            {items.map((item) => (
              <div key={item.id} className={styles.card}>
                <div className={styles.header}>
                  <div className={styles.info}>
                    <div className={styles.username}>
                      {item.user.username || "Anonymous"}
                    </div>
                    <div className={styles.timestamp}>
                      {format(new Date(item.created_at), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
                <div className={styles.content}>{item.content}</div>
                <div className={styles.stats}>
                  <div className={styles.stat}>
                    {item.likes} likes
                  </div>
                  {item._count && (
                    <div className={styles.stat}>
                      {item._count.comments} comments
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No trending items to show
          </div>
        )}
      </div>
    </Layout>
  )
}
