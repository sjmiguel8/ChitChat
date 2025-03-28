"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import styles from "./status-update.module.css"

interface Status {
  id: number
  content: string
  created_at: string
  user_id: string
  likes: number
  user?: {
    username: string
  }
}

export default function StatusUpdate({ userId }: { userId: string }) {
  const [statuses, setStatuses] = useState<Status[]>([])
  const [newStatus, setNewStatus] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('status_updates')
        .select(`
          id,
          content,
          created_at,
          user_id,
          likes,
          user:profiles(username)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setStatuses((data as unknown as Status[]) || [])
    } catch (error) {
      console.error('Error fetching statuses:', error)
      toast({
        title: "Error",
        description: "Failed to fetch status updates",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    fetchStatuses()

    const channel = supabase
      .channel('status_updates_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'status_updates',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchStatuses()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStatus.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      // First ensure user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        // Create profile if it doesn't exist
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({ id: userId })

        if (createProfileError) throw createProfileError
      }

      // Now create the status update
      const { error } = await supabase
        .from('status_updates')
        .insert({
          content: newStatus.trim(),
          user_id: userId
        })

      if (error) throw error

      toast({
        title: "Success",
        description: "Status update posted successfully!"
      })
      setNewStatus("")
      fetchStatuses()
    } catch (error) {
      console.error('Error posting status:', error)
      toast({
        title: "Error",
        description: "Failed to post status update. Please try again."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Status Updates</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          placeholder="What's on your mind?"
          className={styles.textarea}
          maxLength={500}
          disabled={isSubmitting}
        />
        <Button type="submit" disabled={isSubmitting || !newStatus.trim()}>
          {isSubmitting ? "Posting..." : "Post Update"}
        </Button>
      </form>

      <div className={styles.statusList}>
        {statuses.map((status) => (
          <div key={status.id} className={styles.statusCard}>
            <p className={styles.statusContent}>{status.content}</p>
            <p className={styles.statusMeta}>
              Posted on {format(new Date(status.created_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        ))}
        {statuses.length === 0 && (
          <p className="text-center text-muted-foreground">No status updates yet</p>
        )}
      </div>
    </div>
  )
}
