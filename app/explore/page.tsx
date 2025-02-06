"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Layout from "../components/Layout/Layout"
import { supabase } from "@/lib/supabase"
import TrendingMessages from "../components/Explore/TrendingMessages"
import TrendingUsers from "../components/Explore/TrendingUsers"

export default function Explore() {
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"messages" | "users">("messages")
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      } else {
        router.push("/auth")
      }
    }
    getUser()
  }, [router])

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Explore</h1>
        <div className="mb-4">
          <button
            className={`mr-4 ${activeTab === "messages" ? "font-bold" : ""}`}
            onClick={() => setActiveTab("messages")}
          >
            Trending Messages
          </button>
          <button className={activeTab === "users" ? "font-bold" : ""} onClick={() => setActiveTab("users")}>
            Trending Users
          </button>
        </div>
        {activeTab === "messages" ? <TrendingMessages /> : <TrendingUsers />}
      </div>
    </Layout>
  )
}

