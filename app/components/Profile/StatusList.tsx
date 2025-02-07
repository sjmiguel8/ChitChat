"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import styles from "./status.module.css"

interface Status {
  id: number
  content: string
  created_at: string
  user_id: string
  user: {
    username: string | null
  }
}

interface StatusListProps {
  userId: string
}

export default function StatusList({ userId }: StatusListProps) {
  const [statuses, setStatuses] = useState<Status[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchStatuses()

    // Set up real-time subscription
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

  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from("status_updates")
        .select('*, user:profiles!status_updates_user_id_fkey(*)')
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setStatuses(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch status updates.",
        variant: "destructive",
      })
      console.error("Error fetching statuses:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (statusId: number) => {
    try {
      const { error } = await supabase
        .from("status_updates")
        .delete()
        .eq("id", statusId)

      if (error) throw error

      toast({
        title: "Status Deleted",
        description: "Your status has been deleted successfully.",
      })
      fetchStatuses()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete status. Please try again.",
        variant: "destructive",
      })
      console.error("Error deleting status:", error)
    }
  }

  if (isLoading) {
    return <div>Loading status updates...</div>
  }

  return (
    <div className={styles.statusList}>
      {statuses.map((status) => (
        <div key={status.id} className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <div className={styles.statusInfo}>
              <span className={styles.username}>
                {status.user?.username || status.user_id}
              </span>
              <span className={styles.timestamp}>
                {format(new Date(status.created_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
            <button
              onClick={() => handleDelete(status.id)}
              className={`${styles.actionButton} ${styles.deleteButton}`}
            >
              Delete
            </button>
          </div>
          <p className={styles.statusContent}>{status.content}</p>
        </div>
      ))}
      {!isLoading && statuses.length === 0 && (
        <p>No status updates yet.</p>
      )}
    </div>
  )
}
