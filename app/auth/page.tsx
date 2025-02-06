"use client"

import { useState } from "react"
import Layout from "../components/Layout/Layout"
import Login from "../components/Auth/Login"
import Register from "../components/Auth/Register"

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">{isLogin ? "Log In" : "Register"}</h2>
        {isLogin ? <Login /> : <Register />}
        <p className="mt-4 text-center">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-600 hover:text-indigo-500">
            {isLogin ? "Register" : "Log In"}
          </button>
        </p>
      </div>
    </Layout>
  )
}

