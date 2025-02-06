"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
import { format } from "date-fns"

interface Status {
  id: number
  content: string
  created_at: string
  user_id: string
  profiles: {
    username: string
  }
}

interface StatusListProps {
  userId: string
}

export type StatusListHandle = {
  fetchStatuses: () => Promise<void>
}

const StatusList = forwardRef<StatusListHandle, StatusListProps>(({ userId }, ref) => {
  const [statuses, setStatuses] = useState<Status[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingStatus, setEditingStatus] = useState<Status | null>(null)
  const [editContent, setEditContent] = useState("")
  const [deleteStatus, setDeleteStatus] = useState<Status | null>(null)
  const { toast } = useToast()

  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from("status_updates")
        .select("*, profiles(username)")
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

  useEffect(() => {
    fetchStatuses()
  }, [userId])

  useImperativeHandle(ref, () => ({
    fetchStatuses
  }))

  const handleDelete = async () => {
    if (!deleteStatus) return

    try {
      const { error } = await supabase
        .from("status_updates")
        .delete()
        .eq("id", deleteStatus.id)

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
    } finally {
      setDeleteStatus(null)
    }
  }

  const handleEdit = async () => {
    if (!editingStatus || !editContent.trim()) return

    try {
      const { error } = await supabase
        .from("status_updates")
        .update({ content: editContent.trim() })
        .eq("id", editingStatus.id)

      if (error) throw error

      toast({
        title: "Status Updated",
        description: "Your status has been updated successfully.",
      })
      fetchStatuses()
      setEditingStatus(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      })
      console.error("Error updating status:", error)
    }
  }

  if (isLoading) {
    return <div className="text-center">Loading status updates...</div>
  }

  return (
    <>
      <div className="space-y-4">
        {statuses.map((status) => (
          <div key={status.id} className="bg-white p-4 rounded-md shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold">{status.profiles.username}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(status.created_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingStatus(status)
                    setEditContent(status.content)
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteStatus(status)}
                  className="text-red-500 hover:text-red-600"
                >
                  Delete
                </Button>
              </div>
            </div>
            <p className="whitespace-pre-wrap">{status.content}</p>
          </div>
        ))}
        {statuses.length === 0 && (
          <p className="text-center text-gray-500">No status updates yet.</p>
        )}
      </div>

      <Dialog open={!!editingStatus} onOpenChange={() => setEditingStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Status</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStatus(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteStatus} onOpenChange={() => setDeleteStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your status update.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})

export default StatusList
