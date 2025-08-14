'use client'

import { motion } from 'framer-motion'
import { AnalyticsData } from '@/types/spotify'

interface ConcentrationSectionProps {
  data: AnalyticsData
}

export function ConcentrationSection({ data }: ConcentrationSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Concentration Analysis
        </h1>
        <p className="text-gray-400 text-lg">
          How focused or diverse your listening is
        </p>
      </div>

      <div className="spotify-card p-8 text-center">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Coming Soon
        </h2>
        <p className="text-gray-400">
          HHI and Gini coefficient analysis will be displayed here
        </p>
      </div>
    </motion.div>
  )
}
