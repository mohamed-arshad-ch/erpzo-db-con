"use client"

import { useState } from "react"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LoginForm from "./login-form"
import SignupForm from "./signup-form"
import ForgotPasswordForm from "./forgot-password-form"
import SocialAuth from "./social-auth"

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login")

  return (
    <div className="flex min-h-screen flex-col-reverse md:flex-row">
      {/* Left side - Branding & Illustration (hidden on small screens) */}
      <div className="hidden bg-blue-50 px-8 py-12 md:flex md:w-1/2 md:flex-col md:justify-between">
        <div className="flex items-center">
          <div className="mr-2 h-8 w-8 rounded-md bg-blue-600"></div>
          <span className="text-xl font-bold text-blue-600">AppName</span>
        </div>
        <div className="mx-auto max-w-md">
          <h1 className="mb-6 text-4xl font-bold text-gray-900">Welcome to our platform</h1>
          <p className="mb-8 text-lg text-gray-600">
            Manage your business efficiently with our powerful tools and intuitive interface.
          </p>
          <div className="relative h-64 w-full md:h-80">
            <Image
              src="/placeholder.svg?height=400&width=400"
              alt="Authentication illustration"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        <div></div> {/* Spacer */}
      </div>

      {/* Right side - Auth Forms */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-4 py-12 md:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center md:hidden">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-600">
              <div className="h-8 w-8 rounded-md bg-white"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">AppName</h1>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-8 grid w-full grid-cols-3">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="forgot">Reset</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm />
              </TabsContent>

              <TabsContent value="signup">
                <SignupForm />
              </TabsContent>

              <TabsContent value="forgot">
                <ForgotPasswordForm />
              </TabsContent>
            </Tabs>

            <div className="my-6 flex items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="mx-4 flex-shrink text-gray-400">OR</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <SocialAuth />
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">Powered by Supabase</div>
        </div>
      </div>
    </div>
  )
}

