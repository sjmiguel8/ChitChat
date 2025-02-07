"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import styles from "./status.module.css"

interface StatusUpdateProps {
  userId: string
}

export default function StatusUpdate({ userId }: StatusUpdateProps) {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isLoading) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("status_updates").insert({
        content: content.trim(),
        user_id: userId,
      })

      if (error) throw error

      toast({
        title: "Status Updated",
        description: "Your status has been posted successfully!",
      })
      setContent("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to post status. Please try again.",
        variant: "destructive",
      })
      console.error("Error posting status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.updateForm}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className={styles.textarea}
        disabled={isLoading}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading || !content.trim()}
        >
          {isLoading ? "Posting..." : "Post Update"}
        </button>
      </div>
    </form>
  )
}
