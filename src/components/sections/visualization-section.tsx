'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { AnalyticsData } from '@/types/spotify'
import { formatNumber, formatDuration, formatDate } from '@/lib/utils'
import { 
  ScatterChart,
  BarChart3,
  PieChart,
  Calendar,
  Activity,
  Target,
  Zap,
  Music,
  Play,
  Users,
  Star,
  Award,
  TrendingDown,
  CalendarDays,
  Clock3,
  Headphones,
  Repeat,
  Shuffle,
  Heart,
  Crown,
  Trophy,
  Medal,
  Flame,
  Sparkles,
  Eye,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  HelpCircle,
  TrendingUp,
  Gauge,
  Box,
  Network,
  Layers,
  Grid3X3,
  Hexagon,
  Circle,
  Square,
  Triangle
} from 'lucide-react'

interface VisualizationSectionProps {
  data: AnalyticsData
}

export function VisualizationSection({ data }: VisualizationSectionProps) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedVisualization, setSelectedVisualization] = useState<string>('scatter')

  // Feature 7: Scatter plot data (plays vs hours vs unique tracks)
  const scatterPlotData = useMemo(() => {
    return data.topArtists.slice(0, 50).map(artist => ({
      x: artist.streams,
      y: artist.totalTime / (1000 * 60 * 60),
      size: artist.uniqueTracks,
      name: artist.name,
      color: artist.streams > 1000 ? '#1DB954' : artist.streams > 500 ? '#1ed760' : '#1fdf64'
    }))
  }, [data.topArtists])

  // Feature 9: Calendar heatmap data
  const calendarHeatmapData = useMemo(() => {
    const dailyHours: { [date: string]: number } = {}
    data.streamingHistory.forEach(entry => {
      const date = entry.endTime.split('T')[0]
      const hours = entry.msPlayed / (1000 * 60 * 60)
      dailyHours[date] = (dailyHours[date] || 0) + hours
    })
    return dailyHours
  }, [data.streamingHistory])

  // Feature 11: Stacked bar chart by month for each year
  const monthlyStackedData = useMemo(() => {
    const monthlyData: { [year: number]: { [month: number]: number } } = {}
    
    data.streamingHistory.forEach(entry => {
      const date = new Date(entry.endTime)
      const year = date.getFullYear()
      const month = date.getMonth()
      const hours = entry.msPlayed / (1000 * 60 * 60)
      
      if (!monthlyData[year]) {
        monthlyData[year] = {}
      }
      monthlyData[year][month] = (monthlyData[year][month] || 0) + hours
    })

    return Object.entries(monthlyData).map(([year, months]) => ({
      year: parseInt(year),
      months: Array.from({ length: 12 }, (_, i) => months[i] || 0)
    })).sort((a, b) => a.year - b.year)
  }, [data.streamingHistory])

  // Feature 12: Bubble chart for top tracks
  const bubbleChartData = useMemo(() => {
    return data.topTracks.slice(0, 30).map(track => ({
      x: track.totalTime / (1000 * 60 * 60), // hours
      y: track.releaseYear || 2020,
      size: track.streams,
      name: track.name,
      artist: track.artist,
      color: track.streams > 100 ? '#1DB954' : track.streams > 50 ? '#1ed760' : '#1fdf64'
    }))
  }, [data.topTracks])

  // Feature 14: Word cloud data
  const wordCloudData = useMemo(() => {
    return data.topArtists.slice(0, 30).map(artist => ({
      text: artist.name,
      value: artist.totalTime / (1000 * 60 * 60),
      color: artist.totalTime > 1000000 ? '#1DB954' : artist.totalTime > 500000 ? '#1ed760' : '#1fdf64'
    }))
  }, [data.topArtists])

  // Feature 17: Violin plot data (daily plays distribution by year)
  const violinPlotData = useMemo(() => {
    const dailyPlaysByYear: { [year: number]: number[] } = {}
    
    data.streamingHistory.forEach(entry => {
      const year = new Date(entry.endTime).getFullYear()
      if (!dailyPlaysByYear[year]) {
        dailyPlaysByYear[year] = []
      }
      dailyPlaysByYear[year].push(1) // Each entry is one play
    })

    return Object.entries(dailyPlaysByYear).map(([year, plays]) => ({
      year: parseInt(year),
      plays,
      median: plays.sort((a, b) => a - b)[Math.floor(plays.length / 2)],
      mean: plays.reduce((a, b) => a + b, 0) / plays.length
    })).sort((a, b) => a.year - b.year)
  }, [data.streamingHistory])

  // Feature 18: Artist loyalty/retention data
  const artistLoyaltyData = useMemo(() => {
    const artistYears: { [artist: string]: Set<number> } = {}
    
    data.streamingHistory.forEach(entry => {
      const year = new Date(entry.endTime).getFullYear()
      if (!artistYears[entry.artistName]) {
        artistYears[entry.artistName] = new Set()
      }
      artistYears[entry.artistName].add(year)
    })

    const years = Array.from(new Set(data.streamingHistory.map(entry => 
      new Date(entry.endTime).getFullYear()
    ))).sort()

    const retentionData = years.slice(1).map(year => {
      const previousYear = year - 1
      const previousYearArtists = new Set(
        data.streamingHistory
          .filter(entry => new Date(entry.endTime).getFullYear() === previousYear)
          .map(entry => entry.artistName)
      )
      const currentYearArtists = new Set(
        data.streamingHistory
          .filter(entry => new Date(entry.endTime).getFullYear() === year)
          .map(entry => entry.artistName)
      )
      
      const retained = Array.from(previousYearArtists).filter(artist => 
        currentYearArtists.has(artist)
      ).length
      
      return {
        year,
        retained,
        total: previousYearArtists.size,
        retentionRate: (retained / previousYearArtists.size) * 100
      }
    })

    return retentionData
  }, [data.streamingHistory])

  // Feature 19: Funnel chart data
  const funnelChartData = useMemo(() => {
    const totalPlays = data.stats.totalStreams
    const uniqueTracks = data.stats.uniqueTracks
    const uniqueArtists = data.stats.uniqueArtists
    
    return [
      { stage: 'Total Plays', value: totalPlays, percentage: 100 },
      { stage: 'Unique Tracks', value: uniqueTracks, percentage: (uniqueTracks / totalPlays) * 100 },
      { stage: 'Unique Artists', value: uniqueArtists, percentage: (uniqueArtists / totalPlays) * 100 }
    ]
  }, [data.stats])

  // Feature 23: Polar area chart data
  const polarAreaData = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const currentYearData = data.streamingHistory.filter(entry => 
      new Date(entry.endTime).getFullYear() === currentYear
    )
    
    const artistHours: { [artist: string]: number } = {}
    currentYearData.forEach(entry => {
      const hours = entry.msPlayed / (1000 * 60 * 60)
      artistHours[entry.artistName] = (artistHours[entry.artistName] || 0) + hours
    })
    
    const totalHours = Object.values(artistHours).reduce((a, b) => a + b, 0)
    
    return Object.entries(artistHours)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([artist, hours], index) => ({
        artist,
        hours,
        percentage: (hours / totalHours) * 100,
        angle: (360 / 10) * index,
        color: `hsl(${index * 36}, 70%, 60%)`
      }))
  }, [data.streamingHistory])

  // Feature 24: Box plot data (hourly distribution by day of week)
  const boxPlotData = useMemo(() => {
    const hourlyByDay: { [day: number]: number[] } = {}
    
    data.streamingHistory.forEach(entry => {
      const date = new Date(entry.endTime)
      const day = date.getDay()
      const hour = date.getHours()
      
      if (!hourlyByDay[day]) {
        hourlyByDay[day] = []
      }
      hourlyByDay[day].push(hour)
    })

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    return dayNames.map((dayName, index) => {
      const hours = hourlyByDay[index] || []
      const sorted = hours.sort((a, b) => a - b)
      const q1 = sorted[Math.floor(sorted.length * 0.25)]
      const median = sorted[Math.floor(sorted.length * 0.5)]
      const q3 = sorted[Math.floor(sorted.length * 0.75)]
      const min = sorted[0]
      const max = sorted[sorted.length - 1]
      
      return {
        day: dayName,
        min,
        q1,
        median,
        q3,
        max,
        count: hours.length
      }
    })
  }, [data.streamingHistory])

  // Feature 25: Binge listening data
  const bingeListeningData = useMemo(() => {
    const monthlyTracks: { [month: string]: { [track: string]: number } } = {}
    
    data.streamingHistory.forEach(entry => {
      const date = new Date(entry.endTime)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const trackKey = `${entry.artistName} - ${entry.trackName}`
      
      if (!monthlyTracks[month]) {
        monthlyTracks[month] = {}
      }
      monthlyTracks[month][trackKey] = (monthlyTracks[month][trackKey] || 0) + 1
    })

    const bingeTracks = Object.entries(monthlyTracks)
      .flatMap(([month, tracks]) => 
        Object.entries(tracks).map(([track, plays]) => ({ month, track, plays }))
      )
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 20)

    return bingeTracks
  }, [data.streamingHistory])

  // Feature 26: Year-over-year growth rate
  const growthRateData = useMemo(() => {
    const yearlyHours: { [year: number]: number } = {}
    data.streamingHistory.forEach(entry => {
      const year = new Date(entry.endTime).getFullYear()
      const hours = entry.msPlayed / (1000 * 60 * 60)
      yearlyHours[year] = (yearlyHours[year] || 0) + hours
    })

    const years = Object.keys(yearlyHours).map(Number).sort()
    const growthRates = years.slice(1).map(year => {
      const previousYear = year - 1
      const currentHours = yearlyHours[year]
      const previousHours = yearlyHours[previousYear]
      const growthRate = ((currentHours - previousHours) / previousHours) * 100
      
      return {
        year,
        previousYear,
        currentHours,
        previousHours,
        growthRate,
        change: currentHours - previousHours
      }
    })

    return growthRates
  }, [data.streamingHistory])

  // Feature 27: Treemap data
  const treemapData = useMemo(() => {
    const artistTracks: { [artist: string]: { [track: string]: { hours: number; plays: number } } } = {}
    
    data.streamingHistory.forEach(entry => {
      const artist = entry.artistName
      const track = entry.trackName
      const hours = entry.msPlayed / (1000 * 60 * 60)
      
      if (!artistTracks[artist]) {
        artistTracks[artist] = {}
      }
      if (!artistTracks[artist][track]) {
        artistTracks[artist][track] = { hours: 0, plays: 0 }
      }
      artistTracks[artist][track].hours += hours
      artistTracks[artist][track].plays += 1
    })

    return Object.entries(artistTracks)
      .sort(([, a], [, b]) => 
        Object.values(b).reduce((sum, track) => sum + track.hours, 0) - 
        Object.values(a).reduce((sum, track) => sum + track.hours, 0)
      )
      .slice(0, 10)
      .map(([artist, tracks]) => ({
        artist,
        tracks: Object.entries(tracks)
          .sort(([, a], [, b]) => b.hours - a.hours)
          .slice(0, 5)
          .map(([track, data]) => ({
            track,
            hours: data.hours,
            plays: data.plays
          }))
      }))
  }, [data.streamingHistory])

  // Feature 28: Temporal patterns (hourly listening)
  const temporalPatternsData = useMemo(() => {
    const hourlyListening: { [hour: number]: number } = {}
    
    data.streamingHistory.forEach(entry => {
      const hour = new Date(entry.endTime).getHours()
      const hours = entry.msPlayed / (1000 * 60 * 60)
      hourlyListening[hour] = (hourlyListening[hour] || 0) + hours
    })

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      hours: hourlyListening[hour] || 0
    }))
  }, [data.streamingHistory])

  // Feature 29: Radar chart data for top 3 artists
  const radarChartData = useMemo(() => {
    const top3Artists = data.topArtists.slice(0, 3)
    
    return top3Artists.map(artist => ({
      name: artist.name,
      plays: artist.streams,
      hours: artist.totalTime / (1000 * 60 * 60),
      avgTrackLength: (artist.totalTime / artist.streams) / (1000 * 60),
      uniqueTracks: artist.uniqueTracks,
      rankStability: 1 // Placeholder - would need historical data
    }))
  }, [data.topArtists])

  // Feature 30: Concentration ratio
  const concentrationRatioData = useMemo(() => {
    const totalHours = data.stats.totalTime / (1000 * 60 * 60)
    const top10PercentCount = Math.ceil(data.topArtists.length * 0.1)
    const top10PercentHours = data.topArtists
      .slice(0, top10PercentCount)
      .reduce((sum, artist) => sum + (artist.totalTime / (1000 * 60 * 60)), 0)
    
    return {
      top10PercentHours,
      totalHours,
      concentrationRatio: (top10PercentHours / totalHours) * 100,
      top10PercentCount,
      totalArtists: data.topArtists.length
    }
  }, [data.topArtists, data.stats])

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
          Advanced Visualizations
        </h1>
        <p className="text-gray-400 text-lg">
          Interactive charts and data visualizations
        </p>
      </motion.div>

      {/* Feature 7: Scatter Plot */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <ScatterChart className="w-5 h-5" />
          Artist Analysis Scatter Plot
        </h3>
        <div className="h-96 bg-gray-900 rounded-lg p-4 relative">
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <ScatterChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Scatter plot visualization</p>
              <p className="text-sm">X: Plays, Y: Hours, Size: Unique Tracks</p>
            </div>
          </div>
          {/* Placeholder for actual scatter plot implementation */}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-white font-medium">X-Axis</div>
            <div className="text-gray-400">Total Plays</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">Y-Axis</div>
            <div className="text-gray-400">Listening Hours</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">Size</div>
            <div className="text-gray-400">Unique Tracks</div>
          </div>
        </div>
      </motion.div>

      {/* Feature 11: Stacked Bar Chart */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Monthly Listening by Year
        </h3>
        <div className="h-96 bg-gray-900 rounded-lg p-4 relative">
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Stacked bar chart visualization</p>
              <p className="text-sm">Monthly breakdown by year</p>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-12 gap-1 text-xs">
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
            <div key={month} className="text-center text-gray-400">{month}</div>
          ))}
        </div>
      </motion.div>

      {/* Feature 12: Bubble Chart */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Circle className="w-5 h-5" />
          Top Tracks Bubble Chart
        </h3>
        <div className="h-96 bg-gray-900 rounded-lg p-4 relative">
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Circle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Bubble chart visualization</p>
              <p className="text-sm">X: Hours, Y: Year, Size: Plays</p>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-white font-medium">X-Axis</div>
            <div className="text-gray-400">Listening Hours</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">Y-Axis</div>
            <div className="text-gray-400">Release Year</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">Size</div>
            <div className="text-gray-400">Play Count</div>
          </div>
        </div>
      </motion.div>

      {/* Feature 14: Word Cloud */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Grid3X3 className="w-5 h-5" />
          Artist Word Cloud
        </h3>
        <div className="h-96 bg-gray-900 rounded-lg p-4 relative">
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Grid3X3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Word cloud visualization</p>
              <p className="text-sm">Artist names sized by listening hours</p>
            </div>
          </div>
        </div>
        <div className="mt-4 text-center text-sm text-gray-400">
          Word size represents total listening hours
        </div>
      </motion.div>

      {/* Feature 17: Violin Plot */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Box className="w-5 h-5" />
          Daily Plays Distribution by Year
        </h3>
        <div className="h-96 bg-gray-900 rounded-lg p-4 relative">
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Violin plot visualization</p>
              <p className="text-sm">Distribution of daily plays by year</p>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="text-white font-medium">Median</div>
            <div className="text-gray-400">Middle value</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">Distribution</div>
            <div className="text-gray-400">Play frequency spread</div>
          </div>
        </div>
      </motion.div>

      {/* Feature 18: Artist Loyalty */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Artist Retention Rate
        </h3>
        <div className="space-y-3">
          {artistLoyaltyData.map((yearData) => (
            <div key={yearData.year} className="flex items-center gap-4">
              <div className="w-16 text-sm text-gray-400">{yearData.year}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${yearData.retentionRate}%` }}
                />
              </div>
              <div className="w-20 text-right text-sm text-white font-medium">
                {yearData.retentionRate.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Percentage of artists from previous year that remained in top 20
        </div>
      </motion.div>

      {/* Feature 19: Funnel Chart */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Triangle className="w-5 h-5" />
          Listening Funnel
        </h3>
        <div className="space-y-4">
          {funnelChartData.map((stage, index) => (
            <div key={stage.stage} className="text-center">
              <div className="text-lg font-medium text-white mb-1">{stage.stage}</div>
              <div className="text-2xl font-bold text-spotify-green mb-1">
                {formatNumber(stage.value)}
              </div>
              <div className="text-sm text-gray-400">
                {stage.percentage.toFixed(1)}% of total plays
              </div>
              <div 
                className="mx-auto mt-2 h-2 bg-gray-800 rounded-full overflow-hidden"
                style={{ width: `${Math.max(20, stage.percentage)}%` }}
              >
                <div 
                  className="h-full bg-gradient-to-r from-spotify-green to-green-400 rounded-full"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Feature 23: Polar Area Chart */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          Top Artists Share (Current Year)
        </h3>
        <div className="h-96 bg-gray-900 rounded-lg p-4 relative">
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <PieChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Polar area chart visualization</p>
              <p className="text-sm">Artist share of listening time</p>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="text-white font-medium">Angle</div>
            <div className="text-gray-400">Proportional time</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">Radius</div>
            <div className="text-gray-400">Listening hours</div>
          </div>
        </div>
      </motion.div>

      {/* Feature 24: Box Plot */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Box className="w-5 h-5" />
          Hourly Listening by Day of Week
        </h3>
        <div className="h-96 bg-gray-900 rounded-lg p-4 relative">
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Box plot visualization</p>
              <p className="text-sm">Hourly distribution patterns</p>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2 text-xs">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-gray-400">{day}</div>
          ))}
        </div>
      </motion.div>

      {/* Feature 25: Binge Listening */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5" />
          Binge Listening Tracks
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {bingeListeningData.map((track, index) => (
            <div key={`${track.month}-${track.track}`} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex-1">
                <div className="text-white font-medium">{track.track}</div>
                <div className="text-sm text-gray-400">{track.month}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-spotify-green">{track.plays}</div>
                <div className="text-xs text-gray-400">plays</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Feature 26: Growth Rate */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Year-over-Year Growth Rate
        </h3>
        <div className="space-y-3">
          {growthRateData.map((yearData) => (
            <div key={yearData.year} className="flex items-center gap-4">
              <div className="w-16 text-sm text-gray-400">{yearData.year}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    yearData.growthRate > 0 
                      ? 'bg-gradient-to-r from-green-500 to-green-400' 
                      : 'bg-gradient-to-r from-red-500 to-red-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.abs(yearData.growthRate))}%` }}
                />
              </div>
              <div className={`w-20 text-right text-sm font-medium ${
                yearData.growthRate > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {yearData.growthRate > 0 ? '+' : ''}{yearData.growthRate.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Feature 28: Temporal Patterns */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Clock3 className="w-5 h-5" />
          Hourly Listening Patterns
        </h3>
        <div className="h-64 bg-gray-900 rounded-lg p-4 relative">
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Clock3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Line chart visualization</p>
              <p className="text-sm">Average listening hours by hour of day</p>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-6 gap-2 text-xs">
          {['00', '04', '08', '12', '16', '20'].map(hour => (
            <div key={hour} className="text-center text-gray-400">{hour}:00</div>
          ))}
        </div>
      </motion.div>

      {/* Feature 30: Concentration Ratio */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Concentration Ratio
        </h3>
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-700"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(concentrationRatioData.concentrationRatio / 100) * 251.2} 251.2`}
                className="text-spotify-green transition-all duration-1000"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{concentrationRatioData.concentrationRatio.toFixed(1)}%</div>
                <div className="text-xs text-gray-400">top 10%</div>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {concentrationRatioData.top10PercentCount} artists out of {concentrationRatioData.totalArtists} 
            account for {concentrationRatioData.concentrationRatio.toFixed(1)}% of listening time
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
