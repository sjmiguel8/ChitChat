"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface StatusUpdateProps {
  userId: string
  onStatusCreated?: () => void
}

export default function StatusUpdate({ userId, onStatusCreated }: StatusUpdateProps) {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("status_updates").insert({ user_id: userId, content: content.trim() })

      if (error) throw error

      setContent("")
      toast({
        title: "Status Updated",
        description: "Your status has been posted successfully!",
      })
      onStatusCreated?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post status update. Please try again.",
        variant: "destructive",
      })
      console.error("Error creating status update:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className="min-h-[100px]"
        disabled={isLoading}
      />
      <Button type="submit" disabled={isLoading || !content.trim()}>
        {isLoading ? "Posting..." : "Post Update"}
      </Button>
    </form>
  )
}
