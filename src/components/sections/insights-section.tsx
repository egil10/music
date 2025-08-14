'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { AnalyticsData } from '@/types/spotify'
import { formatNumber, formatDuration, formatDate } from '@/lib/utils'
import { 
  Flame,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Heart,
  Crown,
  Trophy,
  Medal,
  Star,
  Award,
  Zap,
  Target,
  Eye,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  HelpCircle,
  CalendarDays,
  Clock3,
  Headphones,
  Repeat,
  Shuffle,
  Music,
  Play,
  Users,
  Sparkles,
  Network,
  Layers,
  Grid3X3,
  Hexagon,
  Circle,
  Square,
  Triangle,
  Box,
  Gauge,
  BarChart3
} from 'lucide-react'

interface InsightsSectionProps {
  data: AnalyticsData
}

export function InsightsSection({ data }: InsightsSectionProps) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // Feature 22: Listening streaks
  const listeningStreaks = useMemo(() => {
    const dailyHours: { [date: string]: number } = {}
    data.streamingHistory.forEach(entry => {
      const date = entry.endTime.split('T')[0]
      const hours = entry.msPlayed / (1000 * 60 * 60)
      dailyHours[date] = (dailyHours[date] || 0) + hours
    })

    const dates = Object.keys(dailyHours).sort()
    let currentStreak = 0
    let longestStreak = 0
    let currentStreakStart = ''
    let longestStreakStart = ''

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i]
      const hours = dailyHours[date]
      
      if (hours >= 1) {
        if (currentStreak === 0) {
          currentStreakStart = date
        }
        currentStreak++
        
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak
          longestStreakStart = currentStreakStart
        }
      } else {
        currentStreak = 0
      }
    }

    return {
      longestStreak,
      longestStreakStart,
      currentStreak,
      totalDays: dates.length
    }
  }, [data.streamingHistory])

  // Feature 31: Artist active periods
  const artistActivePeriods = useMemo(() => {
    const artistPeriods: { [artist: string]: { first: string; last: string; years: number } } = {}
    
    data.streamingHistory.forEach(entry => {
      const artist = entry.artistName
      const date = entry.endTime.split('T')[0]
      
      if (!artistPeriods[artist]) {
        artistPeriods[artist] = { first: date, last: date, years: 0 }
      } else {
        if (date < artistPeriods[artist].first) {
          artistPeriods[artist].first = date
        }
        if (date > artistPeriods[artist].last) {
          artistPeriods[artist].last = date
        }
      }
    })

    return Object.entries(artistPeriods)
      .map(([artist, period]) => ({
        artist,
        firstYear: new Date(period.first).getFullYear(),
        lastYear: new Date(period.last).getFullYear(),
        duration: new Date(period.last).getFullYear() - new Date(period.first).getFullYear() + 1
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 20)
  }, [data.streamingHistory])

  // Feature 32: Track play count histogram
  const trackPlayHistogram = useMemo(() => {
    const trackPlays: { [track: string]: number } = {}
    
    data.streamingHistory.forEach(entry => {
      const trackKey = `${entry.artistName} - ${entry.trackName}`
      trackPlays[trackKey] = (trackPlays[trackKey] || 0) + 1
    })

    const playCounts = Object.values(trackPlays)
    const histogram = {
      '1': 0,
      '2-5': 0,
      '6-10': 0,
      '11-20': 0,
      '21-50': 0,
      '51-100': 0,
      '100+': 0
    }

    playCounts.forEach(count => {
      if (count === 1) histogram['1']++
      else if (count <= 5) histogram['2-5']++
      else if (count <= 10) histogram['6-10']++
      else if (count <= 20) histogram['11-20']++
      else if (count <= 50) histogram['21-50']++
      else if (count <= 100) histogram['51-100']++
      else histogram['100+']++
    })

    return histogram
  }, [data.streamingHistory])

  // Feature 33: Evolution of taste (cosine similarity)
  const tasteEvolution = useMemo(() => {
    const yearlyArtists: { [year: number]: { [artist: string]: number } } = {}
    
    data.streamingHistory.forEach(entry => {
      const year = new Date(entry.endTime).getFullYear()
      const hours = entry.msPlayed / (1000 * 60 * 60)
      
      if (!yearlyArtists[year]) {
        yearlyArtists[year] = {}
      }
      yearlyArtists[year][entry.artistName] = (yearlyArtists[year][entry.artistName] || 0) + hours
    })

    const years = Object.keys(yearlyArtists).map(Number).sort()
    const similarities = years.slice(1).map(year => {
      const previousYear = year - 1
      const currentArtists = yearlyArtists[year]
      const previousArtists = yearlyArtists[previousYear]
      
      const allArtists = new Set([...Object.keys(currentArtists), ...Object.keys(previousArtists)])
      let dotProduct = 0
      let currentNorm = 0
      let previousNorm = 0
      
      allArtists.forEach(artist => {
        const current = currentArtists[artist] || 0
        const previous = previousArtists[artist] || 0
        dotProduct += current * previous
        currentNorm += current * current
        previousNorm += previous * previous
      })
      
      const similarity = dotProduct / (Math.sqrt(currentNorm) * Math.sqrt(previousNorm))
      return {
        year,
        similarity: isNaN(similarity) ? 0 : similarity
      }
    })

    return similarities
  }, [data.streamingHistory])

  // Feature 35: Outlier detection
  const outlierDays = useMemo(() => {
    const dailyHours: { [date: string]: number } = {}
    data.streamingHistory.forEach(entry => {
      const date = entry.endTime.split('T')[0]
      const hours = entry.msPlayed / (1000 * 60 * 60)
      dailyHours[date] = (dailyHours[date] || 0) + hours
    })

    const hours = Object.values(dailyHours)
    const mean = hours.reduce((a, b) => a + b, 0) / hours.length
    const variance = hours.reduce((acc, hour) => acc + Math.pow(hour - mean, 2), 0) / hours.length
    const stdDev = Math.sqrt(variance)
    const threshold = mean + (3 * stdDev)

    return Object.entries(dailyHours)
      .filter(([, hours]) => hours > threshold)
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10)
  }, [data.streamingHistory])

  // Feature 36: Pareto chart
  const paretoChart = useMemo(() => {
    const artistHours = data.topArtists.map(artist => ({
      name: artist.name,
      hours: artist.totalTime / (1000 * 60 * 60)
    })).sort((a, b) => b.hours - a.hours)

    const totalHours = artistHours.reduce((sum, artist) => sum + artist.hours, 0)
    let cumulativeHours = 0

    return artistHours.map((artist, index) => {
      cumulativeHours += artist.hours
      return {
        ...artist,
        rank: index + 1,
        percentage: (artist.hours / totalHours) * 100,
        cumulativePercentage: (cumulativeHours / totalHours) * 100
      }
    }).slice(0, 20)
  }, [data.topArtists])

  // Feature 38: Average track length trend
  const trackLengthTrend = useMemo(() => {
    const yearlyLengths: { [year: number]: { totalMs: number; plays: number } } = {}
    
    data.streamingHistory.forEach(entry => {
      const year = new Date(entry.endTime).getFullYear()
      if (!yearlyLengths[year]) {
        yearlyLengths[year] = { totalMs: 0, plays: 0 }
      }
      yearlyLengths[year].totalMs += entry.msPlayed
      yearlyLengths[year].plays += 1
    })

    return Object.entries(yearlyLengths)
      .map(([year, data]) => ({
        year: parseInt(year),
        avgLength: data.totalMs / data.plays / (1000 * 60) // minutes
      }))
      .sort((a, b) => a.year - b.year)
  }, [data.streamingHistory])

  // Feature 42: Loyalty tiers
  const loyaltyTiers = useMemo(() => {
    const artistYears: { [artist: string]: Set<number> } = {}
    
    data.streamingHistory.forEach(entry => {
      const year = new Date(entry.endTime).getFullYear()
      if (!artistYears[entry.artistName]) {
        artistYears[entry.artistName] = new Set()
      }
      artistYears[entry.artistName].add(year)
    })

    const allYears = Array.from(new Set(data.streamingHistory.map(entry => 
      new Date(entry.endTime).getFullYear()
    ))).sort()

    const coreArtists = Object.entries(artistYears)
      .filter(([, years]) => years.size >= allYears.length * 0.7)
      .map(([artist]) => artist)

    const emergingArtists = Object.entries(artistYears)
      .filter(([, years]) => years.size === 1 && Math.max(...years) === Math.max(...allYears))
      .map(([artist]) => artist)

    const fadingArtists = Object.entries(artistYears)
      .filter(([, years]) => years.size >= 2 && Math.max(...years) < Math.max(...allYears))
      .map(([artist]) => artist)

    return {
      core: coreArtists.slice(0, 10),
      emerging: emergingArtists.slice(0, 10),
      fading: fadingArtists.slice(0, 10)
    }
  }, [data.streamingHistory])

  // Feature 44: Play density
  const playDensity = useMemo(() => {
    const trackDensity: { [track: string]: { plays: number; hours: number; density: number } } = {}
    
    data.streamingHistory.forEach(entry => {
      const trackKey = `${entry.artistName} - ${entry.trackName}`
      const hours = entry.msPlayed / (1000 * 60 * 60)
      
      if (!trackDensity[trackKey]) {
        trackDensity[trackKey] = { plays: 0, hours: 0, density: 0 }
      }
      trackDensity[trackKey].plays += 1
      trackDensity[trackKey].hours += hours
    })

    Object.values(trackDensity).forEach(track => {
      track.density = track.plays / track.hours
    })

    return Object.entries(trackDensity)
      .map(([track, data]) => ({ track, ...data }))
      .sort((a, b) => b.density - a.density)
      .slice(0, 20)
  }, [data.streamingHistory])

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
          Deep Insights
        </h1>
        <p className="text-gray-400 text-lg">
          Advanced analytics and behavioral patterns
        </p>
      </motion.div>

      {/* Feature 22: Listening Streaks */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5" />
          Listening Streaks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-spotify-green mb-2">
              {listeningStreaks.longestStreak} days
            </div>
            <div className="text-gray-300 mb-1">Longest Streak</div>
            <div className="text-sm text-gray-400">
              Started {formatDate(new Date(listeningStreaks.longestStreakStart))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {listeningStreaks.currentStreak} days
            </div>
            <div className="text-gray-300 mb-1">Current Streak</div>
            <div className="text-sm text-gray-400">
              {listeningStreaks.totalDays} total active days
            </div>
          </div>
        </div>
      </motion.div>

      {/* Feature 32: Track Play Histogram */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Track Play Distribution
        </h3>
        <div className="space-y-3">
          {Object.entries(trackPlayHistogram).map(([range, count]) => (
            <div key={range} className="flex items-center gap-4">
              <div className="w-16 text-sm text-gray-400">{range}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${(count / Math.max(...Object.values(trackPlayHistogram))) * 100}%` }}
                />
              </div>
              <div className="w-16 text-right text-sm text-white font-medium">
                {formatNumber(count)}
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Number of tracks played in each frequency range
        </div>
      </motion.div>

      {/* Feature 33: Taste Evolution */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Taste Evolution
        </h3>
        <div className="space-y-3">
          {tasteEvolution.map((yearData) => (
            <div key={yearData.year} className="flex items-center gap-4">
              <div className="w-16 text-sm text-gray-400">{yearData.year}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${yearData.similarity * 100}%` }}
                />
              </div>
              <div className="w-20 text-right text-sm text-white font-medium">
                {(yearData.similarity * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Similarity to previous year's artist preferences
        </div>
      </motion.div>

      {/* Feature 35: Outlier Days */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Outlier Listening Days
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {outlierDays.map((day, index) => (
            <div key={day.date} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex-1">
                <div className="text-white font-medium">{formatDate(new Date(day.date))}</div>
                <div className="text-sm text-gray-400">Day #{index + 1}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-red-400">{day.hours.toFixed(1)}h</div>
                <div className="text-xs text-gray-400">listening</div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Days with unusually high listening (>3 standard deviations above mean)
        </div>
      </motion.div>

      {/* Feature 36: Pareto Chart */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Artist Pareto Analysis
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {paretoChart.map((artist) => (
            <div key={artist.name} className="flex items-center gap-4">
              <div className="w-8 text-sm text-gray-400">#{artist.rank}</div>
              <div className="flex-1">
                <div className="text-sm text-white font-medium">{artist.name}</div>
                <div className="text-xs text-gray-400">{artist.hours.toFixed(1)}h</div>
              </div>
              <div className="w-20 text-right">
                <div className="text-sm text-white font-medium">{artist.percentage.toFixed(1)}%</div>
                <div className="text-xs text-gray-400">{artist.cumulativePercentage.toFixed(1)}% cum.</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Feature 38: Track Length Trend */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Average Track Length Trend
        </h3>
        <div className="space-y-3">
          {trackLengthTrend.map((yearData) => (
            <div key={yearData.year} className="flex items-center gap-4">
              <div className="w-16 text-sm text-gray-400">{yearData.year}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${(yearData.avgLength / Math.max(...trackLengthTrend.map(y => y.avgLength))) * 100}%` }}
                />
              </div>
              <div className="w-20 text-right text-sm text-white font-medium">
                {yearData.avgLength.toFixed(1)}m
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Feature 42: Loyalty Tiers */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Crown className="w-5 h-5" />
          Artist Loyalty Tiers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-green-400 mb-3">Core Artists</h4>
            <div className="space-y-2">
              {loyaltyTiers.core.map(artist => (
                <div key={artist} className="text-sm text-white">{artist}</div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-blue-400 mb-3">Emerging</h4>
            <div className="space-y-2">
              {loyaltyTiers.emerging.map(artist => (
                <div key={artist} className="text-sm text-white">{artist}</div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-400 mb-3">Fading</h4>
            <div className="space-y-2">
              {loyaltyTiers.fading.map(artist => (
                <div key={artist} className="text-sm text-white">{artist}</div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Feature 44: Play Density */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Play Density Analysis
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {playDensity.map((track, index) => (
            <div key={track.track} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex-1">
                <div className="text-white font-medium">{track.track}</div>
                <div className="text-sm text-gray-400">{track.plays} plays, {track.hours.toFixed(1)}h</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-purple-400">{track.density.toFixed(1)}</div>
                <div className="text-xs text-gray-400">plays/hour</div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Tracks with highest plays per hour of listening time
        </div>
      </motion.div>
    </motion.div>
  )
}
