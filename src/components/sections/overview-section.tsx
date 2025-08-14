'use client'

import { motion } from 'framer-motion'
import { AnalyticsData } from '@/types/spotify'
import { formatNumber, formatDuration, formatDate } from '@/lib/utils'
import { ActivityChart } from '../charts/activity-chart'
import { HeatmapChart } from '../charts/heatmap-chart'
import { 
  Play, 
  Clock, 
  Users, 
  Music, 
  TrendingUp, 
  Calendar,
  Target,
  Zap
} from 'lucide-react'

interface OverviewSectionProps {
  data: AnalyticsData
}

export function OverviewSection({ data }: OverviewSectionProps) {
  const { stats, timeAnalysis, concentrationMetrics, discoveryMetrics } = data

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

  const keyMetrics = [
    {
      icon: Play,
      value: formatNumber(stats.totalStreams),
      label: 'Total Streams',
      description: 'Songs you\'ve listened to',
      color: 'text-spotify-green',
      bgColor: 'bg-spotify-green/10',
    },
    {
      icon: Clock,
      value: formatDuration(stats.totalTime),
      label: 'Listening Time',
      description: 'Time spent listening',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      icon: Users,
      value: formatNumber(stats.uniqueArtists),
      label: 'Unique Artists',
      description: 'Different artists discovered',
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
    {
      icon: Music,
      value: formatNumber(stats.uniqueTracks),
      label: 'Unique Tracks',
      description: 'Different songs played',
      color: 'text-pink-400',
      bgColor: 'bg-pink-400/10',
    },
  ]

  const insights = [
    {
      icon: Target,
      title: 'Diversity Score',
      value: `${(concentrationMetrics.diversityScore * 100).toFixed(1)}%`,
      description: 'How diverse your music taste is',
      color: 'text-green-400',
    },
    {
      icon: Zap,
      title: 'Discovery Rate',
      value: `${(discoveryMetrics.discoveryRate * 100).toFixed(1)}%`,
      description: 'New tracks per total streams',
      color: 'text-yellow-400',
    },
    {
      icon: TrendingUp,
      title: 'Average Session',
      value: formatDuration(stats.averageSessionLength),
      description: 'Typical listening session length',
      color: 'text-blue-400',
    },
    {
      icon: Calendar,
      title: 'Active Days',
      value: `${stats.dateRange.days} days`,
      description: 'Your listening journey duration',
      color: 'text-purple-400',
    },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Section Header */}
      <motion.div variants={itemVariants} className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Your Music Overview
        </h1>
        <p className="text-gray-400 text-lg">
          A comprehensive look at your listening habits and preferences
        </p>
      </motion.div>

      {/* Key Metrics Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            className="spotify-card p-6 group"
          >
            <div className={`w-12 h-12 rounded-full ${metric.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${metric.color}`}>
              <metric.icon className="w-6 h-6" />
            </div>
            
            <div className="text-3xl font-bold text-white mb-1">
              {metric.value}
            </div>
            
            <div className="text-lg font-medium text-gray-300 mb-1">
              {metric.label}
            </div>
            
            <div className="text-sm text-gray-400">
              {metric.description}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <div className="spotify-card p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Listening Activity Over Time
          </h3>
          <div className="h-64">
            <ActivityChart data={timeAnalysis.monthly} />
          </div>
        </div>

        {/* Heatmap Chart */}
        <div className="spotify-card p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Daily Listening Heatmap
          </h3>
          <div className="h-64">
            <HeatmapChart data={data} />
          </div>
        </div>
      </motion.div>

      {/* Insights Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.title}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            className="spotify-card p-6"
          >
            <div className={`w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mb-4 ${insight.color}`}>
              <insight.icon className="w-5 h-5" />
            </div>
            
            <div className="text-2xl font-bold text-white mb-1">
              {insight.value}
            </div>
            
            <div className="text-sm font-medium text-gray-300 mb-2">
              {insight.title}
            </div>
            
            <div className="text-xs text-gray-400">
              {insight.description}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Date Range Summary */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Your Listening Journey
          </h3>
          <p className="text-gray-400">
            From {formatDate(stats.dateRange.start)} to {formatDate(stats.dateRange.end)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {stats.dateRange.days} days of musical exploration
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
