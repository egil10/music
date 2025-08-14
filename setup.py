#!/usr/bin/env python3
"""
Setup script for Spotify Wrapped Dashboard

This script helps you set up the project and process your Spotify data safely.
"""

import os
import sys
import subprocess
from pathlib import Path

def print_banner():
    """Print the project banner"""
    print("🎵" + "="*60 + "🎵")
    print("    My Spotify Wrapped Dashboard Setup")
    print("🎵" + "="*60 + "🎵")
    print()

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 6):
        print("❌ Python 3.6 or higher is required")
        print(f"   Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version.split()[0]}")
    return True

def check_spotify_data():
    """Check if Spotify data directories exist"""
    print("\n📁 Checking for Spotify data...")
    
    required_dirs = [
        "Spotify Account Data",
        "Spotify Extended Streaming History"
    ]
    
    missing_dirs = []
    for dir_name in required_dirs:
        if Path(dir_name).exists():
            print(f"✅ Found: {dir_name}")
        else:
            print(f"❌ Missing: {dir_name}")
            missing_dirs.append(dir_name)
    
    if missing_dirs:
        print(f"\n⚠️  Missing directories: {', '.join(missing_dirs)}")
        print("   Please place your exported Spotify data folders in the project root.")
        print("   You can get your data from: https://www.spotify.com/account/privacy/")
        return False
    
    return True

def run_privacy_check():
    """Run the privacy filter script"""
    print("\n🔒 Running privacy analysis...")
    
    try:
        result = subprocess.run([
            sys.executable, "scripts/privacy_filter.py"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Privacy analysis completed")
            print("   Check privacy_analysis_report.json for details")
            return True
        else:
            print("❌ Privacy analysis failed")
            print(result.stderr)
            return False
            
    except FileNotFoundError:
        print("❌ Could not find privacy_filter.py script")
        return False

def run_data_sanitization():
    """Run the data sanitization script"""
    print("\n🧹 Creating sanitized data...")
    
    try:
        result = subprocess.run([
            sys.executable, "scripts/sanitize_data.py", "--output-dir", "safe_data"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Data sanitization completed")
            print("   Safe data saved to: safe_data/")
            return True
        else:
            print("❌ Data sanitization failed")
            print(result.stderr)
            return False
            
    except FileNotFoundError:
        print("❌ Could not find sanitize_data.py script")
        return False

def create_sample_data():
    """Create sample data for testing if no real data is available"""
    print("\n📝 Creating sample data for testing...")
    
    sample_data = {
        "streaming_history": [
            {
                "trackName": "Sample Track 1",
                "artistName": "Sample Artist 1",
                "albumName": "Sample Album 1",
                "endTime": "2024-01-01T12:00:00Z",
                "msPlayed": 180000
            },
            {
                "trackName": "Sample Track 2",
                "artistName": "Sample Artist 2",
                "albumName": "Sample Album 2",
                "endTime": "2024-01-01T13:00:00Z",
                "msPlayed": 240000
            }
        ],
        "playlists": [
            {
                "name": "Sample Playlist",
                "description": "A sample playlist for testing",
                "numberOfFollowers": 0,
                "items": []
            }
        ]
    }
    
    # Create safe_data directory
    safe_data_dir = Path("safe_data")
    safe_data_dir.mkdir(exist_ok=True)
    
    # Save sample streaming history
    with open(safe_data_dir / "safe_streaming_history.json", "w") as f:
        import json
        json.dump(sample_data["streaming_history"], f, indent=2)
    
    # Save sample playlists
    with open(safe_data_dir / "safe_playlists.json", "w") as f:
        json.dump({"playlists": sample_data["playlists"]}, f, indent=2)
    
    print("✅ Sample data created in safe_data/")
    print("   You can now test the dashboard with sample data")

def main():
    """Main setup function"""
    print_banner()
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Check for Spotify data
    has_data = check_spotify_data()
    
    if has_data:
        # Run privacy analysis
        if run_privacy_check():
            # Run data sanitization
            run_data_sanitization()
    else:
        print("\n📝 No Spotify data found. Creating sample data for testing...")
        create_sample_data()
    
    print("\n" + "="*60)
    print("🎉 Setup completed!")
    print("\nNext steps:")
    print("1. Open index.html in your browser to view the dashboard")
    print("2. If you have real Spotify data, run the privacy scripts first")
    print("3. Deploy to GitHub Pages for online access")
    print("\nFor more information, see README.md")
    print("="*60)

if __name__ == "__main__":
    main()
