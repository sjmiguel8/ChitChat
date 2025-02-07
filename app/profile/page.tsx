"use client"

import { useUser } from "../lib/hooks"
import Layout from "../components/Layout/Layout"
import StatusList from "../components/Profile/StatusList"
import StatusUpdate from "../components/Profile/StatusUpdate"
import styles from "./profile.module.css"

export default function ProfilePage() {
  const { user } = useUser()

  if (!user) {
    return <Layout>Please sign in to view your profile.</Layout>
  }

  return (
    <Layout>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Your Profile</h1>
          <p className={styles.description}>
            Manage your profile and view your activity.
          </p>
        </header>

        <div className={styles.grid}>
          <aside className={styles.sidebar}>
            <div className={styles.profileInfo}>
              <div className={styles.avatar}>
                {user.email?.[0].toUpperCase()}
              </div>
              <h2 className={styles.username}>
                {user.email?.split("@")[0]}
              </h2>
              <p className={styles.email}>{user.email}</p>
            </div>

            <div className={styles.stats}>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>0</div>
                <div className={styles.statLabel}>Forums</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>0</div>
                <div className={styles.statLabel}>Posts</div>
              </div>
            </div>
          </aside>

          <div className={styles.content}>
            <section>
              <h2 className={styles.sectionTitle}>Your Status Updates</h2>
              <StatusUpdate userId={user.id} />
              <div className="mt-6">
                <StatusList userId={user.id} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  )
}
