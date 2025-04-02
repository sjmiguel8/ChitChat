"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format, formatDistanceToNow } from "date-fns"
import { MessageSquare, Clock, User } from "lucide-react"

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
          user:profiles!created_by(username)
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
    <div className="grid gap-6 mt-8">
      {forums.map((forum) => (
        <Card 
          key={forum.id} 
          className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-border/40 bg-card"
        >
          <CardHeader className="space-y-2">
            <Link href={`/forum/${forum.id}`}>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-[hsl(142,76%,46%)] bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                {forum.name}
              </CardTitle>
            </Link>
            <CardDescription className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Created by {forum.user?.username || 'Unknown'}</span>
              <span className="text-xs opacity-60">•</span>
              <time className="text-xs">
                {format(new Date(forum.created_at), "MMMM d, yyyy")}
              </time>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 mb-4 text-base leading-relaxed">
              {forum.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                <span>{forum._count?.posts || 0} posts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{formatDistanceToNow(new Date(forum.created_at))} ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
})

ForumList.displayName = "ForumList"

export default ForumList
