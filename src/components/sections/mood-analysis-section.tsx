'use client'

import { motion } from 'framer-motion'
import { AnalyticsData } from '@/types/spotify'

interface MoodAnalysisSectionProps {
  data: AnalyticsData
}

export function MoodAnalysisSection({ data }: MoodAnalysisSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Mood Analysis
        </h1>
        <p className="text-gray-400 text-lg">
          Energy, valence, and danceability over time
        </p>
      </div>

      <div className="spotify-card p-8 text-center">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Coming Soon
        </h2>
        <p className="text-gray-400">
          Audio features analysis and mood trends will be displayed here
        </p>
      </div>
    </motion.div>
  )
}
