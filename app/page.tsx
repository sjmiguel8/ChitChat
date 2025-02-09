import Layout from "./components/Layout/Layout"
import styles from "@/app/page.module.css"
import Link from "next/link"

export default function Home() {
  return (
    <Layout>
      <div className={styles.body}>
        <div className={styles.container}>
          <section id={styles.showcase}>
            <h1>Debate!</h1>
            <p>Where you can debate *about* anything and everything!</p>
            <Link href="/forum">
            <button className={styles.ctaButton}> 
              Go To The Forums
            </button>
            </Link>
          </section>

          <div className={styles.featuresGrid}>
            {/* Forum Feature */}
            <Link href="/forum">
            <div className={styles.featureCard}>
              <h2>Forums</h2>
              <p>
                Join our vibrant community forums to discuss various topics and share your thoughts.
              </p>
            </div>
            </Link>

            {/* Status Updates Feature */}
            <Link href="/profile">
            <div className={styles.featureCard}>
              <h2>Status Updates</h2>
              <p>
                Share your thoughts and opinions with quick status updates.
              </p>
            </div>
            </Link>

            {/* Real-time Feature */}
            <Link href="/messages">
            <div className={styles.featureCard}>
              <h2>Messaging</h2>
              <p>
                Engage in real-time discussions with instant updates and notifications.
              </p>
            </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
