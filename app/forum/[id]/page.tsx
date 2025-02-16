"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Layout from "@/app/components/Layout/Layout"
import { supabase } from "@/lib/supabase"
import ForumPosts from "@/app/components/Forum/ForumPosts"
import { ChevronLeft } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import styles from "./forum-detail.module.css"

interface Forum {
  id: number
  name: string
  description: string
  created_at: string
  created_by: string
  profiles: {
    username: string
  }
}

export default function ForumPage({ params }: { params: { id: string } }) {
  const [forum, setForum] = useState<Forum | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

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

  const fetchForum = async () => {
    try {
      const { id } = await params
      const { data, error } = await supabase
        .from("forums")
        .select(`
          *,
          profiles (username)
        `)
        .eq("id", id)
        .single()

      if (error) throw error
      if (!data) {
        toast({
          title: "Error",
          description: "Forum not found.",
          variant: "destructive",
        })
        router.push("/forum")
        return
      }

      setForum(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch forum details.",
        variant: "destructive",
      })
      console.error("Error fetching forum:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchForum()
  }, [])

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Loading forum...</div>
        </div>
      </Layout>
    )
  }

  if (!forum) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-destructive">Forum not found</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <nav className={styles.navigation}>
            <button
              className={styles.backButton}
              onClick={() => router.push("/forum")}
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Forums
            </button>

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/forum">Forums</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{forum.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </nav>

          <div className={styles.forumCard}>
            <h1 className={styles.forumTitle}>{forum.name}</h1>
            <div className={styles.forumMeta}>
              Created by {forum.profiles.username} on{" "}
              {format(new Date(forum.created_at), "MMM d, yyyy")}
            </div>
            <p className={styles.forumDescription}>{forum.description}</p>
          </div>
        </div>

        <div className={styles.content}>
          {user && <ForumPosts forumId={forum.id} userId={user.id} />}
        </div>
      </div>
    </Layout>
  )
}
