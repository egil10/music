#!/usr/bin/env python3
"""
Spotify Data Merger Script

This script merges all Spotify data files and prepares them for the dashboard.
It handles both regular account data and extended streaming history.
"""

import json
import os
import glob
from datetime import datetime
from pathlib import Path

class SpotifyDataMerger:
    def __init__(self, data_dir="."):
        self.data_dir = Path(data_dir)
        self.merged_data = {
            "streaming_history": [],
            "playlists": [],
            "user_data": {},
            "metadata": {
                "merged_at": datetime.now().isoformat(),
                "files_processed": 0,
                "total_streams": 0
            }
        }

    def merge_streaming_history(self):
        """Merge all streaming history files"""
        print("Merging streaming history files...")
        
        # Regular streaming history files
        regular_files = glob.glob(str(self.data_dir / "Spotify Account Data" / "StreamingHistory_music_*.json"))
        
        # Extended streaming history files
        extended_files = glob.glob(str(self.data_dir / "Spotify Extended Streaming History" / "Streaming_History_Audio_*.json"))
        
        all_files = regular_files + extended_files
        
        for file_path in all_files:
            try:
                print(f"Processing: {file_path}")
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if isinstance(data, list):
                    self.merged_data["streaming_history"].extend(data)
                    self.merged_data["metadata"]["files_processed"] += 1
                    print(f"  Added {len(data)} streaming records")
                else:
                    print(f"  Skipped (not a list): {file_path}")
                    
            except Exception as e:
                print(f"  Error processing {file_path}: {e}")

    def merge_playlists(self):
        """Merge all playlist files"""
        print("Merging playlist files...")
        
        playlist_files = glob.glob(str(self.data_dir / "Spotify Account Data" / "Playlist*.json"))
        
        for file_path in playlist_files:
            try:
                print(f"Processing: {file_path}")
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if isinstance(data, dict) and "playlists" in data:
                    self.merged_data["playlists"].extend(data["playlists"])
                    self.merged_data["metadata"]["files_processed"] += 1
                    print(f"  Added {len(data['playlists'])} playlists")
                else:
                    print(f"  Skipped (no playlists found): {file_path}")
                    
            except Exception as e:
                print(f"  Error processing {file_path}: {e}")

    def merge_user_data(self):
        """Merge user data files (excluding sensitive information)"""
        print("Merging user data files...")
        
        user_data_files = [
            "Identity.json",
            "Userdata.json",
            "YourLibrary.json"
        ]
        
        for filename in user_data_files:
            file_path = self.data_dir / "Spotify Account Data" / filename
            if file_path.exists():
                try:
                    print(f"Processing: {file_path}")
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    # Only store non-sensitive user data
                    if filename == "Identity.json":
                        safe_data = {
                            "country": data.get("country"),
                            "birthdate": data.get("birthdate"),
                            "gender": data.get("gender")
                        }
                    elif filename == "Userdata.json":
                        safe_data = {
                            "username": data.get("username"),
                            "email": data.get("email"),
                            "created": data.get("created")
                        }
                    elif filename == "YourLibrary.json":
                        safe_data = {
                            "tracks_count": len(data.get("tracks", [])),
                            "albums_count": len(data.get("albums", [])),
                            "artists_count": len(data.get("artists", []))
                        }
                    
                    self.merged_data["user_data"][filename.replace(".json", "")] = safe_data
                    self.merged_data["metadata"]["files_processed"] += 1
                    print(f"  Added user data from {filename}")
                    
                except Exception as e:
                    print(f"  Error processing {file_path}: {e}")

    def clean_streaming_data(self):
        """Clean and validate streaming history data"""
        print("Cleaning streaming history data...")
        
        original_count = len(self.merged_data["streaming_history"])
        
        # Remove entries with missing required fields
        cleaned_data = []
        for entry in self.merged_data["streaming_history"]:
            if (entry.get("trackName") and 
                entry.get("artistName") and 
                entry.get("endTime") and 
                entry.get("msPlayed")):
                
                # Ensure msPlayed is a number
                try:
                    entry["msPlayed"] = int(entry["msPlayed"])
                    if entry["msPlayed"] > 0:  # Only include actual plays
                        cleaned_data.append(entry)
                except (ValueError, TypeError):
                    continue
        
        self.merged_data["streaming_history"] = cleaned_data
        self.merged_data["metadata"]["total_streams"] = len(cleaned_data)
        
        print(f"  Cleaned {original_count - len(cleaned_data)} invalid entries")
        print(f"  Final count: {len(cleaned_data)} streaming records")

    def save_merged_data(self, output_file="merged_spotify_data.json"):
        """Save the merged data to a JSON file"""
        output_path = self.data_dir / output_file
        
        print(f"Saving merged data to: {output_path}")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.merged_data, f, indent=2, ensure_ascii=False)
        
        print(f"Successfully saved merged data!")
        print(f"Total files processed: {self.merged_data['metadata']['files_processed']}")
        print(f"Total streaming records: {self.merged_data['metadata']['total_streams']}")
        print(f"Total playlists: {len(self.merged_data['playlists'])}")

    def run(self):
        """Run the complete merging process"""
        print("Starting Spotify data merge process...")
        print("=" * 50)
        
        self.merge_streaming_history()
        print()
        
        self.merge_playlists()
        print()
        
        self.merge_user_data()
        print()
        
        self.clean_streaming_data()
        print()
        
        self.save_merged_data()
        print()
        print("Merge process completed successfully!")

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Merge Spotify data files")
    parser.add_argument("--data-dir", default=".", help="Directory containing Spotify data folders")
    parser.add_argument("--output", default="merged_spotify_data.json", help="Output file name")
    
    args = parser.parse_args()
    
    merger = SpotifyDataMerger(args.data_dir)
    merger.run()

if __name__ == "__main__":
    main()
