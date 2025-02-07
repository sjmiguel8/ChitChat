"use client"

import { useState, useEffect } from "react"
import { useUser } from "../lib/hooks"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import Layout from "../components/Layout/Layout"
import Link from "next/link"
import { format } from "date-fns"
import styles from "./explore.module.css"

interface ExploreItem {
  id: number
  title: string
  description: string
  type: string
  created_at: string
  tags: string[]
  user?: {
    username: string | null
  }
  _count?: {
    posts?: number
    likes?: number
  }
}

type FilterType = "all" | "forums" | "status" | "trending"

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const [items, setItems] = useState<ExploreItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchItems()
  }, [filter])

  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const results: ExploreItem[] = []

      if (filter === "all" || filter === "forums") {
        const { data: forums, error: forumsError } = await supabase
          .from("forums")
          .select(`
            *,
            profiles!forums_created_by_fkey(username)
          `)
          .order("created_at", { ascending: false })
          .limit(filter === "all" ? 5 : 10)

        if (forumsError) throw forumsError
        if (forums) {
          const forumItems = forums.map(forum => ({
            id: forum.id,
            title: forum.name,
            description: forum.description,
            type: "forum",
            created_at: forum.created_at,
            tags: [],
            user: { username: forum.profiles?.username }
          }))
          results.push(...forumItems)
        }
      }

      if (filter === "all" || filter === "status") {
        const { data: statuses, error: statusError } = await supabase
          .from("status_updates")
          .select(`
            *,
            user:profiles!status_updates_user_id_fkey(username)
          `)
          .order("created_at", { ascending: false })
          .limit(filter === "all" ? 5 : 10)

        if (statusError) throw statusError
        if (statuses) {
          const statusItems = statuses.map(status => ({
            id: status.id,
            title: `Status by ${status.user?.username || 'Anonymous'}`,
            description: status.content,
            type: "status",
            created_at: status.created_at,
            tags: [],
            user: status.user,
            _count: { likes: status.likes || 0 }
          }))
          results.push(...statusItems)
        }
      }

      // Filter by search query if present
      const filteredResults = searchQuery
        ? results.filter(item => 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : results

      setItems(filteredResults)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch explore items",
        variant: "destructive",
      })
      console.error("Fetch error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Explore</h1>
          <p className={styles.description}>
            Discover new discussions, trending topics, and connect with others
          </p>
        </header>

        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

        <div className={styles.filterBar}>
          {["all", "forums", "status"].map((f) => (
            <button
              key={f}
              className={`${styles.filterButton} ${
                filter === f ? styles.activeFilter : ""
              }`}
              onClick={() => setFilter(f as FilterType)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className={styles.grid}>
            {items.map((item) => (
              <div key={`${item.type}-${item.id}`} className={styles.card}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDescription}>
                  {item.description.length > 150
                    ? `${item.description.slice(0, 150)}...`
                    : item.description}
                </p>
                <div className={styles.tags}>
                  <span className={styles.tag}>{item.type}</span>
                  {item.tags?.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className={styles.cardFooter}>
                  <span>
                    {item._count?.posts
                      ? `${item._count.posts} posts`
                      : item._count?.likes
                      ? `${item._count.likes} likes`
                      : ""}
                  </span>
                  <span>
                    {format(new Date(item.created_at), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No items found
          </div>
        )}
      </div>
    </Layout>
  )
}
