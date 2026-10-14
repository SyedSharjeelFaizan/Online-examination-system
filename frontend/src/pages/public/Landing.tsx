import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Code, BrainCircuit, Activity } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-primary tracking-tight">ExamForge</div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>
            <Link href="/register" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-24 px-6 md:py-32 lg:py-40">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6">
              Rigorous Assessment.<br className="hidden md:block" /> Modern Execution.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              The professional examination platform built for computer science engineering. Features adaptive testing, integrated code environments, and high-fidelity proctoring.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 w-full sm:w-auto">
                Student Registration <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground w-full sm:w-auto">
                Institution Login
              </Link>
            </div>
          </div>
        </section>

        <section className="py-24 bg-card border-t border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="p-6 bg-background rounded-xl border border-border">
                <Code className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Integrated IDE</h3>
                <p className="text-muted-foreground text-sm">Monaco-powered coding environment with instant compilation and automated test case evaluation.</p>
              </div>
              <div className="p-6 bg-background rounded-xl border border-border">
                <BrainCircuit className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Adaptive Difficulty</h3>
                <p className="text-muted-foreground text-sm">Questions scale in complexity based on student performance in real-time.</p>
              </div>
              <div className="p-6 bg-background rounded-xl border border-border">
                <ShieldCheck className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Secure Proctoring</h3>
                <p className="text-muted-foreground text-sm">Strict tab-switch detection and automated violation flagging to ensure exam integrity.</p>
              </div>
              <div className="p-6 bg-background rounded-xl border border-border">
                <Activity className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Deep Analytics</h3>
                <p className="text-muted-foreground text-sm">Comprehensive performance breakdowns, trend tracking, and actionable insights.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="py-8 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} ExamForge. Engineered for Excellence.
        </div>
      </footer>
    </div>
  );
}
