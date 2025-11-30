"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Palette, Users, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">E</span>
          </div>
          <span className="text-xl font-bold text-foreground">Excalidraw</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#" className="text-foreground hover:text-primary transition">Features</Link>
          <Link href="#" className="text-foreground hover:text-primary transition">Templates</Link>
          <Link href="#" className="text-foreground hover:text-primary transition">Pricing</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/signin" className="text-foreground hover:text-primary transition text-sm">
            Sign In
          </Link>

          <Link href="/dashboard" className="inline-block">
            <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24 text-center">
        <div className="inline-block mb-6 px-4 py-2 bg-accent/20 rounded-full border border-accent/30">
          <p className="text-sm font-medium text-foreground">✨ Now with AI-powered sketching</p>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
          Express your creativity with infinite canvas
        </h1>

        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
          Draw, design, and collaborate in real-time. Excalidraw is the free, open-source virtual whiteboard for teams.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">

          <Link href="/dashboard" className="w-full sm:w-auto inline-block">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            >
              Start Drawing Free
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>

          <Link href="/dashboard" className="w-full sm:w-auto inline-block">
            <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
              View Demo
            </Button>
          </Link>

        </div>

        {/* Hero Image */}
        <div className="rounded-xl bg-muted border border-border overflow-hidden shadow-xl">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/digital-whiteboard-with-drawings-and-sketches-ZGWPpTfaZopQ0oMIxHnPdgilZvIPuc.jpg"
            alt="Excalidraw canvas with sample drawings"
            className="w-full h-auto rounded-xl border border-border shadow-xl"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-card/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-center">
            Everything you need to create
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Powerful features designed to make your sketching and diagramming effortless and enjoyable.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-background rounded-lg border border-border hover:border-primary/50 transition">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Palette className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Rich Drawing Tools</h3>
              <p className="text-muted-foreground">
                Shapes, connectors, text, and more. Customize colors, opacity, and stroke styles to perfection.
              </p>
            </div>

            <div className="p-6 bg-background rounded-lg border border-border hover:border-primary/50 transition">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Real-Time Collaboration</h3>
              <p className="text-muted-foreground">
                Work together with your team instantly. See changes live as others draw and edit.
              </p>
            </div>

            <div className="p-6 bg-background rounded-lg border border-border hover:border-primary/50 transition">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Optimized performance for smooth drawing. Works seamlessly across all devices and browsers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center bg-primary rounded-xl p-8 sm:p-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
            Ready to create something amazing?
          </h2>

          <p className="text-primary-foreground/80 mb-8 text-lg max-w-2xl mx-auto">
            Join thousands of creators, designers, and teams using Excalidraw every day.
          </p>

          <Link href="/dashboard" className="w-full sm:w-auto inline-block">
            <Button size="lg" className="bg-primary-foreground hover:bg-primary-foreground/90 text-primary w-full sm:w-auto">
              Start Drawing Free
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2025 Excalidraw. Open source and free for everyone.
          </p>

          <div className="flex gap-6">
            <Link href="#" className="text-muted-foreground hover:text-foreground transition text-sm">GitHub</Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition text-sm">Twitter</Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition text-sm">Discord</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
