'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Spotify, Music, TrendingUp, Users, Clock, Play } from 'lucide-react'
import { spotifyDataLoader } from '@/lib/data-loader'
import { AnalyticsData } from '@/types/spotify'
import { LoadingScreen } from '@/components/loading-screen'
import { HeroSection } from '@/components/hero-section'
import { Dashboard } from '@/components/dashboard'
import { ErrorBoundary } from '@/components/error-boundary'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + Math.random() * 10, 90))
      }, 200)

      // Try to load data from different sources
      let analyticsData: AnalyticsData
      
      try {
        // First try merged file
        analyticsData = await spotifyDataLoader.loadFromMergedFile()
      } catch {
        try {
          // Then try safe data
          analyticsData = await spotifyDataLoader.loadFromSafeData()
        } catch {
          // Finally try individual files
          analyticsData = await spotifyDataLoader.loadAllData()
        }
      }

      clearInterval(progressInterval)
      setLoadingProgress(100)
      
      // Small delay to show completion
      setTimeout(() => {
        setData(analyticsData)
        setIsLoading(false)
      }, 500)

    } catch (err) {
      console.error('Failed to load data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load Spotify data')
      setIsLoading(false)
    }
  }

  const retryLoading = () => {
    setLoadingProgress(0)
    loadData()
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-black via-gray-900 to-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="mb-6">
            <Spotify className="w-16 h-16 text-spotify-green mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Oops!</h1>
            <p className="text-gray-400 mb-6">{error}</p>
          </div>
          
          <button
            onClick={retryLoading}
            className="spotify-button"
          >
            Try Again
          </button>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Make sure your Spotify data files are in the correct location:</p>
            <ul className="mt-2 text-left">
              <li>• Spotify Account Data/</li>
              <li>• Spotify Extended Streaming History/</li>
              <li>• merged_spotify_data.json</li>
            </ul>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-black via-gray-900 to-black">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingScreen key="loading" progress={loadingProgress} />
        ) : data ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <HeroSection data={data} />
            <Dashboard data={data} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
