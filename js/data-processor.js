class SpotifyDataProcessor {
    constructor() {
        this.data = {
            streamingHistory: [],
            playlists: [],
            topArtists: {},
            topTracks: {},
            listeningHabits: {
                hours: {},
                days: {},
                months: {}
            },
            stats: {
                totalStreams: 0,
                totalTime: 0,
                uniqueArtists: 0,
                uniqueTracks: 0
            }
        };
    }

    async loadData() {
        try {
            // Load streaming history from all files
            await this.loadStreamingHistory();
            
            // Load playlists
            await this.loadPlaylists();
            
            // Process all data
            this.processData();
            
            return this.data;
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    async loadStreamingHistory() {
        const streamingFiles = [
            'Spotify Account Data/StreamingHistory_music_0.json',
            'Spotify Account Data/StreamingHistory_music_1.json',
            'Spotify Account Data/StreamingHistory_music_2.json',
            'Spotify Account Data/StreamingHistory_music_3.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2015-2016_0.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2016_1.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2016_2.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2016-2017_3.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2017_4.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2017_5.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2017_6.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2017-2018_7.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2018_8.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2018-2019_9.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2019_10.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2019_11.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2019_12.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2019-2020_13.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2020_14.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2020-2021_15.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2021_16.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2021-2022_17.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2022-2023_18.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2023_19.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2023_20.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2023-2024_21.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2024_22.json',
            'Spotify Extended Streaming History/Streaming_History_Audio_2024-2025_23.json'
        ];

        for (const file of streamingFiles) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const fileData = await response.json();
                    if (Array.isArray(fileData)) {
                        this.data.streamingHistory.push(...fileData);
                    }
                }
            } catch (error) {
                console.warn(`Could not load ${file}:`, error);
            }
        }
    }

    async loadPlaylists() {
        const playlistFiles = [
            'Spotify Account Data/Playlist1.json',
            'Spotify Account Data/Playlist2.json',
            'Spotify Account Data/Playlist3.json',
            'Spotify Account Data/Playlist4.json',
            'Spotify Account Data/Playlist5.json',
            'Spotify Account Data/Playlist6.json',
            'Spotify Account Data/Playlist7.json'
        ];

        for (const file of playlistFiles) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const playlistData = await response.json();
                    if (playlistData.playlists) {
                        this.data.playlists.push(...playlistData.playlists);
                    }
                }
            } catch (error) {
                console.warn(`Could not load ${file}:`, error);
            }
        }
    }

    processData() {
        this.processStreamingHistory();
        this.calculateStats();
        this.calculateTopArtists();
        this.calculateTopTracks();
        this.calculateListeningHabits();
    }

    processStreamingHistory() {
        // Filter out entries with missing data
        this.data.streamingHistory = this.data.streamingHistory.filter(entry => 
            entry.trackName && 
            entry.artistName && 
            entry.endTime && 
            entry.msPlayed
        );

        // Convert endTime to Date objects and add additional fields
        this.data.streamingHistory.forEach(entry => {
            entry.endTime = new Date(entry.endTime);
            entry.duration = entry.msPlayed / 1000; // Convert to seconds
            entry.hour = entry.endTime.getHours();
            entry.day = entry.endTime.getDay();
            entry.month = entry.endTime.getMonth();
            entry.year = entry.endTime.getFullYear();
        });
    }

    calculateStats() {
        const stats = this.data.stats;
        
        stats.totalStreams = this.data.streamingHistory.length;
        stats.totalTime = this.data.streamingHistory.reduce((total, entry) => total + entry.duration, 0);
        
        const uniqueArtists = new Set(this.data.streamingHistory.map(entry => entry.artistName));
        const uniqueTracks = new Set(this.data.streamingHistory.map(entry => `${entry.trackName} - ${entry.artistName}`));
        
        stats.uniqueArtists = uniqueArtists.size;
        stats.uniqueTracks = uniqueTracks.size;
    }

    calculateTopArtists() {
        const artistCounts = {};
        
        this.data.streamingHistory.forEach(entry => {
            const artist = entry.artistName;
            if (!artistCounts[artist]) {
                artistCounts[artist] = {
                    name: artist,
                    streams: 0,
                    totalTime: 0
                };
            }
            artistCounts[artist].streams++;
            artistCounts[artist].totalTime += entry.duration;
        });

        // Convert to array and sort by streams
        this.data.topArtists = Object.values(artistCounts)
            .sort((a, b) => b.streams - a.streams)
            .slice(0, 20);
    }

    calculateTopTracks() {
        const trackCounts = {};
        
        this.data.streamingHistory.forEach(entry => {
            const trackKey = `${entry.trackName} - ${entry.artistName}`;
            if (!trackCounts[trackKey]) {
                trackCounts[trackKey] = {
                    name: entry.trackName,
                    artist: entry.artistName,
                    streams: 0,
                    totalTime: 0
                };
            }
            trackCounts[trackKey].streams++;
            trackCounts[trackKey].totalTime += entry.duration;
        });

        // Convert to array and sort by streams
        this.data.topTracks = Object.values(trackCounts)
            .sort((a, b) => b.streams - a.streams)
            .slice(0, 50);
    }

    calculateListeningHabits() {
        const habits = this.data.listeningHabits;
        
        // Initialize hour and day counters
        for (let i = 0; i < 24; i++) {
            habits.hours[i] = 0;
        }
        for (let i = 0; i < 7; i++) {
            habits.days[i] = 0;
        }

        // Count streams by hour and day
        this.data.streamingHistory.forEach(entry => {
            habits.hours[entry.hour]++;
            habits.days[entry.day]++;
        });
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    getMonthlyActivity() {
        const monthlyData = {};
        
        this.data.streamingHistory.forEach(entry => {
            const monthKey = `${entry.year}-${String(entry.month + 1).padStart(2, '0')}`;
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = 0;
            }
            monthlyData[monthKey]++;
        });

        return Object.entries(monthlyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, count]) => ({ month, count }));
    }
}

// Export for use in other files
window.SpotifyDataProcessor = SpotifyDataProcessor;
