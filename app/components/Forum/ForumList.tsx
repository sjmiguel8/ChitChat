"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function ForumList() {
  const [forums, setForums] = useState<any[]>([])

  useEffect(() => {
    fetchForums()
  }, [])

  const fetchForums = async () => {
    const { data, error } = await supabase.from("forums").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching forums:", error)
    } else {
      setForums(data)
    }
  }

  return (
    <div className="mt-8">
      {forums.map((forum) => (
        <div key={forum.id} className="bg-white p-4 rounded-md shadow mb-4">
          <Link href={`/forum/${forum.id}`} className="text-xl font-bold hover:underline">
            {forum.name}
          </Link>
          <p className="text-gray-600">{forum.description}</p>
        </div>
      ))}
    </div>
  )
}

