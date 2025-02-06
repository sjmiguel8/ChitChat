"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Layout from "@/app/components/Layout/Layout"
import { supabase } from "@/lib/supabase"
import ForumPosts from "@/app/components/Forum/ForumPosts"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

interface Forum {
  id: number
  name: string
  description: string
  created_at: string
  created_by: string
  profiles: {
    username: string
  }
}

export default function ForumPage({ params }: { params: { id: string } }) {
  const [forum, setForum] = useState<Forum | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

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

  useEffect(() => {
    const fetchForum = async () => {
      try {
        const { data, error } = await supabase
          .from("forums")
          .select(`
            *,
            profiles (username)
          `)
          .eq("id", params.id)
          .single()

        if (error) throw error
        if (!data) {
          toast({
            title: "Error",
            description: "Forum not found.",
            variant: "destructive",
          })
          router.push("/forum")
          return
        }

        setForum(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch forum details.",
          variant: "destructive",
        })
        console.error("Error fetching forum:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchForum()
  }, [params.id, router, toast])

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Loading forum...</div>
        </div>
      </Layout>
    )
  }

  if (!forum) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-red-500">Forum not found</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex flex-col space-y-4">
          <Button
            variant="ghost"
            className="w-fit"
            onClick={() => router.push("/forum")}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Forums
          </Button>

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/forum">Forums</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{forum.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{forum.name}</CardTitle>
            <CardDescription>
              Created by {forum.profiles.username} on{" "}
              {format(new Date(forum.created_at), "MMM d, yyyy")}
            </CardDescription>
            <p className="mt-2 text-gray-600">{forum.description}</p>
          </CardHeader>
        </Card>

        {user && <ForumPosts forumId={forum.id} userId={user.id} />}
      </div>
    </Layout>
  )
}
