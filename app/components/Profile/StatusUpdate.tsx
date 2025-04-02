"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import styles from "./status.module.css"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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

interface StatusUpdateProps {
  userId: string
  username?: string
}

export default function StatusUpdate({ userId, username }: StatusUpdateProps) {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [statuses, setStatuses] = useState<any[]>([])
  const { toast } = useToast()
  const [editingStatus, setEditingStatus] = useState<any>(null)
  const [editContent, setEditContent] = useState("")
  const [deleteStatus, setDeleteStatus] = useState<any>(null)

  const fetchStatusUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from('status_updates')
        .select(`
          *,
          profiles!status_updates_user_id_fkey(username)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setStatuses(data || [])
    } catch (error) {
      console.error('Error fetching status updates:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch status updates',
        variant: 'destructive'
      })
    }
  }

  useEffect(() => {
    fetchStatusUpdates()

    // Set up real-time subscription
    const channel = supabase
      .channel('user_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'status_updates',
        filter: `user_id=eq.${userId}`
      }, () => {
        fetchStatusUpdates()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isLoading) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("status_updates").insert({
        content: content.trim(),
        user_id: userId,
      })

      if (error) throw error

      toast({
        title: "Status Updated",
        description: "Your status has been posted successfully!",
      })
      setContent("")
      fetchStatusUpdates() // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to post status. Please try again.",
        variant: "destructive",
      })
      console.error("Error posting status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editingStatus || !editContent.trim() || isLoading) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("status_updates")
        .update({ content: editContent.trim() })
        .eq("id", editingStatus.id)
        .eq("user_id", userId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Status update edited successfully!"
      })
      setEditingStatus(null)
      fetchStatusUpdates()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to edit status update",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteStatus || isLoading) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("status_updates")
        .delete()
        .eq("id", deleteStatus.id)
        .eq("user_id", userId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Status update deleted successfully!"
      })
      setDeleteStatus(null)
      fetchStatusUpdates()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete status update",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className={styles.updateForm}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className={styles.textarea}
          disabled={isLoading}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading || !content.trim()}
          >
            {isLoading ? "Posting..." : "Post Update"}
          </button>
        </div>
      </form>
      
      <div className={styles.statusList}>
        {statuses.map((status) => (
          <div key={status.id} className={styles.statusCard}>
            <div className={styles.statusHeader}>
              <div className={styles.userInfo}>
                <span className={styles.username}>{status.profiles?.username || 'Unknown'}</span>
                <span className={styles.timestamp}>
                  {format(new Date(status.created_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              {status.user_id === userId && (
                <div className={styles.actions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingStatus(status)
                      setEditContent(status.content)
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteStatus(status)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
            <p className={styles.content}>{status.content}</p>
          </div>
        ))}
      </div>

      {/* Add Edit Dialog */}
      <Dialog open={!!editingStatus} onOpenChange={() => setEditingStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Status Update</DialogTitle>
            <DialogDescription>
              Make changes to your status update below.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className={styles.textarea}
            disabled={isLoading}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStatus(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Delete Dialog */}
      <AlertDialog open={!!deleteStatus} onOpenChange={() => setDeleteStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Status Update</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your status update.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
