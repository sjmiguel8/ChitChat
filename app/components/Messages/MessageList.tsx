"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface MessageListProps {
  conversationId: string
}

export default function MessageList({ conversationId }: MessageListProps) {
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    fetchMessages()
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, handleNewMessage)
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [conversationId])

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*, profiles(username)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching messages:", error)
    } else {
      setMessages(data)
    }
  }

  const handleNewMessage = (payload: any) => {
    setMessages((prevMessages) => [...prevMessages, payload.new])
  }

  return (
    <div className="flex-grow overflow-y-auto p-4">
      {messages.map((message) => (
        <div key={message.id} className="mb-4">
          <p className="font-bold">{message.profiles.username}</p>
          <p>{message.content}</p>
        </div>
      ))}
    </div>
  )
}

