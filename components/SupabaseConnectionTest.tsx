"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<string>("Checking...")

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase.from("profiles").select("count", { count: "exact" })
        if (error) throw error
        setConnectionStatus("Connected successfully!")
      } catch (error) {
        console.error("Error connecting to Supabase:", error)
        setConnectionStatus("Connection failed. Check console for details.")
      }
    }

    testConnection()
  }, [])

  return <p>{connectionStatus}</p>
}

