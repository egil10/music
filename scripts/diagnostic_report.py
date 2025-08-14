#!/usr/bin/env python3
"""
Spotify Data Diagnostic Report Script

This script analyzes the processed Spotify data and generates a comprehensive
diagnostic report with statistics and insights.
"""

import json
import os
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from pathlib import Path

class SpotifyDiagnosticReport:
    def __init__(self, data_dir="."):
        self.data_dir = Path(data_dir)
        self.report = {
            "generated_at": datetime.now().isoformat(),
            "summary": {},
            "streaming_analysis": {},
            "artist_analysis": {},
            "track_analysis": {},
            "playlist_analysis": {},
            "temporal_analysis": {},
            "privacy_summary": {}
        }

    def load_data(self):
        """Load the merged and safe data files"""
        print("Loading data files...")
        
        # Try to load merged data first
        merged_file = self.data_dir / "merged_spotify_data.json"
        if merged_file.exists():
            with open(merged_file, 'r', encoding='utf-8') as f:
                self.merged_data = json.load(f)
            print(f"✅ Loaded merged data: {len(self.merged_data['streaming_history'])} records")
        else:
            # Fall back to safe data
            safe_streaming = self.data_dir / "safe_data" / "safe_streaming_history.json"
            safe_playlists = self.data_dir / "safe_data" / "safe_playlists.json"
            
            self.merged_data = {"streaming_history": [], "playlists": []}
            
            if safe_streaming.exists():
                with open(safe_streaming, 'r', encoding='utf-8') as f:
                    self.merged_data["streaming_history"] = json.load(f)
                print(f"✅ Loaded safe streaming data: {len(self.merged_data['streaming_history'])} records")
            
            if safe_playlists.exists():
                with open(safe_playlists, 'r', encoding='utf-8') as f:
                    playlist_data = json.load(f)
                    self.merged_data["playlists"] = playlist_data.get("playlists", [])
                print(f"✅ Loaded safe playlist data: {len(self.merged_data['playlists'])} playlists")

    def analyze_streaming_data(self):
        """Analyze streaming history data"""
        print("Analyzing streaming data...")
        
        streaming_data = self.merged_data.get("streaming_history", [])
        if not streaming_data:
            print("⚠️  No streaming data found")
            return
        
        # Basic statistics
        total_streams = len(streaming_data)
        total_time_ms = sum(entry.get("msPlayed", 0) for entry in streaming_data)
        total_time_hours = total_time_ms / (1000 * 60 * 60)
        
        # Date range analysis
        dates = []
        for entry in streaming_data:
            try:
                date_str = entry.get("endTime", "")
                if date_str:
                    date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    dates.append(date)
            except:
                continue
        
        if dates:
            min_date = min(dates)
            max_date = max(dates)
            date_range_days = (max_date - min_date).days
        else:
            min_date = max_date = None
            date_range_days = 0
        
        # Unique counts
        unique_artists = len(set(entry.get("artistName", "") for entry in streaming_data if entry.get("artistName")))
        unique_tracks = len(set(f"{entry.get('trackName', '')} - {entry.get('artistName', '')}" for entry in streaming_data if entry.get("trackName") and entry.get("artistName")))
        unique_albums = len(set(entry.get("albumName", "") for entry in streaming_data if entry.get("albumName")))
        
        self.report["streaming_analysis"] = {
            "total_streams": total_streams,
            "total_time_ms": total_time_ms,
            "total_time_hours": round(total_time_hours, 2),
            "total_time_days": round(total_time_hours / 24, 2),
            "date_range": {
                "start": min_date.isoformat() if min_date else None,
                "end": max_date.isoformat() if max_date else None,
                "days": date_range_days
            },
            "unique_counts": {
                "artists": unique_artists,
                "tracks": unique_tracks,
                "albums": unique_albums
            }
        }

    def analyze_artists(self):
        """Analyze artist listening patterns"""
        print("Analyzing artist data...")
        
        streaming_data = self.merged_data.get("streaming_history", [])
        if not streaming_data:
            return
        
        # Artist statistics
        artist_streams = defaultdict(int)
        artist_time = defaultdict(int)
        
        for entry in streaming_data:
            artist = entry.get("artistName", "")
            if artist:
                artist_streams[artist] += 1
                artist_time[artist] += entry.get("msPlayed", 0)
        
        # Top artists by streams
        top_artists_by_streams = sorted(artist_streams.items(), key=lambda x: x[1], reverse=True)[:20]
        top_artists_by_time = sorted(artist_time.items(), key=lambda x: x[1], reverse=True)[:20]
        
        # Artist diversity
        total_artists = len(artist_streams)
        top_10_percent = len([a for a in artist_streams.values() if a >= sorted(artist_streams.values(), reverse=True)[int(len(artist_streams) * 0.1)]])
        
        self.report["artist_analysis"] = {
            "total_artists": total_artists,
            "top_artists_by_streams": [
                {"artist": artist, "streams": streams, "time_hours": round(artist_time[artist] / (1000 * 60 * 60), 2)}
                for artist, streams in top_artists_by_streams
            ],
            "top_artists_by_time": [
                {"artist": artist, "time_hours": round(time / (1000 * 60 * 60), 2), "streams": artist_streams[artist]}
                for artist, time in top_artists_by_time
            ],
            "diversity_metrics": {
                "top_10_percent_artists": top_10_percent,
                "concentration_ratio": round(top_10_percent / total_artists * 100, 2) if total_artists > 0 else 0
            }
        }

    def analyze_tracks(self):
        """Analyze track listening patterns"""
        print("Analyzing track data...")
        
        streaming_data = self.merged_data.get("streaming_history", [])
        if not streaming_data:
            return
        
        # Track statistics
        track_streams = defaultdict(int)
        track_time = defaultdict(int)
        
        for entry in streaming_data:
            track_key = f"{entry.get('trackName', '')} - {entry.get('artistName', '')}"
            if entry.get("trackName") and entry.get("artistName"):
                track_streams[track_key] += 1
                track_time[track_key] += entry.get("msPlayed", 0)
        
        # Top tracks
        top_tracks_by_streams = sorted(track_streams.items(), key=lambda x: x[1], reverse=True)[:20]
        top_tracks_by_time = sorted(track_time.items(), key=lambda x: x[1], reverse=True)[:20]
        
        # Track diversity
        total_tracks = len(track_streams)
        avg_streams_per_track = sum(track_streams.values()) / total_tracks if total_tracks > 0 else 0
        
        self.report["track_analysis"] = {
            "total_tracks": total_tracks,
            "avg_streams_per_track": round(avg_streams_per_track, 2),
            "top_tracks_by_streams": [
                {"track": track, "streams": streams, "time_hours": round(track_time[track] / (1000 * 60 * 60), 2)}
                for track, streams in top_tracks_by_streams
            ],
            "top_tracks_by_time": [
                {"track": track, "time_hours": round(time / (1000 * 60 * 60), 2), "streams": track_streams[track]}
                for track, time in top_tracks_by_time
            ]
        }

    def analyze_playlists(self):
        """Analyze playlist data"""
        print("Analyzing playlist data...")
        
        playlists = self.merged_data.get("playlists", [])
        if not playlists:
            return
        
        # Playlist statistics
        total_playlists = len(playlists)
        total_followers = sum(playlist.get("numberOfFollowers", 0) for playlist in playlists)
        total_tracks_in_playlists = sum(len(playlist.get("items", [])) for playlist in playlists)
        
        # Playlist sizes
        playlist_sizes = [len(playlist.get("items", [])) for playlist in playlists]
        avg_playlist_size = sum(playlist_sizes) / len(playlist_sizes) if playlist_sizes else 0
        
        # Top playlists by followers
        top_playlists = sorted(playlists, key=lambda x: x.get("numberOfFollowers", 0), reverse=True)[:10]
        
        self.report["playlist_analysis"] = {
            "total_playlists": total_playlists,
            "total_followers": total_followers,
            "total_tracks_in_playlists": total_tracks_in_playlists,
            "avg_playlist_size": round(avg_playlist_size, 2),
            "top_playlists": [
                {
                    "name": playlist.get("name", "Unknown"),
                    "followers": playlist.get("numberOfFollowers", 0),
                    "tracks": len(playlist.get("items", [])),
                    "description": (playlist.get("description", "") or "")[:100] + "..." if len(playlist.get("description", "") or "") > 100 else (playlist.get("description", "") or "")
                }
                for playlist in top_playlists
            ]
        }

    def analyze_temporal_patterns(self):
        """Analyze temporal listening patterns"""
        print("Analyzing temporal patterns...")
        
        streaming_data = self.merged_data.get("streaming_history", [])
        if not streaming_data:
            return
        
        # Hourly patterns
        hourly_streams = defaultdict(int)
        daily_streams = defaultdict(int)
        monthly_streams = defaultdict(int)
        
        for entry in streaming_data:
            try:
                date_str = entry.get("endTime", "")
                if date_str:
                    date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    hourly_streams[date.hour] += 1
                    daily_streams[date.strftime('%A')] += 1
                    monthly_streams[date.strftime('%Y-%m')] += 1
            except:
                continue
        
        # Peak hours
        peak_hour = max(hourly_streams.items(), key=lambda x: x[1]) if hourly_streams else (0, 0)
        peak_day = max(daily_streams.items(), key=lambda x: x[1]) if daily_streams else ("Unknown", 0)
        
        self.report["temporal_analysis"] = {
            "hourly_patterns": dict(hourly_streams),
            "daily_patterns": dict(daily_streams),
            "monthly_patterns": dict(monthly_streams),
            "peak_listening": {
                "hour": peak_hour[0],
                "day": peak_day[0],
                "peak_hour_streams": peak_hour[1],
                "peak_day_streams": peak_day[1]
            }
        }

    def load_privacy_summary(self):
        """Load privacy analysis summary"""
        print("Loading privacy summary...")
        
        privacy_report = self.data_dir / "privacy_analysis_report.json"
        if privacy_report.exists():
            with open(privacy_report, 'r', encoding='utf-8') as f:
                privacy_data = json.load(f)
            
            self.report["privacy_summary"] = {
                "files_analyzed": privacy_data.get("files_analyzed", 0),
                "safe_files": len(privacy_data.get("safe_files", [])),
                "risky_files": len(privacy_data.get("risky_files", [])),
                "recommendations": privacy_data.get("recommendations", [])
            }
        
        sanitization_report = self.data_dir / "safe_data" / "sanitization_report.json"
        if sanitization_report.exists():
            with open(sanitization_report, 'r', encoding='utf-8') as f:
                sanitization_data = json.load(f)
            
            self.report["privacy_summary"]["sanitization"] = {
                "files_processed": sanitization_data.get("sanitization_stats", {}).get("files_processed", 0),
                "files_sanitized": sanitization_data.get("sanitization_stats", {}).get("files_sanitized", 0),
                "total_redactions": sanitization_data.get("sanitization_stats", {}).get("total_redactions", 0)
            }

    def generate_summary(self):
        """Generate overall summary"""
        print("Generating summary...")
        
        streaming = self.report.get("streaming_analysis", {})
        artists = self.report.get("artist_analysis", {})
        tracks = self.report.get("track_analysis", {})
        playlists = self.report.get("playlist_analysis", {})
        privacy = self.report.get("privacy_summary", {})
        
        self.report["summary"] = {
            "total_streams": streaming.get("total_streams", 0),
            "total_listening_time_hours": streaming.get("total_time_hours", 0),
            "unique_artists": streaming.get("unique_counts", {}).get("artists", 0),
            "unique_tracks": streaming.get("unique_counts", {}).get("tracks", 0),
            "total_playlists": playlists.get("total_playlists", 0),
            "date_range_days": streaming.get("date_range", {}).get("days", 0),
            "avg_streams_per_day": round(streaming.get("total_streams", 0) / max(streaming.get("date_range", {}).get("days", 1), 1), 2),
            "privacy_status": "✅ Safe" if privacy.get("safe_files", 0) > privacy.get("risky_files", 0) else "⚠️ Needs Review"
        }

    def save_report(self, output_file="diagnostic_report.json"):
        """Save the diagnostic report"""
        output_path = self.data_dir / output_file
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.report, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Diagnostic report saved to: {output_path}")

    def print_summary(self):
        """Print a human-readable summary"""
        print("\n" + "="*80)
        print("🎵 SPOTIFY DATA DIAGNOSTIC REPORT")
        print("="*80)
        
        summary = self.report.get("summary", {})
        streaming = self.report.get("streaming_analysis", {})
        artists = self.report.get("artist_analysis", {})
        playlists = self.report.get("playlist_analysis", {})
        privacy = self.report.get("privacy_summary", {})
        
        print(f"\n📊 OVERALL SUMMARY:")
        print(f"   Total Streams: {summary.get('total_streams', 0):,}")
        print(f"   Total Listening Time: {summary.get('total_listening_time_hours', 0):.1f} hours ({summary.get('total_listening_time_hours', 0)/24:.1f} days)")
        print(f"   Unique Artists: {summary.get('unique_artists', 0):,}")
        print(f"   Unique Tracks: {summary.get('unique_tracks', 0):,}")
        print(f"   Total Playlists: {summary.get('total_playlists', 0):,}")
        print(f"   Date Range: {summary.get('date_range_days', 0)} days")
        print(f"   Average Streams/Day: {summary.get('avg_streams_per_day', 0):.1f}")
        
        print(f"\n🎤 TOP ARTISTS (by streams):")
        for i, artist in enumerate(artists.get("top_artists_by_streams", [])[:5], 1):
            print(f"   {i}. {artist['artist']} - {artist['streams']:,} streams ({artist['time_hours']:.1f}h)")
        
        print(f"\n📅 TEMPORAL PATTERNS:")
        temporal = self.report.get("temporal_analysis", {})
        peak = temporal.get("peak_listening", {})
        print(f"   Peak Listening Hour: {peak.get('hour', 0)}:00 ({peak.get('peak_hour_streams', 0):,} streams)")
        print(f"   Peak Listening Day: {peak.get('day', 'Unknown')} ({peak.get('peak_day_streams', 0):,} streams)")
        
        print(f"\n🔒 PRIVACY STATUS:")
        print(f"   Files Analyzed: {privacy.get('files_analyzed', 0):,}")
        print(f"   Safe Files: {privacy.get('safe_files', 0):,}")
        print(f"   Risky Files: {privacy.get('risky_files', 0):,}")
        print(f"   Status: {summary.get('privacy_status', 'Unknown')}")
        
        if "sanitization" in privacy:
            sanitization = privacy["sanitization"]
            print(f"   Redactions Made: {sanitization.get('total_redactions', 0):,}")
        
        print(f"\n📁 DATA FILES:")
        print(f"   ✅ Merged Data: merged_spotify_data.json")
        print(f"   ✅ Safe Data: safe_data/")
        print(f"   ✅ Diagnostic Report: diagnostic_report.json")
        
        print("\n" + "="*80)

    def run(self):
        """Run the complete diagnostic analysis"""
        print("Starting Spotify data diagnostic analysis...")
        
        self.load_data()
        self.analyze_streaming_data()
        self.analyze_artists()
        self.analyze_tracks()
        self.analyze_playlists()
        self.analyze_temporal_patterns()
        self.load_privacy_summary()
        self.generate_summary()
        self.save_report()
        self.print_summary()

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate diagnostic report for Spotify data")
    parser.add_argument("--data-dir", default=".", help="Directory containing Spotify data")
    parser.add_argument("--output", default="diagnostic_report.json", help="Output report file name")
    
    args = parser.parse_args()
    
    diagnostic = SpotifyDiagnosticReport(args.data_dir)
    diagnostic.run()

if __name__ == "__main__":
    main()
