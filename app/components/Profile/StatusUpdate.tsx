"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

interface StatusUpdateProps {
  userId: string
}

export default function StatusUpdate({ userId }: StatusUpdateProps) {
  const [content, setContent] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    const { error } = await supabase.from("status_updates").insert({ user_id: userId, content })

    if (error) {
      console.error("Error creating status update:", error)
    } else {
      setContent("")
      // You might want to refresh the status list here
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full p-2 border rounded-md"
        rows={3}
      />
      <button type="submit" className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
        Post Update
      </button>
    </form>
  )
}

