"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Layout from "../components/Layout/Layout"
import { supabase } from "@/lib/supabase"
import MessageList from "../components/Messages/MessageList"
import MessageForm from "../components/Messages/MessageForm"

export default function Messages() {
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [currentConversation, setCurrentConversation] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        fetchConversations(user.id)
      } else {
        router.push("/auth")
      }
    }
    getUser()
  }, [router])

  const fetchConversations = async (userId: string) => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*, profiles!conversations_participant2_id_fkey(username)")
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)

    if (error) {
      console.error("Error fetching conversations:", error)
    } else {
      setConversations(data)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-1/4 border-r">
          <h2 className="text-xl font-bold p-4">Conversations</h2>
          <ul>
            {conversations.map((conversation) => (
              <li
                key={conversation.id}
                className="p-4 hover:bg-gray-100 cursor-pointer"
                onClick={() => setCurrentConversation(conversation)}
              >
                {conversation.profiles.username}
              </li>
            ))}
          </ul>
        </div>
        <div className="w-3/4 flex flex-col">
          {currentConversation ? (
            <>
              <MessageList conversationId={currentConversation.id} />
              <MessageForm conversationId={currentConversation.id} senderId={user.id} />
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-gray-500">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

