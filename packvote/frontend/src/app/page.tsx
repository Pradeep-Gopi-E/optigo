import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Users, Brain, Vote, MessageCircle, Star, Shield, Zap, ArrowUpRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">PackVote</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
              How It Works
            </Link>
            <Link href="/auth/register" className="btn btn-primary">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Plan Group Trips with
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI-Powered Decisions
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            The smart way to plan group travel. Collect preferences, get AI recommendations,
            and decide fairly with ranked-choice voting.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/auth/register"
              className="group btn btn-primary btn-lg inline-flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              Start Planning Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/auth/login"
              className="btn btn-outline btn-lg"
            >
              Sign In
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex items-center justify-center space-x-8 mt-12 text-sm text-gray-600"
          >
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-green-500 mr-2" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-5 h-5 text-blue-500 mr-2" />
              <span>Instant Results</span>
            </div>
            <div className="flex items-center">
              <Star className="w-5 h-5 text-yellow-500 mr-2" />
              <span>Free Forever</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex items-center space-x-6 bg-white/80 backdrop-blur rounded-full px-6 py-3 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full border-2 border-white"
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-700">Join 1,000+ happy travelers</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
              ))}
              <span className="text-sm font-medium text-gray-700 ml-2">4.9/5 rating</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for Perfect Group Trips
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features that make group travel planning simple, fair, and fun
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl p-8 transform hover:-translate-y-2 transition-all duration-200"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How PackVote Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Simple 4-step process from planning to decision
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
                )}
                <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-4 mx-auto">
                    {index + 1}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Plan Your Perfect Group Trip?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of travelers who use PackVote for fair and fun group planning
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center btn btn-lg bg-white text-primary hover:bg-gray-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              Start Planning Free
              <ArrowUpRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">PackVote</span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400">© 2024 PackVote. Making group travel planning better.</p>
              <p className="text-sm text-gray-500 mt-1">Built with ❤️ for travel enthusiasts</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: Brain,
    title: "AI Recommendations",
    description: "Get personalized destination suggestions powered by advanced AI that considers everyone's preferences."
  },
  {
    icon: Vote,
    title: "Fair Voting",
    description: "Ranked-choice voting ensures every voice is heard and decisions are made transparently."
  },
  {
    icon: MessageCircle,
    title: "Telegram Bot",
    description: "Collect preferences and send notifications through our easy-to-use Telegram integration."
  },
  {
    icon: Users,
    title: "Group Planning",
    description: "Collaborative tools that make it easy to plan trips with friends, family, or colleagues."
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data is secure and private with end-to-end encryption and GDPR compliance."
  },
  {
    icon: Zap,
    title: "Instant Setup",
    description: "Get started in minutes with our intuitive interface and smart onboarding."
  }
]

const steps = [
  {
    title: "Create Trip",
    description: "Set up your trip details and invite friends to join the planning process."
  },
  {
    title: "Collect Preferences",
    description: "Gather preferences through our app or Telegram bot surveys in minutes."
  },
  {
    title: "Get AI Suggestions",
    description: "Receive personalized destination recommendations based on group preferences."
  },
  {
    title: "Vote & Decide",
    description: "Use fair ranked-choice voting to choose the perfect destination together."
  }
]