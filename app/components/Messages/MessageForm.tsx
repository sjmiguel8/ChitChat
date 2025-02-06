"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

interface MessageFormProps {
  conversationId: string
  senderId: string
}

export default function MessageForm({ conversationId, senderId }: MessageFormProps) {
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: senderId, content: message })

    if (error) {
      console.error("Error sending message:", error)
    } else {
      setMessage("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow p-2 border rounded-l-md"
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600">
          Send
        </button>
      </div>
    </form>
  )
}

