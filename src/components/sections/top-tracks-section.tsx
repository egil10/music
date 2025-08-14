'use client'

import { motion } from 'framer-motion'
import { AnalyticsData } from '@/types/spotify'
import { formatNumber, formatDuration } from '@/lib/utils'
import { Music, Play, Clock } from 'lucide-react'

interface TopTracksSectionProps {
  data: AnalyticsData
}

export function TopTracksSection({ data }: TopTracksSectionProps) {
  const { topTracks } = data

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Your Top Tracks
        </h1>
        <p className="text-gray-400 text-lg">
          The songs you've played the most
        </p>
      </div>

      <div className="space-y-4">
        {topTracks.slice(0, 20).map((track, index) => (
          <motion.div
            key={`${track.name}-${track.artist}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.01, x: 5 }}
            className="spotify-card p-4 flex items-center space-x-4"
          >
            <div className="text-2xl font-bold text-spotify-green min-w-[3rem]">
              #{index + 1}
            </div>
            
            <div className="w-12 h-12 bg-spotify-green/20 rounded-full flex items-center justify-center">
              <Music className="w-6 h-6 text-spotify-green" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">
                {track.name}
              </h3>
              <p className="text-gray-400">{track.artist}</p>
            </div>
            
            <div className="text-right text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4" />
                <span>{formatNumber(track.streams)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(track.totalTime)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
