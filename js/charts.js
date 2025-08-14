class SpotifyCharts {
    constructor() {
        this.charts = {};
        this.colors = {
            primary: '#1db954',
            secondary: '#1ed760',
            accent: '#191414',
            background: 'rgba(255, 255, 255, 0.1)',
            text: '#ffffff'
        };
    }

    createActivityChart(data) {
        const ctx = document.getElementById('activity-chart');
        if (!ctx) return;

        const chartData = {
            labels: data.map(item => item.month),
            datasets: [{
                label: 'Streams',
                data: data.map(item => item.count),
                borderColor: this.colors.primary,
                backgroundColor: this.colors.primary + '20',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: this.colors.primary,
                pointBorderColor: this.colors.text,
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        };

        this.charts.activity = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: this.colors.text,
                            maxRotation: 45
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: this.colors.text
                        }
                    }
                }
            }
        });
    }

    createHoursChart(data) {
        const ctx = document.getElementById('hours-chart');
        if (!ctx) return;

        const labels = Array.from({length: 24}, (_, i) => {
            const hour = i % 12 || 12;
            const ampm = i < 12 ? 'AM' : 'PM';
            return `${hour}${ampm}`;
        });

        const chartData = {
            labels: labels,
            datasets: [{
                label: 'Streams',
                data: Array.from({length: 24}, (_, i) => data[i] || 0),
                backgroundColor: this.colors.primary + '80',
                borderColor: this.colors.primary,
                borderWidth: 1,
                borderRadius: 4
            }]
        };

        this.charts.hours = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: this.colors.text,
                            maxRotation: 0
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: this.colors.text
                        }
                    }
                }
            }
        });
    }

    createDaysChart(data) {
        const ctx = document.getElementById('days-chart');
        if (!ctx) return;

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        const chartData = {
            labels: dayNames,
            datasets: [{
                label: 'Streams',
                data: dayNames.map((_, i) => data[i] || 0),
                backgroundColor: this.colors.secondary + '80',
                borderColor: this.colors.secondary,
                borderWidth: 1,
                borderRadius: 4
            }]
        };

        this.charts.days = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: this.colors.text,
                            maxRotation: 0
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: this.colors.text
                        }
                    }
                }
            }
        });
    }

    createArtistChart(data) {
        const ctx = document.getElementById('artist-chart');
        if (!ctx) return;

        const top10 = data.slice(0, 10);
        
        const chartData = {
            labels: top10.map(artist => artist.name),
            datasets: [{
                label: 'Streams',
                data: top10.map(artist => artist.streams),
                backgroundColor: this.colors.primary + '80',
                borderColor: this.colors.primary,
                borderWidth: 1,
                borderRadius: 4
            }]
        };

        this.charts.artist = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: this.colors.text
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: this.colors.text
                        }
                    }
                }
            }
        });
    }

    createTrackChart(data) {
        const ctx = document.getElementById('track-chart');
        if (!ctx) return;

        const top10 = data.slice(0, 10);
        
        const chartData = {
            labels: top10.map(track => track.name),
            datasets: [{
                label: 'Streams',
                data: top10.map(track => track.streams),
                backgroundColor: this.colors.secondary + '80',
                borderColor: this.colors.secondary,
                borderWidth: 1,
                borderRadius: 4
            }]
        };

        this.charts.track = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: this.colors.text
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: this.colors.text
                        }
                    }
                }
            }
        });
    }

    updateCharts(data) {
        // Create activity chart
        const monthlyActivity = data.getMonthlyActivity();
        this.createActivityChart(monthlyActivity);

        // Create listening habits charts
        this.createHoursChart(data.listeningHabits.hours);
        this.createDaysChart(data.listeningHabits.days);
    }

    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// Export for use in other files
window.SpotifyCharts = SpotifyCharts;
