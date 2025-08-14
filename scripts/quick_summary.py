#!/usr/bin/env python3
"""
Quick Summary Script for Spotify Data

This script provides a quick overview of the processed Spotify data.
"""

import json
from pathlib import Path

def load_merged_data():
    """Load the merged data file"""
    merged_file = Path("merged_spotify_data.json")
    if merged_file.exists():
        with open(merged_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

def print_summary():
    """Print a quick summary of the data"""
    print("🎵 SPOTIFY DATA QUICK SUMMARY")
    print("=" * 60)
    
    data = load_merged_data()
    if not data:
        print("❌ No merged data found. Run the merge script first.")
        return
    
    streaming_history = data.get("streaming_history", [])
    playlists = data.get("playlists", [])
    
    # Basic stats
    total_streams = len(streaming_history)
    total_time_ms = sum(entry.get("msPlayed", 0) for entry in streaming_history)
    total_time_hours = total_time_ms / (1000 * 60 * 60)
    total_time_days = total_time_hours / 24
    
    # Unique counts
    unique_artists = len(set(entry.get("artistName", "") for entry in streaming_history if entry.get("artistName")))
    unique_tracks = len(set(f"{entry.get('trackName', '')} - {entry.get('artistName', '')}" for entry in streaming_history if entry.get("trackName") and entry.get("artistName")))
    
    # Top artists
    artist_streams = {}
    for entry in streaming_history:
        artist = entry.get("artistName", "")
        if artist:
            artist_streams[artist] = artist_streams.get(artist, 0) + 1
    
    top_artists = sorted(artist_streams.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Playlist stats
    total_playlists = len(playlists)
    total_followers = sum(playlist.get("numberOfFollowers", 0) for playlist in playlists)
    
    print(f"\n📊 STREAMING STATISTICS:")
    print(f"   Total Streams: {total_streams:,}")
    print(f"   Total Listening Time: {total_time_hours:.1f} hours ({total_time_days:.1f} days)")
    print(f"   Unique Artists: {unique_artists:,}")
    print(f"   Unique Tracks: {unique_tracks:,}")
    
    print(f"\n🎤 TOP 5 ARTISTS:")
    for i, (artist, streams) in enumerate(top_artists, 1):
        print(f"   {i}. {artist} - {streams:,} streams")
    
    print(f"\n📁 PLAYLIST STATISTICS:")
    print(f"   Total Playlists: {total_playlists:,}")
    print(f"   Total Followers: {total_followers:,}")
    
    # Privacy summary
    privacy_file = Path("privacy_analysis_report.json")
    if privacy_file.exists():
        try:
            with open(privacy_file, 'r', encoding='utf-8') as f:
                privacy_data = json.load(f)
            
            files_analyzed = privacy_data.get("files_analyzed", 0)
            safe_files = len(privacy_data.get("safe_files", []))
            risky_files = len(privacy_data.get("risky_files", []))
            
            print(f"\n🔒 PRIVACY STATUS:")
            print(f"   Files Analyzed: {files_analyzed:,}")
            print(f"   Safe Files: {safe_files:,}")
            print(f"   Risky Files: {risky_files:,}")
            print(f"   Status: {'✅ Safe' if safe_files > risky_files else '⚠️ Needs Review'}")
        except:
            print(f"\n🔒 PRIVACY STATUS: Analysis report found but could not be read")
    
    # Data files
    print(f"\n📁 DATA FILES:")
    print(f"   ✅ Merged Data: merged_spotify_data.json ({Path('merged_spotify_data.json').stat().st_size / (1024*1024):.1f} MB)")
    print(f"   ✅ Safe Data: safe_data/ directory")
    print(f"   ✅ Privacy Report: privacy_analysis_report.json")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    print_summary()
