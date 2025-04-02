"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { format, formatDistanceToNow } from "date-fns"
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
  const [editingPostId, setEditingPostId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null)

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

  const handleEdit = async (postId: number) => {
    if (!editingContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("posts")
        .update({ content: editingContent.trim() })
        .eq("id", postId)

      if (error) throw error

      toast({
        title: "Post Updated",
        description: "Your post has been updated successfully!",
      })
      fetchForumPosts()
      setEditingPostId(null)
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

  const handleDelete = async (postId: number) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)

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
      setDeletingPostId(null)
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
        <h2 className={styles.createReplyTitle}>Create a New Reply</h2>
        <form onSubmit={handleCreatePost} className={styles.createReplyForm}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Write your reply..."
            className={styles.textarea}
            disabled={isSubmitting}
            autoComplete="off"
            name="reply-content"
            id="reply-content"
          />
          <Button
            type="submit"
            disabled={isSubmitting || !newPost.trim()}
            className="w-full md:w-auto"
          >
            {isSubmitting ? "Replying..." : "Reply"}
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
                    {editingPostId === post.id ? (
                      <div className={styles.editActions}>
                        <Button 
                          variant="default"
                          size="sm"
                          onClick={() => handleEdit(post.id)}
                          disabled={isSubmitting}
                        >
                          Save
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPostId(null)
                            setEditingContent("")
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingPostId(post.id)
                            setEditingContent(post.content)
                          }}
                        >
                          Edit
                        </Button>
                        {deletingPostId === post.id ? (
                          <div className={styles.deleteConfirm}>
                            <span className={styles.deleteWarning}>Delete?</span>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(post.id)}
                              disabled={isSubmitting}
                            >
                              Yes
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingPostId(null)}
                            >
                              No
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeletingPostId(post.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {editingPostId === post.id ? (
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className={styles.textarea}
                  disabled={isSubmitting}
                  autoFocus
                />
              ) : (
                <p className={styles.postContent}>{post.content}</p>
              )}

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
    </div>
  )
}