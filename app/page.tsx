"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";
import {
  Sparkles,
  Scan,
  Zap,
  Target,
  Droplets,
  Wind,
  Users,
  Award,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Star,
  Play,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export default function Home() {
  const serviceCards = [
    {
      href: "/services",
      icon: Target,
      iconBg: "from-teal-50 to-teal-100",
      iconColor: "text-teal-600",
      title: "Acne Treatment",
      description:
        "Medical-grade protocols combining peels, lasers, and prescription treatments to clear breakouts and prevent scarring.",
    },
    {
      href: "/services",
      icon: Droplets,
      iconBg: "from-amber-50 to-amber-100",
      iconColor: "text-amber-600",
      title: "Pigmentation",
      description:
        "Advanced treatments for melasma, sun damage, and uneven skin tone using cutting-edge laser technology.",
    },
    {
      href: "/services",
      icon: Sparkles,
      iconBg: "from-purple-50 to-purple-100",
      iconColor: "text-purple-600",
      title: "Wrinkles & Anti-Aging",
      description:
        "Non-surgical solutions including injectables, threads, and collagen-boosting therapies for natural, youthful results.",
    },
    {
      href: "/services",
      icon: Wind,
      iconBg: "from-emerald-50 to-emerald-100",
      iconColor: "text-emerald-600",
      title: "Hair Loss & Scalp Health",
      description:
        "Trichology-focused care combining medical treatments and regenerative therapies for hair fall and thinning.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-600/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">
              SkinFit
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-teal-600 transition-colors hover:text-teal-700"
            >
              Home
            </Link>
            <Link
              href="/services"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-teal-600"
            >
              Services
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-teal-600"
            >
              Blog/Education
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-teal-600"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-teal-600"
            >
              Contact
            </Link>
          </div>

          <Link href="/login">
            <Button size="md" variant="primary">
              Patient Login
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section - Full Screen with Aurora Background */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Aurora Background - Animated Gradient Orbs */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Base dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

          {/* Orb 1 - Teal */}
          <motion.div
            className="absolute -left-32 -top-32 h-[600px] w-[600px] rounded-full opacity-60"
            style={{
              background: "radial-gradient(circle, rgba(20, 184, 166, 0.5) 0%, rgba(20, 184, 166, 0.15) 50%, transparent 70%)",
            }}
            animate={{
              x: [0, 80, -40, 0],
              y: [0, -60, 50, 0],
              scale: [1, 1.3, 0.9, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Orb 2 - Cyan */}
          <motion.div
            className="absolute -right-48 top-1/4 h-[500px] w-[500px] rounded-full opacity-50"
            style={{
              background: "radial-gradient(circle, rgba(34, 211, 238, 0.5) 0%, rgba(34, 211, 238, 0.2) 40%, transparent 70%)",
            }}
            animate={{
              x: [0, -100, 60, 0],
              y: [0, 70, -30, 0],
              scale: [1.1, 0.85, 1.2, 1.1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Orb 3 - Deep slate/blue */}
          <motion.div
            className="absolute bottom-0 left-1/3 h-[550px] w-[550px] rounded-full opacity-40"
            style={{
              background: "radial-gradient(circle, rgba(30, 58, 138, 0.4) 0%, rgba(51, 65, 85, 0.2) 45%, transparent 70%)",
            }}
            animate={{
              x: [0, 50, -80, 0],
              y: [0, -90, 40, 0],
              scale: [0.9, 1.15, 1, 0.9],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Orb 4 - Teal accent */}
          <motion.div
            className="absolute right-1/4 -top-20 h-[400px] w-[400px] rounded-full opacity-45"
            style={{
              background: "radial-gradient(circle, rgba(20, 184, 166, 0.45) 0%, rgba(6, 182, 212, 0.2) 50%, transparent 70%)",
            }}
            animate={{
              x: [0, -60, 90, 0],
              y: [0, 50, -70, 0],
              scale: [1.2, 0.95, 1.1, 1.2],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Glass Aurora Overlay - diffuses colors smoothly */}
        <div className="absolute inset-0 z-[1] backdrop-blur-[100px]" />

        {/* Subtle dark tint for contrast */}
        <div className="absolute inset-0 z-[2] bg-slate-950/30" />

        {/* Content */}
        <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 py-24 text-white">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur"
            >
              <Sparkles className="h-4 w-4" />
              AI-Powered Dermatology
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-7xl [text-shadow:0_2px_40px_rgba(0,0,0,0.5)]"
            >
              Personalized Skincare,
              <span className="text-teal-300"> Powered by AI</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-10 text-lg text-white/90 md:text-xl"
            >
              Experience the future of dermatology with our cutting-edge AI skin
              analysis. Get personalized treatment plans backed by medical expertise
              and advanced technology.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <Button
                size="lg"
                className="border-white/20 bg-white text-teal-700 shadow-lg hover:bg-white/90"
              >
                <Scan className="mr-2 h-5 w-5" />
                Start Free Scan
              </Button>
              <button className="flex items-center gap-2 text-sm font-medium text-white/90 transition-colors hover:text-white">
                <Play className="h-5 w-5" />
                Watch Demo
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-8"
            >
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-300" />
                <span className="text-sm text-white/80">10,000+ Patients</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-teal-300" />
                <span className="text-sm text-white/80">AI Board Certified</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Skin Analysis Tutorial Section */}
      <motion.section
        className="py-20"
        {...fadeInUp}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">
              How Our AI Scan Works
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Our advanced AI technology analyzes your skin in seconds, detecting
              issues and providing personalized recommendations.
            </p>
          </div>

          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-xl">
              <div className="aspect-video">
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-teal-500/10 to-slate-100">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
                      <Play className="h-10 w-10 text-teal-600" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      AI Skin Analysis Tutorial
                    </p>
                    <p className="text-xs text-slate-500">Watch how it works (2:30)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-slate-900">
                Get Your Skin Score in 60 Seconds
              </h3>
              <p className="text-slate-600">
                Our AI analyzes multiple skin parameters to give you a comprehensive
                understanding of your skin health:
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                    <Target className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      Acne & Blemishes Detection
                    </h4>
                    <p className="text-sm text-slate-600">
                      Identify problem areas and track improvement over time
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                    <Droplets className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      Pigmentation Analysis
                    </h4>
                    <p className="text-sm text-slate-600">
                      Map dark spots, sun damage, and uneven skin tone
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                    <Wind className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      Fine Lines & Wrinkles
                    </h4>
                    <p className="text-sm text-slate-600">
                      Measure aging signs and recommend preventive care
                    </p>
                  </div>
                </div>
              </div>

              <Button size="lg" className="w-full shadow-lg shadow-teal-600/20 md:w-auto">
                <Zap className="mr-2 h-5 w-5" />
                Start Analysis Now
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Services Overview */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">
              Comprehensive Skin Treatments
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Evidence-based solutions for every skin concern, personalized to your
              unique needs.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {serviceCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link
                    href={card.href}
                    className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-teal-600/10"
                  >
                    <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                      <ChevronRight className="h-5 w-5 text-teal-600" />
                    </div>
                    <div
                      className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.iconBg}`}
                    >
                      <Icon className={`h-7 w-7 ${card.iconColor}`} />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-slate-900">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-600">{card.description}</p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <motion.section
        className="py-20"
        {...fadeInUp}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">
              Real Results, Real Stories
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              See the transformations our patients have achieved with personalized AI
              skin care.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
              <div className="grid grid-cols-2">
                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 p-4">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Before
                      </p>
                      <div className="text-4xl text-slate-400">📸</div>
                    </div>
                  </div>
                </div>
                <div className="aspect-square bg-gradient-to-br from-teal-50 to-teal-100 p-4">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
                        After
                      </p>
                      <div className="text-4xl text-teal-500">✨</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-3 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="mb-4 text-slate-700">
                  &quot;The AI skin analysis was spot-on! Within 3 months of following Dr.
                  Ruby Sachdev&apos;s treatment plan, my acne cleared up completely. I finally have
                  the confidence I&apos;ve been looking for.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Priya Sharma</p>
                    <p className="text-sm text-slate-500">Acne Treatment Patient</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
              <div className="grid grid-cols-2">
                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 p-4">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Before
                      </p>
                      <div className="text-4xl text-slate-400">📸</div>
                    </div>
                  </div>
                </div>
                <div className="aspect-square bg-gradient-to-br from-teal-50 to-teal-100 p-4">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
                        After
                      </p>
                      <div className="text-4xl text-teal-500">✨</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-3 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="mb-4 text-slate-700">
                  &quot;I was skeptical about AI diagnosis, but the detailed analysis helped
                  Dr. Ruby Sachdev create a perfect anti-aging plan for me. My skin looks 10
                  years younger!&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Anjali Mehta</p>
                    <p className="text-sm text-slate-500">
                      Anti-Aging Treatment Patient
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Doctor's Profile - Dr. Ruby Sachdev */}
      <motion.section
        className="bg-gradient-to-br from-teal-600 to-teal-700 py-20 text-white"
        {...fadeInUp}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-[1fr_2fr]">
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-white/20 blur-2xl" />
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border-4 border-white/20 bg-gradient-to-br from-white/10 to-white/5 shadow-2xl">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                      <Award className="h-12 w-12 text-white" />
                    </div>
                    <p className="text-sm font-medium text-white/90">
                      Dr. Ruby Sachdev&apos;s Photo
                    </p>
                    <p className="text-xs text-white/70">Professional Headshot</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-teal-200">
                  Meet Your Dermatologist
                </p>
                <h2 className="mb-4 text-4xl font-bold">Dr. Ruby Sachdev</h2>
                <p className="text-lg text-teal-50">
                  MD, Board Certified Dermatologist • AI Skincare Pioneer
                </p>
              </div>

              <div className="space-y-4 text-white/90">
                <p className="text-lg leading-relaxed">
                  With over 15 years of clinical experience and a passion for
                  technology, Dr. Ruby Sachdev combines traditional dermatology with
                  cutting-edge AI diagnostics to deliver exceptional results.
                </p>
                <p className="leading-relaxed">
                  She completed her medical training at AIIMS Delhi and specialized in
                  aesthetic dermatology at Harvard Medical School. Dr. Ruby Sachdev has treated
                  over 10,000 patients and pioneered several AI-assisted treatment
                  protocols now used across India.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-3xl font-bold">15+</p>
                  <p className="text-sm text-teal-100">Years Experience</p>
                </div>
                <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-3xl font-bold">10K+</p>
                  <p className="text-sm text-teal-100">Happy Patients</p>
                </div>
                <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-3xl font-bold">50+</p>
                  <p className="text-sm text-teal-100">Awards & Papers</p>
                </div>
              </div>

              <Button
                size="lg"
                variant="secondary"
                className="border-white/20 bg-white text-teal-700 hover:bg-white/90"
              >
                Book Consultation
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Global Footer */}
      <motion.footer
        className="border-t border-slate-200 bg-slate-900 py-12 text-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold">SkinFit</span>
              </div>
              <p className="text-sm text-slate-400">
                Advanced AI-powered dermatology clinic offering personalized skincare
                solutions.
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Quick Links</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link href="/services" className="hover:text-teal-400">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-teal-400">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-teal-400">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-teal-400">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Treatments</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Acne Treatment</li>
                <li>Pigmentation</li>
                <li>Anti-Aging</li>
                <li>Hair Loss</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Contact Us</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-teal-400" />
                  <span>+91 98765 43210</span>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-teal-400" />
                  <span>hello@skinfit.clinic</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-teal-400" />
                  <span>123 Medical Plaza, Bangalore, Karnataka 560001</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            <p>
              © {new Date().getFullYear()} SkinFit Clinic. All rights reserved. |
              Privacy Policy | Terms of Service
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
