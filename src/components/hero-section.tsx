'use client'

import { motion } from 'framer-motion'
import { Spotify, Play, Clock, Users, Music, TrendingUp } from 'lucide-react'
import { AnalyticsData } from '@/types/spotify'
import { formatDuration, formatNumber } from '@/lib/utils'

interface HeroSectionProps {
  data: AnalyticsData
}

export function HeroSection({ data }: HeroSectionProps) {
  const { stats } = data

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  }

  const statCards = [
    {
      icon: Play,
      value: formatNumber(stats.totalStreams),
      label: 'Total Streams',
      color: 'text-spotify-green',
    },
    {
      icon: Clock,
      value: formatDuration(stats.totalTime),
      label: 'Listening Time',
      color: 'text-spotify-lightGreen',
    },
    {
      icon: Users,
      value: formatNumber(stats.uniqueArtists),
      label: 'Unique Artists',
      color: 'text-blue-400',
    },
    {
      icon: Music,
      value: formatNumber(stats.uniqueTracks),
      label: 'Unique Tracks',
      color: 'text-purple-400',
    },
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-spotify-black via-gray-900 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(29,185,84,0.1),transparent_50%)]" />
      
      {/* Floating Elements */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-20 left-20 opacity-20"
      >
        <Music className="w-12 h-12 text-spotify-green" />
      </motion.div>
      
      <motion.div
        animate={{
          y: [0, 20, 0],
          rotate: [0, -5, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute top-40 right-20 opacity-20"
      >
        <TrendingUp className="w-12 h-12 text-spotify-lightGreen" />
      </motion.div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          {/* Main Headline */}
          <motion.div variants={itemVariants} className="mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              className="inline-block mb-6"
            >
              <Spotify className="w-16 h-16 text-spotify-green mx-auto" />
            </motion.div>
            
            <motion.h1
              variants={itemVariants}
              className="text-6xl md:text-8xl font-bold text-white mb-4"
            >
              <span className="text-gradient">Now you,</span>
              <br />
              <span className="text-gradient">Wrapped</span>
            </motion.h1>
            
            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto"
            >
              Your comprehensive music journey, revealed through advanced analytics
            </motion.p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-16"
          >
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className="spotify-card p-6 text-center group"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1, type: "spring" }}
                  className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-spotify-green/20 transition-colors ${stat.color}`}
                >
                  <stat.icon className="w-6 h-6" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 + index * 0.1 }}
                >
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* Date Range */}
          <motion.div
            variants={itemVariants}
            className="text-center mb-8"
          >
            <p className="text-gray-400">
              Your music story from{' '}
              <span className="text-white font-medium">
                {stats.dateRange.start.toLocaleDateString()}
              </span>{' '}
              to{' '}
              <span className="text-white font-medium">
                {stats.dateRange.end.toLocaleDateString()}
              </span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.dateRange.days} days of listening data
            </p>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            variants={itemVariants}
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1 h-3 bg-gray-400 rounded-full mt-2"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
