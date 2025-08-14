'use client'

import { motion } from 'framer-motion'
import { AnalyticsData } from '@/types/spotify'

interface DiscoverySectionProps {
  data: AnalyticsData
}

export function DiscoverySection({ data }: DiscoverySectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Discovery vs. Comfort
        </h1>
        <p className="text-gray-400 text-lg">
          How much you explore vs. stick to favorites
        </p>
      </div>

      <div className="spotify-card p-8 text-center">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Coming Soon
        </h2>
        <p className="text-gray-400">
          Discovery metrics and comfort zone analysis will be displayed here
        </p>
      </div>
    </motion.div>
  )
}
