import Layout from "./components/Layout/Layout"
import styles from "@/app/page.module.css"
import Link from "next/link"

export default function Home() {
  return (
    <Layout>
      <div className={styles.body}>
        <div className={styles.container}>
          <section id={styles.showcase}>
            <h1>Welcome to Debate!</h1>
            <p>Where you can debate about anything and everything!</p>
          </section>

          <div className={styles.featuresGrid}>
            {/* Forum Feature */}
            <div className={styles.featureCard}>
              <h2>Forum Discussions</h2>
              <p>
                Join our vibrant community forums to discuss various topics and share your thoughts.
              </p>
            </div>

            {/* Status Updates Feature */}
            <div className={styles.featureCard}>
              <h2>Status Updates</h2>
              <p>
                Share your thoughts and opinions with quick status updates.
              </p>
            </div>

            {/* Real-time Feature */}
            <div className={styles.featureCard}>
              <h2>Real-time Interaction</h2>
              <p>
                Engage in real-time discussions with instant updates and notifications.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className={styles.cta}>
            <h2>Ready to Start Debating?</h2>
            <p>Join our community and be part of engaging discussions.</p>
            <Link href="/auth">
              <button className={styles.ctaButton}>
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
