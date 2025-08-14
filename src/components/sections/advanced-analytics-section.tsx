'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { AnalyticsData } from '@/types/spotify'
import { formatNumber, formatDuration, formatDate } from '@/lib/utils'
import { 
  Clock, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  ScatterChart,
  Gauge,
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
  HelpCircle
} from 'lucide-react'

interface AdvancedAnalyticsSectionProps {
  data: AnalyticsData
}

export function AdvancedAnalyticsSection({ data }: AdvancedAnalyticsSectionProps) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMetric, setSelectedMetric] = useState<string>('hours')

  // Feature 1: Lifetime listening hours metric card
  const lifetimeHours = useMemo(() => {
    const totalMs = data.stats.totalTime
    return (totalMs / (1000 * 60 * 60)).toFixed(1)
  }, [data.stats.totalTime])

  // Feature 2: Yearly plays comparison
  const yearlyPlays = useMemo(() => {
    const playsByYear: { [year: number]: number } = {}
    data.streamingHistory.forEach(entry => {
      const year = new Date(entry.endTime).getFullYear()
      playsByYear[year] = (playsByYear[year] || 0) + 1
    })
    return Object.entries(playsByYear)
      .map(([year, plays]) => ({ year: parseInt(year), plays }))
      .sort((a, b) => a.year - b.year)
  }, [data.streamingHistory])

  // Feature 3: Listening hours trend per year
  const yearlyHours = useMemo(() => {
    const hoursByYear: { [year: number]: number } = {}
    data.streamingHistory.forEach(entry => {
      const year = new Date(entry.endTime).getFullYear()
      const hours = entry.msPlayed / (1000 * 60 * 60)
      hoursByYear[year] = (hoursByYear[year] || 0) + hours
    })
    return Object.entries(hoursByYear)
      .map(([year, hours]) => ({ year: parseInt(year), hours: parseFloat(hours.toFixed(1)) }))
      .sort((a, b) => a.year - b.year)
  }, [data.streamingHistory])

  // Feature 4: Top 10 artists by cumulative hours (logarithmic)
  const topArtistsByHours = useMemo(() => {
    return data.topArtists
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 10)
      .map(artist => ({
        name: artist.name,
        hours: artist.totalTime / (1000 * 60 * 60),
        plays: artist.streams
      }))
  }, [data.topArtists])

  // Feature 5: Sortable table data for selected year
  const yearArtists = useMemo(() => {
    const yearData = data.streamingHistory.filter(entry => 
      new Date(entry.endTime).getFullYear() === selectedYear
    )
    
    const artistStats: { [artist: string]: { plays: number; totalMs: number; tracks: Set<string> } } = {}
    
    yearData.forEach(entry => {
      if (!artistStats[entry.artistName]) {
        artistStats[entry.artistName] = { plays: 0, totalMs: 0, tracks: new Set() }
      }
      artistStats[entry.artistName].plays++
      artistStats[entry.artistName].totalMs += entry.msPlayed
      artistStats[entry.artistName].tracks.add(entry.trackName)
    })

    return Object.entries(artistStats)
      .map(([artist, stats]) => ({
        artist,
        plays: stats.plays,
        hours: stats.totalMs / (1000 * 60 * 60),
        avgMinutes: (stats.totalMs / stats.plays) / (1000 * 60),
        uniqueTracks: stats.tracks.size
      }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 20)
  }, [data.streamingHistory, selectedYear])

  // Feature 8: Average daily listening hours
  const averageDailyHours = useMemo(() => {
    const totalDays = data.stats.dateRange.days
    const totalHours = data.stats.totalTime / (1000 * 60 * 60)
    return totalHours / totalDays
  }, [data.stats])

  // Feature 9: Calendar heatmap data
  const dailyListeningHours = useMemo(() => {
    const dailyHours: { [date: string]: number } = {}
    data.streamingHistory.forEach(entry => {
      const date = entry.endTime.split('T')[0]
      const hours = entry.msPlayed / (1000 * 60 * 60)
      dailyHours[date] = (dailyHours[date] || 0) + hours
    })
    return dailyHours
  }, [data.streamingHistory])

  // Feature 12: Bubble chart data for top tracks
  const topTracksBubble = useMemo(() => {
    return data.topTracks.slice(0, 20).map(track => ({
      name: track.name,
      artist: track.artist,
      plays: track.streams,
      hours: track.totalTime / (1000 * 60 * 60),
      year: track.releaseYear || 2020
    }))
  }, [data.topTracks])

  // Feature 13: Diversity index over years
  const diversityIndex = useMemo(() => {
    const diversityByYear: { [year: number]: number } = {}
    data.streamingHistory.forEach(entry => {
      const year = new Date(entry.endTime).getFullYear()
      if (!diversityByYear[year]) {
        diversityByYear[year] = 0
      }
      diversityByYear[year]++
    })
    
    // Calculate diversity index (unique artists / total plays)
    const uniqueArtistsByYear: { [year: number]: Set<string> } = {}
    data.streamingHistory.forEach(entry => {
      const year = new Date(entry.endTime).getFullYear()
      if (!uniqueArtistsByYear[year]) {
        uniqueArtistsByYear[year] = new Set()
      }
      uniqueArtistsByYear[year].add(entry.artistName)
    })

    return Object.keys(diversityByYear).map(year => {
      const yearNum = parseInt(year)
      const totalPlays = diversityByYear[yearNum]
      const uniqueArtists = uniqueArtistsByYear[yearNum].size
      return {
        year: yearNum,
        diversityIndex: uniqueArtists / totalPlays,
        uniqueArtists,
        totalPlays
      }
    }).sort((a, b) => a.year - b.year)
  }, [data.streamingHistory])

  // Feature 16: Peak listening day
  const peakListeningDay = useMemo(() => {
    const dailyTotals = Object.entries(dailyListeningHours)
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => b.hours - a.hours)[0]

    if (!peakListeningDay) return null

    const peakDayTracks = data.streamingHistory
      .filter(entry => entry.endTime.startsWith(peakListeningDay.date))
      .reduce((acc, entry) => {
        const key = `${entry.artistName} - ${entry.trackName}`
        acc[key] = (acc[key] || 0) + entry.msPlayed
        return acc
      }, {} as { [key: string]: number })

    const topTrack = Object.entries(peakDayTracks)
      .sort(([, ms], [, ms2]) => ms2 - ms)[0]

    return {
      date: peakListeningDay.date,
      hours: peakListeningDay.hours,
      topTrack: topTrack ? topTrack[0] : 'Unknown'
    }
  }, [dailyListeningHours, data.streamingHistory])

  // Feature 20: Most improved artist
  const mostImprovedArtist = useMemo(() => {
    const artistGrowth: { [artist: string]: { [year: number]: number } } = {}
    
    data.streamingHistory.forEach(entry => {
      const year = new Date(entry.endTime).getFullYear()
      const hours = entry.msPlayed / (1000 * 60 * 60)
      
      if (!artistGrowth[entry.artistName]) {
        artistGrowth[entry.artistName] = {}
      }
      artistGrowth[entry.artistName][year] = (artistGrowth[entry.artistName][year] || 0) + hours
    })

    const improvements = Object.entries(artistGrowth)
      .filter(([, years]) => Object.keys(years).length >= 2)
      .map(([artist, years]) => {
        const yearEntries = Object.entries(years).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        const latest = yearEntries[yearEntries.length - 1]
        const previous = yearEntries[yearEntries.length - 2]
        
        return {
          artist,
          previousYear: parseInt(previous[0]),
          previousHours: previous[1],
          currentYear: parseInt(latest[0]),
          currentHours: latest[1],
          improvement: latest[1] - previous[1]
        }
      })
      .filter(item => item.improvement > 0)
      .sort((a, b) => b.improvement - a.improvement)

    return improvements[0] || null
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
          Advanced Analytics
        </h1>
        <p className="text-gray-400 text-lg">
          Deep insights into your listening patterns and trends
        </p>
      </motion.div>

      {/* Feature 1: Lifetime Listening Hours Metric Card */}
      <motion.div variants={itemVariants} className="spotify-card p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-spotify-green/20 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-spotify-green" />
          </div>
          <div className="text-5xl font-bold text-white mb-2">
            {lifetimeHours} hours
          </div>
          <div className="text-xl text-gray-300 mb-4">
            Total Lifetime Listening
          </div>
          <div className="text-sm text-gray-400 flex items-center justify-center gap-2">
            <Info className="w-4 h-4" />
            Calculated from {formatNumber(data.stats.totalTime)} milliseconds of listening
          </div>
        </div>
      </motion.div>

      {/* Feature 2: Yearly Plays Comparison */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Total Plays by Year
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {yearlyPlays.map((yearData, index) => (
            <div key={yearData.year} className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {formatNumber(yearData.plays)}
              </div>
              <div className="text-sm text-gray-400">
                {yearData.year}
              </div>
              <div 
                className="mt-2 h-2 rounded-full bg-gradient-to-t from-spotify-green to-green-400"
                style={{ 
                  width: '100%',
                  opacity: 0.3 + (0.7 * (yearData.plays / Math.max(...yearlyPlays.map(y => y.plays))))
                }}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Feature 3: Listening Hours Trend */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Listening Hours Trend
        </h3>
        <div className="space-y-3">
          {yearlyHours.map((yearData, index) => (
            <div key={yearData.year} className="flex items-center gap-4">
              <div className="w-16 text-sm text-gray-400">{yearData.year}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(yearData.hours / Math.max(...yearlyHours.map(y => y.hours))) * 100}%`
                  }}
                />
              </div>
              <div className="w-20 text-right text-sm text-white font-medium">
                {yearData.hours.toFixed(1)}h
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Feature 4: Top Artists by Hours (Logarithmic) */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Crown className="w-5 h-5" />
          Top Artists by Cumulative Hours
        </h3>
        <div className="space-y-3">
          {topArtistsByHours.map((artist, index) => (
            <div key={artist.name} className="flex items-center gap-4">
              <div className="w-8 text-sm text-gray-400">#{index + 1}</div>
              <div className="flex-1">
                <div className="text-sm text-white font-medium">{artist.name}</div>
                <div className="text-xs text-gray-400">{formatNumber(artist.plays)} plays</div>
              </div>
              <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.log(artist.hours + 1) / Math.log(Math.max(...topArtistsByHours.map(a => a.hours)) + 1) * 100}%`
                  }}
                />
              </div>
              <div className="w-16 text-right text-sm text-white font-medium">
                {artist.hours.toFixed(1)}h
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Feature 5: Sortable Year Artists Table */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Top Artists in {selectedYear}
          </h3>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600"
          >
            {Array.from(new Set(data.streamingHistory.map(entry => 
              new Date(entry.endTime).getFullYear()
            ))).sort().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 text-gray-400">Artist</th>
                <th className="text-right py-2 text-gray-400">Plays</th>
                <th className="text-right py-2 text-gray-400">Hours</th>
                <th className="text-right py-2 text-gray-400">Avg Min</th>
                <th className="text-right py-2 text-gray-400">Tracks</th>
              </tr>
            </thead>
            <tbody>
              {yearArtists.map((artist, index) => (
                <tr key={artist.artist} className="border-b border-gray-800">
                  <td className="py-2 text-white">{artist.artist}</td>
                  <td className="py-2 text-right text-gray-300">{formatNumber(artist.plays)}</td>
                  <td className="py-2 text-right text-gray-300">{artist.hours.toFixed(1)}</td>
                  <td className="py-2 text-right text-gray-300">{artist.avgMinutes.toFixed(1)}</td>
                  <td className="py-2 text-right text-gray-300">{artist.uniqueTracks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Feature 8: Average Daily Listening Gauge */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Gauge className="w-5 h-5" />
          Average Daily Listening
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
                strokeDasharray={`${(averageDailyHours / 8) * 251.2} 251.2`}
                className="text-spotify-green transition-all duration-1000"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{averageDailyHours.toFixed(1)}h</div>
                <div className="text-xs text-gray-400">per day</div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-4 text-sm">
            <div className="text-gray-400">Low: &lt;2h</div>
            <div className="text-yellow-400">Medium: 2-4h</div>
            <div className="text-green-400">High: &gt;4h</div>
          </div>
        </div>
      </motion.div>

      {/* Feature 16: Peak Listening Day */}
      {peakListeningDay && (
        <motion.div variants={itemVariants} className="spotify-card p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Peak Listening Day
          </h3>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {peakListeningDay.hours.toFixed(1)} hours
            </div>
            <div className="text-lg text-gray-300 mb-2">
              {formatDate(new Date(peakListeningDay.date))}
            </div>
            <div className="text-sm text-gray-400">
              Top track: {peakListeningDay.topTrack}
            </div>
          </div>
        </motion.div>
      )}

      {/* Feature 20: Most Improved Artist */}
      {mostImprovedArtist && (
        <motion.div variants={itemVariants} className="spotify-card p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Most Improved Artist
          </h3>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">
              {mostImprovedArtist.artist}
            </div>
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <div className="text-gray-400">{mostImprovedArtist.previousYear}</div>
                <div className="text-white font-medium">{mostImprovedArtist.previousHours.toFixed(1)}h</div>
              </div>
              <div className="flex items-center">
                <ArrowUpRight className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-gray-400">{mostImprovedArtist.currentYear}</div>
                <div className="text-white font-medium">{mostImprovedArtist.currentHours.toFixed(1)}h</div>
              </div>
            </div>
            <div className="text-green-400 font-medium mt-2">
              +{mostImprovedArtist.improvement.toFixed(1)} hours improvement
            </div>
          </div>
        </motion.div>
      )}

      {/* Feature 13: Diversity Index Trend */}
      <motion.div variants={itemVariants} className="spotify-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Diversity Index Evolution
        </h3>
        <div className="space-y-3">
          {diversityIndex.map((yearData) => (
            <div key={yearData.year} className="flex items-center gap-4">
              <div className="w-16 text-sm text-gray-400">{yearData.year}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${(yearData.diversityIndex * 100)}%` }}
                />
              </div>
              <div className="w-20 text-right text-sm text-white font-medium">
                {(yearData.diversityIndex * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Diversity Index = Unique Artists / Total Plays
        </div>
      </motion.div>
    </motion.div>
  )
}
