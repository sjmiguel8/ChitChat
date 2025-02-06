"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface StatusListProps {
  userId: string
}

export default function StatusList({ userId }: StatusListProps) {
  const [statuses, setStatuses] = useState<any[]>([])

  useEffect(() => {
    fetchStatuses()
  }, [])

  const fetchStatuses = async () => {
    const { data, error } = await supabase
      .from("status_updates")
      .select("*, profiles(username)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching statuses:", error)
    } else {
      setStatuses(data)
    }
  }

  const handleDelete = async (statusId: number) => {
    const { error } = await supabase.from("status_updates").delete().eq("id", statusId)

    if (error) {
      console.error("Error deleting status:", error)
    } else {
      fetchStatuses()
    }
  }

  const handleEdit = async (statusId: number, newContent: string) => {
    const { error } = await supabase.from("status_updates").update({ content: newContent }).eq("id", statusId)

    if (error) {
      console.error("Error updating status:", error)
    } else {
      fetchStatuses()
    }
  }

  return (
    <div className="space-y-4">
      {statuses.map((status) => (
        <div key={status.id} className="bg-white p-4 rounded-md shadow">
          <p className="font-bold">{status.profiles.username}</p>
          <p>{status.content}</p>
          <div className="mt-2 space-x-2">
            <button
              onClick={() => {
                const newContent = prompt("Edit your status:", status.content)
                if (newContent) handleEdit(status.id, newContent)
              }}
              className="text-blue-500 hover:underline"
            >
              Edit
            </button>
            <button onClick={() => handleDelete(status.id)} className="text-red-500 hover:underline">
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

