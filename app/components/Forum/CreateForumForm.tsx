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
      // First ensure user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        // Create profile if it doesn't exist
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({ 
            id: userId,
            username: `user_${userId.slice(0, 8)}` // Fallback username
          })

        if (createProfileError) {
          console.error('Profile creation error:', createProfileError)
          throw new Error(`Failed to create profile: ${createProfileError.message}`)
        }
      }

      const { data, error } = await supabase
        .from('forums')
        .insert({
          name: name.trim(),
          description: description.trim(),
          created_by: userId,
          created_at: new Date().toISOString()
        })
        .select('*')
        .single()

      if (error) {
        console.error('Forum creation error:', error)
        throw new Error(`Failed to create forum: ${error.message}`)
      }

      if (!data) {
        throw new Error('No data returned from forum creation')
      }

      toast({
        title: "Success",
        description: "Forum created successfully!"
      })

      setName("")
      setDescription("")
      onForumCreated?.()
      
      // Navigate to the new forum
      router.push(`/forum/${data.id}`)
    } catch (error) {
      console.error("Error creating forum:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create forum. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as any);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="forum-name">Forum Name</Label>
        <Input
          id="forum-name"
          name="forum-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter forum name"
          className="text-foreground placeholder:text-muted-foreground bg-background"
          disabled={isLoading}
          required
          maxLength={100}
          autoComplete="off"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="forum-description">Description</Label>
        <Textarea
          id="forum-description" 
          name="forum-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter forum description"
          className="min-h-[100px] text-foreground placeholder:text-muted-foreground bg-background"
          disabled={isLoading}
          required
          maxLength={500}
          autoComplete="off"
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
