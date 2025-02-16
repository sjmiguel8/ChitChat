"use client"

import { useState, useEffect } from "react"
import { useUser } from "../lib/hooks"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import Layout from "../components/Layout/Layout"
import { format } from "date-fns"
import styles from "./messages.module.css"

interface Conversation {
  id: number
  participant1_id: string
  participant2_id: string
  participant: {
    username: string | null
  }
  last_message?: string
  updated_at: string
}

interface Message {
  id: number
  content: string
  sender_id: string
  created_at: string
}

export default function MessagesPage() {
  const { user } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user])

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id)
      
      // Set up real-time subscription for messages
      const channel = supabase
        .channel(`messages:${activeConversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${activeConversation.id}`
          },
          () => {
            fetchMessages(activeConversation.id)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [activeConversation])

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant:profiles!conversations_participant2_id_fkey(username)
        `)
        .or(`participant1_id.eq.${user?.id},participant2_id.eq.${user?.id}`)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setConversations(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      })
    }
  }

  const fetchMessages = async (conversationId: number) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      })
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversation) return

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversation.id,
          content: newMessage.trim(),
          sender_id: user?.id
        })

      if (error) throw error
      setNewMessage("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    return <Layout>Please sign in to view messages.</Layout>
  }

  return (
    <Layout>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Messages</h1>
        </header>

        <div className={styles.grid}>
          <aside className={styles.sidebar}>
            <div className={styles.conversationList}>
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`${styles.conversationItem} ${
                    activeConversation?.id === conv.id ? styles.activeConversation : ""
                  }`}
                  onClick={() => setActiveConversation(conv)}
                >
                  <div>{conv.participant.username}</div>
                  <small className="text-gray-500">
                    {format(new Date(conv.updated_at), "MMM d, yyyy")}
                  </small>
                </div>
              ))}
            </div>
          </aside>

          <div className={styles.chatContainer}>
            {activeConversation ? (
              <>
                <div className={styles.messageList}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`${styles.message} ${
                        message.sender_id === user.id
                          ? styles.sentMessage
                          : styles.receivedMessage
                      }`}
                    >
                      {message.content}
                    </div>
                  ))}
                </div>
                <form onSubmit={sendMessage} className={styles.messageInput}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className={styles.input}
                  />
                  <button
                    type="submit"
                    className={styles.sendButton}
                    disabled={!newMessage.trim()}
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center text-gray-500 mt-8">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
