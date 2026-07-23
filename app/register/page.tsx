import { Suspense } from "react"

import { RegisterScreen } from "@/components/register/register-screen"
import { Toaster } from "@/components/ui/sonner"

export const metadata = {
  title: "Register — MyStoreGuard",
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterScreen />
      <Toaster />
    </Suspense>
  )
}
