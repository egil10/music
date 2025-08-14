'use client'

import { motion } from 'framer-motion'
import { Spotify, Music, TrendingUp, Users, Clock } from 'lucide-react'

interface LoadingScreenProps {
  progress: number
}

export function LoadingScreen({ progress }: LoadingScreenProps) {
  const loadingMessages = [
    'Analyzing your music taste...',
    'Calculating listening patterns...',
    'Discovering your top artists...',
    'Mapping your musical journey...',
    'Preparing your personalized insights...',
    'Almost ready to reveal your story...'
  ]

  const currentMessage = loadingMessages[Math.floor(progress / 20)]

  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-black via-gray-900 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        {/* Spotify Logo */}
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-8"
        >
          <Spotify className="w-20 h-20 text-spotify-green mx-auto" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-white mb-2"
        >
          Spotify Wrapped Advanced
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 mb-8"
        >
          Loading your music story...
        </motion.p>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6"
        >
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <motion.div
              className="bg-spotify-green h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <p className="text-sm text-gray-400">{Math.round(progress)}%</p>
        </motion.div>

        {/* Loading Message */}
        <motion.p
          key={currentMessage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-spotify-lightGreen mb-8"
        >
          {currentMessage}
        </motion.p>

        {/* Feature Icons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center space-x-6"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex flex-col items-center"
          >
            <Music className="w-6 h-6 text-spotify-green mb-1" />
            <span className="text-xs text-gray-400">Tracks</span>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex flex-col items-center"
          >
            <Users className="w-6 h-6 text-spotify-green mb-1" />
            <span className="text-xs text-gray-400">Artists</span>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex flex-col items-center"
          >
            <TrendingUp className="w-6 h-6 text-spotify-green mb-1" />
            <span className="text-xs text-gray-400">Trends</span>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex flex-col items-center"
          >
            <Clock className="w-6 h-6 text-spotify-green mb-1" />
            <span className="text-xs text-gray-400">Time</span>
          </motion.div>
        </motion.div>

        {/* Pulse Effect */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full bg-spotify-green/20 blur-xl"
        />
      </motion.div>
    </div>
  )
}
