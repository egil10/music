'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnalyticsData } from '@/types/spotify'
import { Navigation } from './navigation'
import { OverviewSection } from './sections/overview-section'
import { TopArtistsSection } from './sections/top-artists-section'
import { TopTracksSection } from './sections/top-tracks-section'
import { ListeningHabitsSection } from './sections/listening-habits-section'
import { ConcentrationSection } from './sections/concentration-section'
import { DiscoverySection } from './sections/discovery-section'
import { MoodAnalysisSection } from './sections/mood-analysis-section'
import { GenreAnalysisSection } from './sections/genre-analysis-section'
import { ReleaseYearSection } from './sections/release-year-section'
import { HabitStreaksSection } from './sections/habit-streaks-section'
import { ArtistJourneySection } from './sections/artist-journey-section'
import { SeasonalitySection } from './sections/seasonality-section'
import { SessionsSection } from './sections/sessions-section'
import { PlaylistsSection } from './sections/playlists-section'
import { AdvancedAnalyticsSection } from './sections/advanced-analytics-section'
import { VisualizationSection } from './sections/visualization-section'
import { InsightsSection } from './sections/insights-section'
import { ComprehensiveAnalyticsSection } from './sections/comprehensive-analytics-section'

interface DashboardProps {
  data: AnalyticsData
}

type SectionType = 
  | 'overview'
  | 'top-artists'
  | 'top-tracks'
  | 'listening-habits'
  | 'concentration'
  | 'discovery'
  | 'mood-analysis'
  | 'genre-analysis'
  | 'release-year'
  | 'habit-streaks'
  | 'artist-journey'
  | 'seasonality'
  | 'sessions'
  | 'playlists'
  | 'advanced-analytics'
  | 'visualization'
  | 'insights'
  | 'comprehensive-analytics'

const sections = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'top-artists', label: 'Top Artists', icon: '🎤' },
  { id: 'top-tracks', label: 'Top Tracks', icon: '🎵' },
  { id: 'listening-habits', label: 'Listening Habits', icon: '⏰' },
  { id: 'concentration', label: 'Concentration', icon: '🎯' },
  { id: 'discovery', label: 'Discovery', icon: '🔍' },
  { id: 'mood-analysis', label: 'Mood Analysis', icon: '😊' },
  { id: 'genre-analysis', label: 'Genre Mix', icon: '🎼' },
  { id: 'release-year', label: 'Release Years', icon: '📅' },
  { id: 'habit-streaks', label: 'Habits & Streaks', icon: '🔥' },
  { id: 'artist-journey', label: 'Artist Journey', icon: '🛤️' },
  { id: 'seasonality', label: 'Seasonality', icon: '🌱' },
  { id: 'sessions', label: 'Listening Sessions', icon: '🎧' },
  { id: 'playlists', label: 'Playlists', icon: '📝' },
  { id: 'advanced-analytics', label: 'Advanced Analytics', icon: '📈' },
  { id: 'visualization', label: 'Visualizations', icon: '📊' },
  { id: 'insights', label: 'Deep Insights', icon: '🧠' },
  { id: 'comprehensive-analytics', label: 'Comprehensive', icon: '🎯' },
] as const

export function Dashboard({ data }: DashboardProps) {
  const [activeSection, setActiveSection] = useState<SectionType>('overview')

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection data={data} />
      case 'top-artists':
        return <TopArtistsSection data={data} />
      case 'top-tracks':
        return <TopTracksSection data={data} />
      case 'listening-habits':
        return <ListeningHabitsSection data={data} />
      case 'concentration':
        return <ConcentrationSection data={data} />
      case 'discovery':
        return <DiscoverySection data={data} />
      case 'mood-analysis':
        return <MoodAnalysisSection data={data} />
      case 'genre-analysis':
        return <GenreAnalysisSection data={data} />
      case 'release-year':
        return <ReleaseYearSection data={data} />
      case 'habit-streaks':
        return <HabitStreaksSection data={data} />
      case 'artist-journey':
        return <ArtistJourneySection data={data} />
      case 'seasonality':
        return <SeasonalitySection data={data} />
      case 'sessions':
        return <SessionsSection data={data} />
      case 'playlists':
        return <PlaylistsSection data={data} />
      case 'advanced-analytics':
        return <AdvancedAnalyticsSection data={data} />
      case 'visualization':
        return <VisualizationSection data={data} />
      case 'insights':
        return <InsightsSection data={data} />
      case 'comprehensive-analytics':
        return <ComprehensiveAnalyticsSection data={data} />
      default:
        return <OverviewSection data={data} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-black via-gray-900 to-black">
      {/* Navigation */}
      <Navigation
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
