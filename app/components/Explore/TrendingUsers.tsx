"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function TrendingUsers() {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    fetchTrendingUsers()
  }, [])

  const fetchTrendingUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("followers", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching trending users:", error)
    } else {
      setUsers(data)
    }
  }

  return (
    <div>
      {users.map((user) => (
        <div key={user.id} className="bg-white p-4 rounded-md shadow mb-4">
          <p className="font-bold">{user.username}</p>
          <p className="text-sm text-gray-500">Followers: {user.followers}</p>
        </div>
      ))}
    </div>
  )
}

