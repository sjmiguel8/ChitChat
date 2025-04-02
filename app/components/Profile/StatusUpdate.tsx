"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import styles from "./status.module.css"
import { format } from "date-fns"

interface StatusUpdateProps {
  userId: string
}

export default function StatusUpdate({ userId }: StatusUpdateProps) {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [statuses, setStatuses] = useState<any[]>([])
  const { toast } = useToast()

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
            <p className={styles.content}>{status.content}</p>
            <small className={styles.timestamp}>
              {format(new Date(status.created_at), "MMM d, yyyy 'at' h:mm a")}
            </small>
          </div>
        ))}
      </div>
    </div>
  )
}
