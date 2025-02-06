"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Layout from "../components/Layout/Layout"
import { supabase } from "@/lib/supabase"
import StatusUpdate from "../components/Profile/StatusUpdate"
import StatusList from "../components/Profile/StatusList"
import { useToast } from "@/components/ui/use-toast"

interface Profile {
  id: string
  username: string
  created_at: string
}

export default function Profile() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const statusListRef = useRef<{ fetchStatuses: () => void } | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        
        if (!user) {
          router.push("/auth")
          return
        }

        setUser(user)
        let { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (error) {
          if (error.code === "PGRST116") {
            // Profile doesn't exist, create a new one
            const { data: newProfile, error: insertError } = await supabase
              .from("profiles")
              .insert({ id: user.id, username: user.email?.split("@")[0] })
              .select()
              .single()

            if (insertError) {
              throw insertError
            }
            profile = newProfile
          } else {
            throw error
          }
        }

        setProfile(profile)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load profile. Please try again later.",
          variant: "destructive",
        })
        console.error("Error loading profile:", error)
      } finally {
        setIsLoading(false)
      }
    }
    getUser()
  }, [router, toast])

  const handleStatusCreated = () => {
    statusListRef.current?.fetchStatuses()
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Loading profile...</div>
        </div>
      </Layout>
    )
  }

  if (!user || !profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-red-500">Failed to load profile</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{profile.username}'s Profile</h1>
          <p className="text-gray-500">Member since {new Date(profile.created_at).toLocaleDateString()}</p>
        </div>
        <StatusUpdate userId={user.id} onStatusCreated={handleStatusCreated} />
        <StatusList ref={statusListRef} userId={user.id} />
      </div>
    </Layout>
  )
}
