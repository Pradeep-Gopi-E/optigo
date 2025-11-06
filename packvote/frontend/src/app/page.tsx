import Link from 'next/link'
import { ArrowRight, Users, Brain, Vote, MessageCircle } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">PackVote</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link
              href="/auth/login"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="btn btn-primary"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Plan Group Trips with
            <span className="text-primary"> AI-Powered</span> Decisions
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Make group travel planning simple and fair. Collect preferences,
            get AI recommendations, and decide with ranked-choice voting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="btn btn-primary btn-lg"
            >
              Start Planning
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/demo"
              className="btn btn-outline btn-lg"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Create Trip
              </h3>
              <p className="text-gray-600">
                Set up your trip and invite friends to join the planning process.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Collect Preferences
              </h3>
              <p className="text-gray-600">
                Gather preferences through our app or Telegram bot surveys.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Recommendations
              </h3>
              <p className="text-gray-600">
                Get personalized destination suggestions based on group preferences.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Vote className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Fair Voting
              </h3>
              <p className="text-gray-600">
                Decide together using ranked-choice voting for the most democratic outcome.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Why PackVote?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  AI-Powered Insights
                </h3>
                <p className="text-gray-600">
                  Our AI analyzes group preferences to suggest destinations that everyone will love.
                </p>
              </div>
              <div className="card p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Vote className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Fair Decision Making
                </h3>
                <p className="text-gray-600">
                  Ranked-choice voting ensures everyone's preferences are heard and considered.
                </p>
              </div>
              <div className="card p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Easy Communication
                </h3>
                <p className="text-gray-600">
                  Integrated Telegram bot makes collecting preferences simple and convenient.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Plan Your Next Adventure?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of groups who have planned memorable trips with PackVote.
          </p>
          <Link
            href="/auth/register"
            className="btn btn-primary btn-lg"
          >
            Start Your Free Trip
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">PackVote</span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400">
                © 2024 PackVote. Making group travel planning better.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}