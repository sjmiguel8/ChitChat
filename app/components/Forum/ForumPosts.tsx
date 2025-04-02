"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import styles from "./forum-posts.module.css"
import { PostgrestError } from '@supabase/supabase-js'

interface ForumPost {
  id: number
  content: string
  created_at: string
  forum_id: number
  user_id: string
  user?: {
    username: string | null
  }
}

interface StatusUpdate {
  id: number
  content: string
  created_at: string
  user_id: string
  likes: number
  user?: {
    username: string | null
  }
}

interface ForumPostsProps {
  forumId: number
  userId: string
}

export default function ForumPosts({ forumId, userId }: ForumPostsProps) {
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([])
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newPost, setNewPost] = useState("")
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null)
  const [editContent, setEditContent] = useState("")
  const [deletePost, setDeletePost] = useState<ForumPost | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchForumPosts()
    fetchStatusUpdates()

    // Subscribe to forum posts changes
    const forumChannel = supabase
      .channel('forum_posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `forum_id=eq.${forumId}`
        },
        () => {
          fetchForumPosts()
        }
      )
      .subscribe()

    // Subscribe to status updates changes
    const statusChannel = supabase
      .channel('status_updates_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'status_updates'
        },
        () => {
          fetchStatusUpdates()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(forumChannel)
      supabase.removeChannel(statusChannel)
    }
  }, [forumId])

  const fetchForumPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, user:profiles(username)')
        .eq('forum_id', forumId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setForumPosts(data || [])
    } catch (error) {
      console.error('Error fetching forum posts:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch forum posts',
        variant: 'destructive'
      })
    }
  }

  const fetchStatusUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from('status_updates')
        .select(`
          *,
          user:profiles(username)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setStatusUpdates(data || [])
    } catch (error) {
      console.error('Error fetching status updates:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch status updates',
        variant: 'destructive'
      })
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPost.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("posts").insert({
        content: newPost.trim(),
        forum_id: forumId,
        user_id: userId,
      })

      if (error) throw error

      toast({
        title: "Post Created",
        description: "Your post has been published successfully!",
      })
      setNewPost("")
      fetchForumPosts()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      })
      console.error("Error creating post:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingPost || !editContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("posts")
        .update({ content: editContent.trim() })
        .eq("id", editingPost.id)

      if (error) throw error

      toast({
        title: "Post Updated",
        description: "Your post has been updated successfully!",
      })
      fetchForumPosts()
      setEditingPost(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      })
      console.error("Error updating post:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletePost || isSubmitting) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", deletePost.id)

      if (error) throw error

      toast({
        title: "Post Deleted",
        description: "Your post has been deleted successfully.",
      })
      fetchForumPosts()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      })
      console.error("Error deleting post:", error)
    } finally {
      setDeletePost(null)
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className={styles.emptyState}>Loading posts...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.createPostCard}>
        <h2 className={styles.createPostTitle}>Create a New Post</h2>
        <form onSubmit={handleCreatePost} className={styles.createPostForm}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Write your post here..."
            className={styles.textarea}
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            disabled={isSubmitting || !newPost.trim()}
            className="w-full md:w-auto"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </form>
      </div>

      <ScrollArea className={styles.postsList}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Forum Posts</h3>
          {forumPosts.map((post) => (
            <div key={post.id} className={styles.postCard}>
              <div className={styles.postHeader}>
                <div className={styles.postMeta}>
                  <span className={styles.username}>{post.user?.username || 'Unknown'}</span>
                  <span className={styles.timestamp}>
                    {format(new Date(post.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
                {post.user_id === userId && (
                  <div className={styles.actions}>
                    <button
                      className={styles.editButton}
                      onClick={() => {
                        setEditingPost(post)
                        setEditContent(post.content)
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => setDeletePost(post)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <p className={styles.postContent}>{post.content}</p>
            </div>
          ))}
          {forumPosts.length === 0 && (
            <p className={styles.emptyState}>No forum posts yet.</p>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Status Updates</h3>
          {statusUpdates.map((status) => (
            <div key={status.id} className={styles.statusCard}>
              <div className={styles.postHeader}>
                <div className={styles.postMeta}>
                  <span className={styles.username}>{status.user?.username || 'Unknown'}</span>
                  <span className={styles.timestamp}>
                    {format(new Date(status.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
              </div>
              <p className={styles.postContent}>{status.content}</p>
              <div className={styles.statusFooter}>
                <span className={styles.likes}>Likes: {status.likes}</span>
              </div>
            </div>
          ))}
          {statusUpdates.length === 0 && (
            <p className={styles.emptyState}>No status updates yet.</p>
          )}
        </div>
      </ScrollArea>

      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className={styles.textarea}
            disabled={isSubmitting}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPost(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePost} onOpenChange={() => setDeletePost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}