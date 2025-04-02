"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { format, formatDistanceToNow } from "date-fns"
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
  DialogDescription,
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
  replies?: Reply[]
}

interface Reply {
  id: number
  content: string
  created_at: string
  post_id: number
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
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newPost, setNewPost] = useState("")
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null)
  const [editContent, setEditContent] = useState("")
  const [deletePost, setDeletePost] = useState<ForumPost | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const { toast } = useToast()

  const fetchForumPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(id, username),
          replies(
            id,
            content,
            created_at,
            user_id,
            profiles!replies_user_id_fkey(id, username)
          )
        `)
        .eq('forum_id', forumId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setForumPosts(data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch posts',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchForumPosts();

    const postsChannel = supabase
      .channel(`posts_${forumId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
        filter: `forum_id=eq.${forumId}`
      }, () => {
        fetchForumPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, [forumId]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          content: newPost.trim(),
          forum_id: forumId,
          user_id: userId
        })
        .select('*, user:profiles(username)')
        .single();

      if (error) throw error;

      if (data) {
        setForumPosts(current => [data, ...current]);
        setNewPost('');
        toast({
          title: 'Success',
          description: 'Post created successfully!'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleReply = async (postId: number) => {
    if (!replyContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('replies')
        .insert({
          content: replyContent.trim(),
          post_id: postId,
          user_id: userId
        })
        .select('*, user:profiles(username)')
        .single()

      if (error) throw error

      toast({
        title: "Reply Added",
        description: "Your reply has been posted successfully!"
      })
      
      setReplyContent("")
      setReplyingTo(null)
      fetchForumPosts()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive"
      })
    } finally {
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
            autoComplete="off"
            name="post-content"
            id="post-content"
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
          {forumPosts.map((post) => (
            <div key={post.id} className={styles.postCard}>
              <div className={styles.postHeader}>
                <div className={styles.postMeta}>
                  <div className={styles.userInfo}>
                    <span className={styles.username}>
                      {post.profiles?.username || 'Unknown'}
                    </span>
                    <span className={styles.bullet}>•</span>
                    <span className={styles.timestamp}>
                      {formatDistanceToNow(new Date(post.created_at))} ago
                    </span>
                  </div>
                  <p className={styles.postContent}>{post.content}</p>
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

              <div className={styles.replies}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setReplyingTo(post.id)}
                >
                  Reply
                </Button>

                {replyingTo === post.id && (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleReply(post.id)
                    }}
                    className={styles.replyForm}
                  >
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write your reply..."
                      className={styles.textarea}
                      disabled={isSubmitting}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setReplyingTo(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting || !replyContent.trim()}
                      >
                        {isSubmitting ? "Posting..." : "Post Reply"}
                      </Button>
                    </div>
                  </form>
                )}

                {post.replies && post.replies.length > 0 && (
                  <div className={styles.replyList}>
                    {post.replies.map((reply) => (
                      <div key={reply.id} className={styles.replyCard}>
                        <div className={styles.postHeader}>
                          <div className={styles.postMeta}>
                            <span className={styles.username}>
                              {reply.user?.username || 'Unknown'}
                            </span>
                            <span className={styles.timestamp}>
                              {format(new Date(reply.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                          </div>
                          {reply.user_id === userId && (
                            <div className={styles.actions}>
                              <button
                                className={styles.editButton}
                                onClick={() => handleEditReply(reply)}
                              >
                                Edit
                              </button>
                              <button
                                className={styles.deleteButton}
                                onClick={() => handleDeleteReply(reply)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                        <p className={styles.postContent}>{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {forumPosts.length === 0 && (
            <p className={styles.emptyState}>No forum posts yet.</p>
          )}
        </div>
      </ScrollArea>

      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Make changes to your post below.
            </DialogDescription>
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
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
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