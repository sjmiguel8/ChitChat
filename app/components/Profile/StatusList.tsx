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

  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('status_updates')
        .select(`
          *,
          profiles:user_id (username)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setStatuses(data || [])
    } catch (error) {
      console.error('Error fetching statuses:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch status updates',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatuses()
    
    // Real-time subscription
    const channel = supabase
      .channel('status_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'status_updates',
        filter: `user_id=eq.${userId}`
      }, () => {
        fetchStatuses()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const handleDelete = async (statusId: number) => {
    try {
      const { error } = await supabase
        .from('status_updates')
        .delete()
        .eq('id', statusId)
        .eq('user_id', userId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Status update deleted'
      })
      fetchStatuses()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete status update',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className={styles.statusList}>
      {statuses.map((status) => (
        <div key={status.id} className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <div>
              <p className={styles.content}>{status.content}</p>
              <small className={styles.timestamp}>
                {format(new Date(status.created_at), "MMM d, yyyy 'at' h:mm a")}
              </small>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(status.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
      {!isLoading && statuses.length === 0 && (
        <p className={styles.emptyState}>No status updates yet</p>
      )}
    </div>
  )
}
