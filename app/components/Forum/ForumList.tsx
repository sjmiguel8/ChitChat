"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"

interface Forum {
  id: number
  name: string
  description: string
  created_at: string
  created_by: string
  profiles: {
    username: string
  }
  _count?: {
    posts: number
  }
}

export type ForumListHandle = {
  fetchForums: () => Promise<void>
}

const ForumList = forwardRef<ForumListHandle, {}>((_, ref) => {
  const [forums, setForums] = useState<Forum[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchForums = async () => {
    try {
      // First get forums with profiles
      const { data: forumData, error: forumError } = await supabase
        .from("forums")
        .select(`
          *,
          profiles!forums_created_by_fkey(username)
        `)
        .order("created_at", { ascending: false })

      if (forumError) throw forumError

      // Then get post counts for each forum
      const forumsWithCounts = await Promise.all(
        forumData.map(async (forum) => {
          const { count, error: countError } = await supabase
            .from("posts")
            .select("*", { count: "exact", head: true })
            .eq("forum_id", forum.id)

          if (countError) throw countError

          return {
            ...forum,
            _count: {
              posts: count || 0
            }
          }
        })
      )

      setForums(forumsWithCounts)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch forums. Please try again.",
        variant: "destructive",
      })
      console.error("Error fetching forums:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchForums()

    // Set up real-time subscription for forums
    const forumChannel = supabase
      .channel('forum_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forums'
        },
        () => {
          fetchForums()
        }
      )
      .subscribe()

    // Set up real-time subscription for posts (to update post counts)
    const postsChannel = supabase
      .channel('posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        () => {
          fetchForums()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(forumChannel)
      supabase.removeChannel(postsChannel)
    }
  }, [])

  useImperativeHandle(ref, () => ({
    fetchForums
  }))

  if (isLoading) {
    return <div className="text-center mt-8">Loading forums...</div>
  }

  if (forums.length === 0) {
    return (
      <div className="text-center mt-8 text-gray-500">
        No forums have been created yet. Be the first to create one!
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-4">
      {forums.map((forum) => (
        <Card key={forum.id}>
          <CardHeader>
            <Link href={`/forum/${forum.id}`}>
              <CardTitle className="text-xl hover:text-blue-600 transition-colors cursor-pointer">
                {forum.name}
              </CardTitle>
            </Link>
            <CardDescription>
              Created by {forum.profiles.username} on{" "}
              {format(new Date(forum.created_at), "MMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{forum.description}</p>
            <div className="text-sm text-gray-500">
              {forum._count?.posts || 0} posts
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
})

ForumList.displayName = "ForumList"

export default ForumList
