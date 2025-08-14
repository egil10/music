'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { AnalyticsData } from '@/types/spotify'
import { formatNumber, formatDuration, formatDate } from '@/lib/utils'
import { 
  Brain,
  Calculator,
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
  BarChart3,
  PieChart,
  ScatterChart,
  Activity,
  Calendar,
  Clock,
  Flame
} from 'lucide-react'

interface ComprehensiveAnalyticsSectionProps {
  data: AnalyticsData
}

export function ComprehensiveAnalyticsSection({ data }: ComprehensiveAnalyticsSectionProps) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [projectedDailyHours, setProjectedDailyHours] = useState<number>(2.5)

  // Feature 6: Genre distribution (simplified)
  const genreDistribution = useMemo(() => {
    // Simplified genre inference based on artist names
    const genreKeywords: { [genre: string]: string[] } = {
      'Rock': ['rock', 'metal', 'punk', 'grunge', 'alternative'],
      'Pop': ['pop', 'indie', 'electronic', 'dance'],
      'Hip Hop': ['rap', 'hip hop', 'trap', 'r&b'],
      'Jazz': ['jazz', 'blues', 'soul'],
      'Classical': ['classical', 'orchestra', 'symphony'],
      'Country': ['country', 'folk', 'americana']
    }

    const artistGenres: { [artist: string]: string } = {}
    data.topArtists.forEach(artist => {
      const artistLower = artist.name.toLowerCase()
      for (const [genre, keywords] of Object.entries(genreKeywords)) {
        if (keywords.some(keyword => artistLower.includes(keyword))) {
          artistGenres[artist.name] = genre
          break
        }
      }
      if (!artistGenres[artist.name]) {
        artistGenres[artist.name] = 'Other'
      }
    })

    const genreHours: { [genre: string]: number } = {}
    data.streamingHistory.forEach(entry => {
      const genre = artistGenres[entry.artistName] || 'Other'
      const hours = entry.msPlayed / (1000 * 60 * 60)
      genreHours[genre] = (genreHours[genre] || 0) + hours
    })

    const totalHours = Object.values(genreHours).reduce((a, b) => a + b, 0)
    return Object.entries(genreHours)
      .map(([genre, hours]) => ({
        genre,
        hours,
        percentage: (hours / totalHours) * 100
      }))
      .sort((a, b) => b.hours - a.hours)
  }, [data.topArtists, data.streamingHistory])

  // Feature 10: Sankey diagram data (simplified)
  const sankeyData = useMemo(() => {
    const yearlyTopArtists: { [year: number]: string[] } = {}
    
    data.streamingHistory.forEach(entry => {
      const year = new Date(entry.endTime).getFullYear()
      if (!yearlyTopArtists[year]) {
        yearlyTopArtists[year] = []
      }
    })

    // Get top 5 artists for each year
    Object.keys(yearlyTopArtists).forEach(year => {
      const yearNum = parseInt(year)
      const yearData = data.streamingHistory.filter(entry => 
        new Date(entry.endTime).getFullYear() === yearNum
      )
      
      const artistHours: { [artist: string]: number } = {}
      yearData.forEach(entry => {
        const hours = entry.msPlayed / (1000 * 60 * 60)
        artistHours[entry.artistName] = (artistHours[entry.artistName] || 0) + hours
      })

      yearlyTopArtists[yearNum] = Object.entries(artistHours)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([artist]) => artist)
    })

    const years = Object.keys(yearlyTopArtists).map(Number).sort()
    const flows: Array<{ from: string; to: string; value: number }> = []

    years.slice(1).forEach(year => {
      const previousYear = year - 1
      const previousArtists = yearlyTopArtists[previousYear]
      const currentArtists = yearlyTopArtists[year]

      previousArtists.forEach(artist => {
        if (currentArtists.includes(artist)) {
          flows.push({
            from: `${artist} (${previousYear})`,
            to: `${artist} (${year})`,
            value: 1
          })
        }
      })
    })

    return { flows, years }
  }, [data.streamingHistory])

  // Feature 15: Timeline slider data
  const timelineData = useMemo(() => {
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

    return Object.entries(monthlyTracks)
      .map(([month, tracks]) => ({
        month,
        topTracks: Object.entries(tracks)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([track, plays]) => ({ track, plays }))
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [data.streamingHistory])

  // Feature 21: Network graph data (simplified)
  const networkData = useMemo(() => {
    const artistConnections: { [artist: string]: Set<string> } = {}
    
    // Find artists that appear in the same sessions
    data.sessions.forEach(session => {
      const artists = session.artists
      artists.forEach(artist1 => {
        if (!artistConnections[artist1]) {
          artistConnections[artist1] = new Set()
        }
        artists.forEach(artist2 => {
          if (artist1 !== artist2) {
            artistConnections[artist1].add(artist2)
          }
        })
      })
    })

    return Object.entries(artistConnections)
      .map(([artist, connections]) => ({
        artist,
        connections: Array.from(connections),
        connectionCount: connections.size
      }))
      .sort((a, b) => b.connectionCount - a.connectionCount)
      .slice(0, 20)
  }, [data.sessions])

  // Feature 29: Radar chart data for top 3 artists
  const radarChartData = useMemo(() => {
    const top3Artists = data.topArtists.slice(0, 3)
    
    return top3Artists.map(artist => ({
      name: artist.name,
      plays: artist.streams,
      hours: artist.totalTime / (1000 * 60 * 60),
      avgTrackLength: (artist.totalTime / artist.streams) / (1000 * 60),
      uniqueTracks: artist.uniqueTracks,
      rankStability: 1 // Placeholder
    }))
  }, [data.topArtists])

  // Feature 37: Monthly top track turnover
  const trackTurnover = useMemo(() => {
    const monthlyTopTracks: { [month: string]: string[] } = {}
    
    data.streamingHistory.forEach(entry => {
      const date = new Date(entry.endTime)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const trackKey = `${entry.artistName} - ${entry.trackName}`
      
      if (!monthlyTopTracks[month]) {
        monthlyTopTracks[month] = []
      }
    })

    Object.keys(monthlyTopTracks).forEach(month => {
      const monthData = data.streamingHistory.filter(entry => {
        const date = new Date(entry.endTime)
        const entryMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        return entryMonth === month
      })
      
      const trackPlays: { [track: string]: number } = {}
      monthData.forEach(entry => {
        const trackKey = `${entry.artistName} - ${entry.trackName}`
        trackPlays[trackKey] = (trackPlays[trackKey] || 0) + 1
      })

      monthlyTopTracks[month] = Object.entries(trackPlays)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([track]) => track)
    })

    const months = Object.keys(monthlyTopTracks).sort()
    const turnover = months.slice(1).map(month => {
      const previousMonth = months[months.indexOf(month) - 1]
      const currentTracks = new Set(monthlyTopTracks[month])
      const previousTracks = new Set(monthlyTopTracks[previousMonth])
      
      const newTracks = Array.from(currentTracks).filter(track => !previousTracks.has(track))
      return {
        month,
        newTracks: newTracks.length,
        totalTracks: currentTracks.size
      }
    })

    return turnover
  }, [data.streamingHistory])

  // Feature 39: Heat tree data
  const heatTreeData = useMemo(() => {
    const artistTrackPlays: { [artist: string]: { [track: string]: number } } = {}
    
    data.streamingHistory.forEach(entry => {
      const artist = entry.artistName
      const track = entry.trackName
      
      if (!artistTrackPlays[artist]) {
        artistTrackPlays[artist] = {}
      }
      artistTrackPlays[artist][track] = (artistTrackPlays[artist][track] || 0) + 1
    })

    return Object.entries(artistTrackPlays)
      .map(([artist, tracks]) => ({
        artist,
        tracks: Object.entries(tracks)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([track, plays]) => ({ track, plays }))
      }))
      .sort((a, b) => 
        Object.values(b.tracks).reduce((sum, track) => sum + track.plays, 0) - 
        Object.values(a.tracks).reduce((sum, track) => sum + track.plays, 0)
      )
      .slice(0, 10)
  }, [data.streamingHistory])

  // Feature 41: Velocity chart (new artists per month)
  const velocityData = useMemo(() => {
    const monthlyArtists: { [month: string]: Set<string> } = {}
    const cumulativeArtists: { [month: string]: Set<string> } = {}
    
    data.streamingHistory.forEach(entry => {
      const date = new Date(entry.endTime)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyArtists[month]) {
        monthlyArtists[month] = new Set()
        cumulativeArtists[month] = new Set()
      }
      
      monthlyArtists[month].add(entry.artistName)
    })

    const months = Object.keys(monthlyArtists).sort()
    let cumulativeSet = new Set<string>()

    return months.map(month => {
      const newArtists = Array.from(monthlyArtists[month])
      cumulativeSet = new Set([...cumulativeSet, ...newArtists])
      
      return {
        month,
        newArtists: newArtists.length,
        cumulativeArtists: cumulativeSet.size
      }
    })
  }, [data.streamingHistory])

  // Feature 43: Decomposition chart data
  const decompositionData = useMemo(() => {
    const monthlyHours: { [month: string]: number } = {}
    
    data.streamingHistory.forEach(entry => {
      const date = new Date(entry.endTime)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const hours = entry.msPlayed / (1000 * 60 * 60)
      
      monthlyHours[month] = (monthlyHours[month] || 0) + hours
    })

    const months = Object.keys(monthlyHours).sort()
    const values = months.map(month => monthlyHours[month])
    
    // Simple trend calculation
    const n = values.length
    const xMean = (n - 1) / 2
    const yMean = values.reduce((a, b) => a + b, 0) / n
    
    let numerator = 0
    let denominator = 0
    
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean)
      denominator += Math.pow(i - xMean, 2)
    }
    
    const slope = numerator / denominator
    const intercept = yMean - slope * xMean

    return {
      months,
      values,
      trend: months.map((_, i) => intercept + slope * i),
      seasonality: values.map((value, i) => value - (intercept + slope * i)),
      residuals: values.map((value, i) => value - (intercept + slope * i))
    }
  }, [data.streamingHistory])

  // Feature 45: Survival curve data
  const survivalCurveData = useMemo(() => {
    const trackFirstPlay: { [track: string]: string } = {}
    const trackLastPlay: { [track: string]: string } = {}
    
    data.streamingHistory.forEach(entry => {
      const trackKey = `${entry.artistName} - ${entry.trackName}`
      const date = entry.endTime.split('T')[0]
      
      if (!trackFirstPlay[trackKey] || date < trackFirstPlay[trackKey]) {
        trackFirstPlay[trackKey] = date
      }
      if (!trackLastPlay[trackKey] || date > trackLastPlay[trackKey]) {
        trackLastPlay[trackKey] = date
      }
    })

    const trackLifespans = Object.keys(trackFirstPlay).map(track => {
      const first = new Date(trackFirstPlay[track])
      const last = new Date(trackLastPlay[track])
      const days = Math.ceil((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24))
      return { track, days }
    }).sort((a, b) => b.days - a.days)

    return trackLifespans.slice(0, 50)
  }, [data.streamingHistory])

  // Feature 46: Cluster analysis (simplified)
  const clusterData = useMemo(() => {
    const dailyProfiles: { [date: string]: { [artist: string]: number } } = {}
    
    data.streamingHistory.forEach(entry => {
      const date = entry.endTime.split('T')[0]
      const hours = entry.msPlayed / (1000 * 60 * 60)
      
      if (!dailyProfiles[date]) {
        dailyProfiles[date] = {}
      }
      dailyProfiles[date][entry.artistName] = (dailyProfiles[date][entry.artistName] || 0) + hours
    })

    return Object.entries(dailyProfiles)
      .map(([date, artists]) => ({
        date,
        topArtists: Object.entries(artists)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([artist, hours]) => ({ artist, hours }))
      }))
      .sort((a, b) => 
        b.topArtists.reduce((sum, artist) => sum + artist.hours, 0) - 
        a.topArtists.reduce((sum, artist) => sum + artist.hours, 0)
      )
      .slice(0, 20)
  }, [data.streamingHistory])

  // Feature 48: Value over time
  const valueOverTime = useMemo(() => {
    const dailyHours: { [date: string]: number } = {}
    
    data.streamingHistory.forEach(entry => {
      const date = entry.endTime.split('T')[0]
      const hours = entry.msPlayed / (1000 * 60 * 60)
      dailyHours[date] = (dailyHours[date] || 0) + hours
    })

    const dates = Object.keys(dailyHours).sort()
    let cumulativeHours = 0

    return dates.map(date => {
      cumulativeHours += dailyHours[date]
      return {
        date,
        dailyHours: dailyHours[date],
        cumulativeHours
      }
    })
  }, [data.streamingHistory])

  // Feature 49: What-if simulator
  const whatIfSimulation = useMemo(() => {
    const currentDate = new Date()
    const endOfYear = new Date(currentDate.getFullYear(), 11, 31)
    const daysRemaining = Math.ceil((endOfYear.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const currentTotalHours = data.stats.totalTime / (1000 * 60 * 60)
    const projectedHours = projectedDailyHours * daysRemaining
    const projectedTotal = currentTotalHours + projectedHours
    
    return {
      currentTotalHours,
      projectedHours,
      projectedTotal,
      daysRemaining,
      currentDailyAverage: currentTotalHours / data.stats.dateRange.days
    }
  }, [data.stats, projectedDailyHours])

  // Feature 50: AI-generated insights
  const aiInsights = useMemo(() => {
    const totalHours = data.stats.totalTime / (1000 * 60 * 60)
    const avgDailyHours = totalHours / data.stats.dateRange.days
    
    const yearlyGrowth = (() => {
      const yearlyHours: { [year: number]: number } = {}
      data.streamingHistory.forEach(entry => {
        const year = new Date(entry.endTime).getFullYear()
        const hours = entry.msPlayed / (1000 * 60 * 60)
        yearlyHours[year] = (yearlyHours[year] || 0) + hours
      })
      
      const years = Object.keys(yearlyHours).map(Number).sort()
      if (years.length >= 2) {
        const latest = yearlyHours[years[years.length - 1]]
        const previous = yearlyHours[years[years.length - 2]]
        return ((latest - previous) / previous) * 100
      }
      return 0
    })()

    const topGenre = genreDistribution[0]?.genre || 'Unknown'
    const diversityScore = data.concentrationMetrics.diversityScore * 100

    return {
      totalHours: totalHours.toFixed(1),
      avgDailyHours: avgDailyHours.toFixed(1),
      yearlyGrowth: yearlyGrowth.toFixed(1),
      topGenre,
      diversityScore: diversityScore.toFixed(1),
      totalArtists: data.stats.uniqueArtists,
      totalTracks: data.stats.uniqueTracks
    }
  }, [data, genreDistribution])

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
          Comprehensive Analytics
        </h1>
        <p className="text-gray-400 text-lg">
          Advanced insights and predictive analytics
        </p>
      </motion.div>

      {/* Feature 50: AI-Generated Insights */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI-Generated Insights
        </h3>
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-6 rounded-lg">
          <div className="text-lg text-white mb-4">
            Your listening journey shows remarkable consistency and growth. You've spent{' '}
            <span className="text-spotify-green font-bold">{aiInsights.totalHours} hours</span> listening to music, 
            averaging <span className="text-blue-400 font-bold">{aiInsights.avgDailyHours} hours per day</span>.
          </div>
          <div className="text-lg text-white mb-4">
            Your listening increased by{' '}
            <span className={`font-bold ${parseFloat(aiInsights.yearlyGrowth) > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {aiInsights.yearlyGrowth}%
            </span> year-over-year, with{' '}
            <span className="text-purple-400 font-bold">{aiInsights.topGenre}</span> being your dominant genre.
          </div>
          <div className="text-lg text-white">
            You've discovered{' '}
            <span className="text-yellow-400 font-bold">{formatNumber(aiInsights.totalArtists)} artists</span> and{' '}
            <span className="text-pink-400 font-bold">{formatNumber(aiInsights.totalTracks)} tracks</span>, 
            showing a diversity score of{' '}
            <span className="text-spotify-green font-bold">{aiInsights.diversityScore}%</span>.
          </div>
        </div>
      </motion.div>

      {/* Feature 6: Genre Distribution */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          Genre Distribution
        </h3>
        <div className="space-y-3">
          {genreDistribution.map((genre) => (
            <div key={genre.genre} className="flex items-center gap-4">
              <div className="w-24 text-sm text-gray-400">{genre.genre}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-spotify-green to-green-400 rounded-full transition-all duration-500"
                  style={{ width: `${genre.percentage}%` }}
                />
              </div>
              <div className="w-20 text-right text-sm text-white font-medium">
                {genre.percentage.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Feature 37: Track Turnover */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Monthly Track Turnover
        </h3>
        <div className="space-y-3">
          {trackTurnover.map((month) => (
            <div key={month.month} className="flex items-center gap-4">
              <div className="w-20 text-sm text-gray-400">{month.month}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${(month.newTracks / month.totalTracks) * 100}%` }}
                />
              </div>
              <div className="w-24 text-right text-sm text-white font-medium">
                {month.newTracks} new
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-2">
          New tracks entering top 10 each month
        </div>
      </motion.div>

      {/* Feature 41: Velocity Chart */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Artist Discovery Velocity
        </h3>
        <div className="space-y-3">
          {velocityData.map((month) => (
            <div key={month.month} className="flex items-center gap-4">
              <div className="w-20 text-sm text-gray-400">{month.month}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${(month.newArtists / Math.max(...velocityData.map(m => m.newArtists))) * 100}%` }}
                />
              </div>
              <div className="w-24 text-right text-sm text-white font-medium">
                +{month.newArtists}
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-2">
          New artists discovered per month
        </div>
      </motion.div>

      {/* Feature 48: Value Over Time */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Cumulative Listening Value
        </h3>
        <div className="h-64 bg-gray-900 rounded-lg p-4 relative">
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Cumulative listening hours over time</p>
              <p className="text-sm">Total: {valueOverTime[valueOverTime.length - 1]?.cumulativeHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Feature 49: What-If Simulator */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          End-of-Year Projection
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-gray-300">Daily Average (hours):</label>
            <input
              type="range"
              min="0"
              max="8"
              step="0.1"
              value={projectedDailyHours}
              onChange={(e) => setProjectedDailyHours(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-white font-medium w-12">{projectedDailyHours}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{whatIfSimulation.currentTotalHours.toFixed(1)}h</div>
              <div className="text-sm text-gray-400">Current Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-spotify-green">{whatIfSimulation.projectedTotal.toFixed(1)}h</div>
              <div className="text-sm text-gray-400">Projected Total</div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg text-gray-300">
              +{whatIfSimulation.projectedHours.toFixed(1)}h in {whatIfSimulation.daysRemaining} days
            </div>
          </div>
        </div>
      </motion.div>

      {/* Feature 45: Survival Curve */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Track Survival Analysis
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {survivalCurveData.map((track, index) => (
            <div key={track.track} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex-1">
                <div className="text-white font-medium">{track.track}</div>
                <div className="text-sm text-gray-400">Track #{index + 1}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-400">{track.days}</div>
                <div className="text-xs text-gray-400">days active</div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-2">
          How long tracks stay in heavy rotation
        </div>
      </motion.div>

      {/* Feature 46: Cluster Analysis */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Network className="w-5 h-5" />
          Listening Day Clusters
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {clusterData.map((day, index) => (
            <div key={day.date} className="p-3 bg-gray-800 rounded-lg">
              <div className="text-white font-medium mb-2">
                {formatDate(new Date(day.date))} - Cluster #{index + 1}
              </div>
              <div className="space-y-1">
                {day.topArtists.map((artist, artistIndex) => (
                  <div key={artist.artist} className="text-sm text-gray-300">
                    {artistIndex + 1}. {artist.artist} ({artist.hours.toFixed(1)}h)
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Similar listening days grouped by top content
        </div>
      </motion.div>
    </motion.div>
  )
}
