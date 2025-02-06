"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Layout from "../components/Layout/Layout"
import { supabase } from "@/lib/supabase"
import StatusUpdate from "../components/Profile/StatusUpdate"
import StatusList from "../components/Profile/StatusList"

export default function Profile() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        let { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) {
          if (error.code === "PGRST116") {
            // Profile doesn't exist, create a new one
            const { data: newProfile, error: insertError } = await supabase
              .from("profiles")
              .insert({ id: user.id, username: user.email?.split("@")[0] })
              .select()
              .single()

            if (insertError) {
              console.error("Error creating profile:", insertError)
            } else {
              profile = newProfile
            }
          } else {
            console.error("Error fetching profile:", error)
          }
        }

        setProfile(profile)
      } else {
        router.push("/auth")
      }
    }
    getUser()
  }, [router])

  if (!user || !profile) {
    return <div>Loading...</div>
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{profile.username}'s Profile</h1>
        <StatusUpdate userId={user.id} />
        <StatusList userId={user.id} />
      </div>
    </Layout>
  )
}

