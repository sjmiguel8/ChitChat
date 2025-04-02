"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format, formatDistanceToNow } from "date-fns"
import { MessageSquare, Clock, User } from "lucide-react"
import styles from "./forum-list.module.css"

interface Forum {
  id: number
  name: string
  description: string
  created_at: string
  created_by: string | null
  user?: {
    username: string | null
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
      const { data: forumData, error: forumError } = await supabase
        .from('forums')
        .select(`
          *,
          profiles!created_by(username)
        `)
        .order('created_at', { ascending: false });

      if (forumError) throw forumError;

      // Get post counts
      const forumsWithCounts = await Promise.all(
        forumData.map(async (forum) => {
          const { count } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('forum_id', forum.id);

          return {
            ...forum,
            _count: { posts: count || 0 }
          };
        })
      );

      setForums(forumsWithCounts);
    } catch (error) {
      console.error('Error fetching forums:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch forums. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
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
    <div className={styles.forumGrid}>
      {forums.map((forum) => (
        <div key={forum.id} className={styles.forumCard}>
          <Link href={`/forum/${forum.id}`} className={styles.titleLink}>
            <h2 className={styles.title}>{forum.name}</h2>
          </Link>
          
          <div className={styles.metadata}>
            <div className={styles.metaItem}>
              <User className="h-4 w-4" />
              <span className={styles.username}>
                {forum.user?.username || 'Unknown'}
              </span>
            </div>
            <div className={styles.metaItem}>
              <Clock className="h-4 w-4" />
              <span>Created {formatDistanceToNow(new Date(forum.created_at))} ago</span>
            </div>
          </div>
          
          <p className={styles.description}>{forum.description}</p>
          
          <div className={styles.stats}>
            <div className={styles.stat}>
              <MessageSquare className="h-4 w-4" />
              <span>{forum._count?.posts || 0} posts</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})

ForumList.displayName = "ForumList"

export default ForumList
