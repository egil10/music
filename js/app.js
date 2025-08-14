class SpotifyWrappedApp {
    constructor() {
        this.dataProcessor = new SpotifyDataProcessor();
        this.charts = new SpotifyCharts();
        this.currentData = null;
        this.init();
    }

    async init() {
        try {
            // Show loading screen
            this.showLoading();
            
            // Load and process data
            this.currentData = await this.dataProcessor.loadData();
            
            // Initialize UI
            this.initializeUI();
            
            // Update charts
            this.charts.updateCharts(this.currentData);
            
            // Hide loading screen
            this.hideLoading();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to load your Spotify data. Please check the console for details.');
        }
    }

    showLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        const dashboard = document.getElementById('dashboard');
        
        if (loadingScreen) loadingScreen.style.display = 'flex';
        if (dashboard) dashboard.classList.add('hidden');
    }

    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        const dashboard = document.getElementById('dashboard');
        
        if (loadingScreen) loadingScreen.style.opacity = '0';
        if (dashboard) dashboard.classList.remove('hidden');
        
        setTimeout(() => {
            if (loadingScreen) loadingScreen.style.display = 'none';
        }, 500);
    }

    showError(message) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="loading-content">
                    <div class="spotify-logo">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2>Error</h2>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    initializeUI() {
        this.updateStats();
        this.updateTopArtists();
        this.updateTopTracks();
        this.updatePlaylists();
        this.setupNavigation();
    }

    updateStats() {
        const stats = this.currentData.stats;
        
        document.getElementById('total-streams').textContent = this.dataProcessor.formatNumber(stats.totalStreams);
        document.getElementById('total-time').textContent = this.dataProcessor.formatDuration(stats.totalTime);
        document.getElementById('unique-artists').textContent = this.dataProcessor.formatNumber(stats.uniqueArtists);
        document.getElementById('unique-tracks').textContent = this.dataProcessor.formatNumber(stats.uniqueTracks);
    }

    updateTopArtists() {
        const artistsGrid = document.getElementById('artists-grid');
        if (!artistsGrid) return;

        const topArtists = this.currentData.topArtists.slice(0, 12);
        
        artistsGrid.innerHTML = topArtists.map((artist, index) => `
            <div class="artist-card">
                <div class="artist-rank">#${index + 1}</div>
                <div class="artist-name">${this.escapeHtml(artist.name)}</div>
                <div class="artist-stats">
                    ${this.dataProcessor.formatNumber(artist.streams)} streams • 
                    ${this.dataProcessor.formatDuration(artist.totalTime)}
                </div>
            </div>
        `).join('');
    }

    updateTopTracks() {
        const tracksList = document.getElementById('tracks-list');
        if (!tracksList) return;

        const topTracks = this.currentData.topTracks.slice(0, 20);
        
        tracksList.innerHTML = topTracks.map((track, index) => `
            <div class="track-item">
                <div class="track-rank">#${index + 1}</div>
                <div class="track-info">
                    <div class="track-name">${this.escapeHtml(track.name)}</div>
                    <div class="track-artist">${this.escapeHtml(track.artist)}</div>
                </div>
                <div class="track-stats">
                    ${this.dataProcessor.formatNumber(track.streams)} streams • 
                    ${this.dataProcessor.formatDuration(track.totalTime)}
                </div>
            </div>
        `).join('');
    }

    updatePlaylists() {
        const playlistsGrid = document.getElementById('playlists-grid');
        if (!playlistsGrid) return;

        const playlists = this.currentData.playlists.slice(0, 12);
        
        if (playlists.length === 0) {
            playlistsGrid.innerHTML = `
                <div class="playlist-card">
                    <div class="playlist-name">No Playlists Found</div>
                    <div class="playlist-stats">Playlist data not available in your export</div>
                </div>
            `;
            return;
        }

        playlistsGrid.innerHTML = playlists.map(playlist => `
            <div class="playlist-card">
                <div class="playlist-name">${this.escapeHtml(playlist.name)}</div>
                <div class="playlist-stats">
                    ${playlist.numberOfFollowers || 0} followers • 
                    ${playlist.items ? playlist.items.length : 0} tracks
                </div>
            </div>
        `).join('');
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const contentSections = document.querySelectorAll('.content-section');

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetSection = button.getAttribute('data-section');
                
                // Update active button
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update active section
                contentSections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === targetSection) {
                        section.classList.add('active');
                    }
                });
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Method to refresh data (useful for future updates)
    async refreshData() {
        this.showLoading();
        this.currentData = await this.dataProcessor.loadData();
        this.initializeUI();
        this.charts.updateCharts(this.currentData);
        this.hideLoading();
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SpotifyWrappedApp();
});

// Add some utility functions for debugging
window.debugSpotifyData = function() {
    if (window.spotifyApp && window.spotifyApp.currentData) {
        console.log('Spotify Data:', window.spotifyApp.currentData);
        return window.spotifyApp.currentData;
    } else {
        console.log('No Spotify data available');
        return null;
    }
};
