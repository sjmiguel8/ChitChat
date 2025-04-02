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

interface Post {
  id: number
  content: string
  created_at: string
  forum_id: number
  user_id: string
  user?: {
    username: string | null
  }
}

interface ForumPostsProps {
  forumId: number
  userId: string
}

export default function ForumPosts({ forumId, userId }: ForumPostsProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newPost, setNewPost] = useState("")
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [editContent, setEditContent] = useState("")
  const [deletePost, setDeletePost] = useState<Post | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPosts()

    const channel = supabase
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
          fetchPosts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [forumId])

const fetchPosts = async () => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*, user:profiles(username)')
      .eq("forum_id", forumId)
      .order("created_at", { ascending: true })

    if (error) {
      if (error instanceof SelectQueryError) {
        toast({
          title: "Error",
          description: "Failed to fetch posts due to a schema error. Please check your Supabase configuration.",
          variant: "destructive",
        })
      } else {
        throw error
      }
    } else {
      setPosts(data)
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to fetch posts. Please try again.",
      variant: "destructive",
    })
    console.error("Error fetching posts:", error)
  } finally {
    setIsLoading(false)
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
      fetchPosts()
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
      fetchPosts()
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
      fetchPosts()
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
        {posts.map((post) => (
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
        {posts.length === 0 && (
          <p className={styles.emptyState}>
            No posts yet. Be the first to post in this forum!
          </p>
        )}
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

export default function ForumPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const handleForumCreated = () => {
    setIsCreateOpen(false);
    router.refresh();
  };

  const handlePostCreated = () => {
    router.push(`/forum/${forumId}`);
  };

  return (
    <Layout>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.title}>Current Forums</p>
          {user && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className={styles.createButton}
            >
              Create New Forum
            </button>
          )}
        </header>

        <ForumList />

        {isCreateOpen && (
          <CreateForumForm
            userId={user?.id || ""}
            onForumCreated={handleForumCreated}
          />
        )}

        <ForumPosts
          forumId={forumId}
          userId={user?.id || ""}
          onPostCreated={handlePostCreated}
        />
      </div>
    </Layout>
  );
}

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  forum_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (forum_id) REFERENCES forums (id),
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_posts_forum_id ON posts (forum_id);
CREATE INDEX idx_posts_user_id ON posts (user_id);