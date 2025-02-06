"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function TrendingMessages() {
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    fetchTrendingMessages()
  }, [])

  const fetchTrendingMessages = async () => {
    const { data, error } = await supabase
      .from("status_updates")
      .select("*, profiles(username)")
      .order("likes", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching trending messages:", error)
    } else {
      setMessages(data)
    }
  }

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id} className="bg-white p-4 rounded-md shadow mb-4">
          <p className="font-bold">{message.profiles.username}</p>
          <p>{message.content}</p>
          <p className="text-sm text-gray-500">Likes: {message.likes}</p>
        </div>
      ))}
    </div>
  )
}

