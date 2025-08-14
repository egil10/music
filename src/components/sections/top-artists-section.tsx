'use client'

import { motion } from 'framer-motion'
import { AnalyticsData } from '@/types/spotify'
import { formatNumber, formatDuration } from '@/lib/utils'
import { Users, Play, Clock } from 'lucide-react'

interface TopArtistsSectionProps {
  data: AnalyticsData
}

export function TopArtistsSection({ data }: TopArtistsSectionProps) {
  const { topArtists } = data

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Your Top Artists
        </h1>
        <p className="text-gray-400 text-lg">
          The artists you've listened to the most
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topArtists.slice(0, 12).map((artist, index) => (
          <motion.div
            key={artist.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="spotify-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-spotify-green/20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-spotify-green" />
              </div>
              <div className="text-2xl font-bold text-spotify-green">
                #{index + 1}
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-2">
              {artist.name}
            </h3>
            
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4" />
                <span>{formatNumber(artist.streams)} streams</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(artist.totalTime)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
