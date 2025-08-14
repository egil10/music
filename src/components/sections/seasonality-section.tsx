'use client'

import { motion } from 'framer-motion'
import { AnalyticsData } from '@/types/spotify'

interface SeasonalitySectionProps {
  data: AnalyticsData
}

export function SeasonalitySection({ data }: SeasonalitySectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Seasonality & Trends
        </h1>
        <p className="text-gray-400 text-lg">
          How your listening patterns change over time
        </p>
      </div>

      <div className="spotify-card p-8 text-center">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Coming Soon
        </h2>
        <p className="text-gray-400">
          Seasonal patterns and trend analysis will be displayed here
        </p>
      </div>
    </motion.div>
  )
}
