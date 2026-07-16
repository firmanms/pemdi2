"use client"

import { useState } from "react"
import { Gauge, Eye, EyeOff, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Demo: redirect to dashboard after short delay
    setTimeout(() => {
      window.location.href = "/dashboard"
    }, 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-primary opacity-90" />
      <div className="absolute inset-0 gradient-mesh" />

      {/* Decorative Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-teal-300/10 rounded-full blur-2xl" />

      {/* Login Card */}
      <Card className="relative z-10 w-full max-w-md glass border-white/20 shadow-2xl animate-fade-in">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Logo */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-teal-500/25">
            <Gauge className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Indeks Pemerintah Digital
            </h1>
            <p className="text-sm text-white/70 mt-1">
              Platform Evaluasi Kematangan Digital
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90 text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@instansi.go.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90 text-sm">
                Kata Sandi
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pr-10 focus-visible:ring-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-teal-700 hover:bg-white/90 font-semibold h-10 shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
              ) : (
                <>
                  Masuk
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center">
            <button className="text-xs text-white/50 hover:text-white/80 transition-colors">
              Lupa kata sandi?
            </button>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-white/10 text-center">
            <p className="text-[10px] text-white/40">
              © 2026 Pemerintah Digital Indonesia
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
