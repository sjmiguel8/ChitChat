"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

interface CreateForumFormProps {
  userId: string
  onForumCreated?: () => void
}

export default function CreateForumForm({ userId, onForumCreated }: CreateForumFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !description.trim() || isLoading) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("forums")
        .insert({
          name: name.trim(),
          description: description.trim(),
          created_by: userId,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Success",
        description: "Forum created successfully!",
      })
      
      onForumCreated?.()
      router.push('/forum') // Redirect to forums page
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create forum",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Forum Name</Label>
        <Input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter forum name"
          disabled={isLoading}
          required
          maxLength={100}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter forum description"
          className="min-h-[100px]"
          disabled={isLoading}
          required
          maxLength={500}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || !name.trim() || !description.trim()}>
          {isLoading ? "Creating..." : "Create Forum"}
        </Button>
      </div>
    </form>
  )
}
