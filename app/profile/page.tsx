"use client"

import { useUser } from "../lib/hooks"
import Layout from "../components/Layout/Layout"
import StatusList from "../components/Profile/StatusList"
import StatusUpdate from "../components/Profile/StatusUpdate"
import styles from "./profile.module.css"

export default function ProfilePage() {
  const { user } = useUser()

  if (!user) {
    return (
      <Layout>
        <div className="container">
          <p>Please log in to view your profile.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
        <StatusUpdate userId={user.id} />
      </div>
    </Layout>
  )
}
