import { Container } from "postcss"
import Layout from "./components/Layout/Layout"
import styles from "@/app/page.module.css"

interface HomeProps {
  children: React.ReactNode;
}

export default function Home({ children }: HomeProps) {
  return (
    <Layout>
      <div className="container">
      <h1 className= "Welcome to Debate!">Welcome to Debate!

      </h1>
      <p className= "">Where you can debate about anything and everything!</p>
      <section className={styles.container}>{children}
      </section>
      </div>
    </Layout>
  )
}

