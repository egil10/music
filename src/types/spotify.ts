// Spotify Data Types
export interface SpotifyStreamingHistory {
  endTime: string;
  artistName: string;
  trackName: string;
  msPlayed: number;
  albumName?: string;
  spotifyTrackUri?: string;
  episodeName?: string;
  spotifyEpisodeUri?: string;
  reasonStart?: string;
  reasonEnd?: string;
  shuffle?: boolean;
  skipped?: boolean;
  offline?: boolean;
  offlineTimestamp?: number;
  incognitoMode?: boolean;
}

export interface SpotifyPlaylist {
  name: string;
  lastModifiedDate: string;
  items: SpotifyPlaylistItem[];
  numberOfFollowers?: number;
  description?: string;
  spotifyPlaylistUri?: string;
}

export interface SpotifyPlaylistItem {
  track: {
    trackName: string;
    trackUri: string;
    artistName: string;
    artistUri: string;
    albumName: string;
    albumUri: string;
    albumArtistName: string;
    duration: number;
    addedAt: string;
  };
}

export interface SpotifyArtist {
  name: string;
  uri?: string;
  streams: number;
  totalTime: number;
  uniqueTracks: number;
  genres?: string[];
  firstPlayed?: Date;
  lastPlayed?: Date;
  averageEnergy?: number;
  averageValence?: number;
  averageDanceability?: number;
}

export interface SpotifyTrack {
  name: string;
  artist: string;
  album?: string;
  uri?: string;
  streams: number;
  totalTime: number;
  firstPlayed?: Date;
  lastPlayed?: Date;
  releaseYear?: number;
  energy?: number;
  valence?: number;
  danceability?: number;
  tempo?: number;
  key?: number;
  mode?: number;
  acousticness?: number;
  instrumentalness?: number;
  liveness?: number;
  loudness?: number;
  speechiness?: number;
}

export interface SpotifyAlbum {
  name: string;
  artist: string;
  uri?: string;
  streams: number;
  totalTime: number;
  tracks: number;
  releaseYear?: number;
  genres?: string[];
}

// Analytics Types
export interface ListeningSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  tracks: SpotifyStreamingHistory[];
  artists: string[];
  totalStreams: number;
  averageEnergy?: number;
  averageValence?: number;
  averageDanceability?: number;
  context?: 'focus' | 'workout' | 'sleep' | 'casual' | 'unknown';
}

export interface TimeAnalysis {
  hourly: { [hour: number]: number };
  daily: { [day: number]: number };
  monthly: { [month: string]: number };
  yearly: { [year: number]: number };
  weekday: { [day: string]: number };
}

export interface ConcentrationMetrics {
  artistHHI: number;
  trackHHI: number;
  albumHHI: number;
  artistGini: number;
  trackGini: number;
  diversityScore: number;
  topArtistShare: number;
  topTrackShare: number;
}

export interface DiscoveryMetrics {
  newTracksThisWeek: number;
  newTracksThisMonth: number;
  newTracksThisYear: number;
  repeatRate: number;
  discoveryRate: number;
  comfortZoneScore: number;
  firstTimeListens: { [trackId: string]: Date };
}

export interface MoodAnalysis {
  energy: { [date: string]: number };
  valence: { [date: string]: number };
  danceability: { [date: string]: number };
  averageEnergy: number;
  averageValence: number;
  averageDanceability: number;
  energyTrend: 'increasing' | 'decreasing' | 'stable';
  valenceTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface GenreAnalysis {
  genres: { [genre: string]: number };
  topGenres: Array<{ genre: string; streams: number; percentage: number }>;
  genreEvolution: { [year: number]: { [genre: string]: number } };
  genreDiversity: number;
}

export interface ReleaseYearAnalysis {
  years: { [year: number]: number };
  nostalgiaScore: number;
  currentYearPercentage: number;
  vintagePercentage: number;
  averageReleaseYear: number;
  decadeBreakdown: { [decade: string]: number };
}

export interface HabitStreaks {
  longestDailyStreak: number;
  currentStreak: number;
  longestListeningSession: number;
  averageSessionLength: number;
  totalSessions: number;
  milestones: Array<{
    type: 'streams' | 'time' | 'artists' | 'tracks';
    value: number;
    achievedAt: Date;
    description: string;
  }>;
}

export interface ArtistJourney {
  transitions: { [fromArtist: string]: { [toArtist: string]: number } };
  mostCommonTransitions: Array<{
    from: string;
    to: string;
    count: number;
  }>;
  artistClusters: Array<{
    artists: string[];
    strength: number;
  }>;
}

export interface SeasonalityAnalysis {
  weeklyPattern: { [weekday: string]: number };
  monthlyPattern: { [month: string]: number };
  yearlyTrend: { [year: number]: number };
  seasonalPeaks: Array<{
    period: string;
    value: number;
    description: string;
  }>;
}

// Dashboard Data Types
export interface DashboardStats {
  totalStreams: number;
  totalTime: number;
  uniqueArtists: number;
  uniqueTracks: number;
  uniqueAlbums: number;
  averageSessionLength: number;
  totalSessions: number;
  dateRange: {
    start: Date;
    end: Date;
    days: number;
  };
}

export interface PeriodComparison {
  periodA: {
    name: string;
    start: Date;
    end: Date;
    stats: DashboardStats;
    topArtists: SpotifyArtist[];
    topTracks: SpotifyTrack[];
    genres: GenreAnalysis;
  };
  periodB: {
    name: string;
    start: Date;
    end: Date;
    stats: DashboardStats;
    topArtists: SpotifyArtist[];
    topTracks: SpotifyTrack[];
    genres: GenreAnalysis;
  };
  differences: {
    streamsChange: number;
    timeChange: number;
    artistChange: number;
    trackChange: number;
    genreChanges: Array<{
      genre: string;
      change: number;
    }>;
  };
}

export interface AnalyticsData {
  stats: DashboardStats;
  topArtists: SpotifyArtist[];
  topTracks: SpotifyTrack[];
  topAlbums: SpotifyAlbum[];
  timeAnalysis: TimeAnalysis;
  concentrationMetrics: ConcentrationMetrics;
  discoveryMetrics: DiscoveryMetrics;
  moodAnalysis: MoodAnalysis;
  genreAnalysis: GenreAnalysis;
  releaseYearAnalysis: ReleaseYearAnalysis;
  habitStreaks: HabitStreaks;
  artistJourney: ArtistJourney;
  seasonalityAnalysis: SeasonalityAnalysis;
  sessions: ListeningSession[];
  playlists: SpotifyPlaylist[];
  streamingHistory: SpotifyStreamingHistory[];
}

// UI Component Types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'radar' | 'heatmap' | 'scatter';
  data: ChartDataPoint[];
  options?: {
    title?: string;
    subtitle?: string;
    showLegend?: boolean;
    showGrid?: boolean;
    animate?: boolean;
  };
}

export interface FilterOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  artists?: string[];
  genres?: string[];
  minStreams?: number;
  minTime?: number;
  releaseYearRange?: {
    start: number;
    end: number;
  };
}

// Export Types
export interface ExportOptions {
  format: 'png' | 'pdf' | 'json' | 'csv';
  includeCharts: boolean;
  includeData: boolean;
  privacyMode: boolean;
  customTitle?: string;
}

export interface ExportResult {
  url: string;
  filename: string;
  size: number;
  format: string;
}
