"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function SearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", `%${query}%`)
      .limit(5)

    if (error) {
      console.error("Error searching profiles:", error)
    } else {
      setResults(data)
    }
  }

  return (
    <div className="relative">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users..."
          className="w-full p-2 border rounded-md"
        />
      </form>
      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
          {results.map((profile) => (
            <div
              key={profile.id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                router.push(`/profile/${profile.id}`)
                setResults([])
                setQuery("")
              }}
            >
              {profile.username}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

