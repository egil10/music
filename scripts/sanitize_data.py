#!/usr/bin/env python3
"""
Spotify Data Sanitizer Script

This script sanitizes Spotify data files by removing or anonymizing sensitive information
before publishing to GitHub. It creates clean versions of the data files.
"""

import json
import os
import glob
import re
import hashlib
from pathlib import Path
from datetime import datetime
from copy import deepcopy

class SpotifyDataSanitizer:
    def __init__(self, data_dir=".", output_dir="sanitized_data"):
        self.data_dir = Path(data_dir)
        self.output_dir = Path(output_dir)
        self.sanitization_stats = {
            "files_processed": 0,
            "files_sanitized": 0,
            "total_redactions": 0,
            "timestamp": datetime.now().isoformat()
        }
        
        # Create output directory
        self.output_dir.mkdir(exist_ok=True)
        
        # Patterns to redact or anonymize
        self.redaction_patterns = {
            'ip_addresses': (r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', '[IP_ADDRESS]'),
            'email_addresses': (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]'),
            'device_ids': (r'\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b', '[DEVICE_ID]'),
            'mac_addresses': (r'\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b', '[MAC_ADDRESS]'),
            'phone_numbers': (r'\b\+?[1-9]\d{1,14}\b', '[PHONE]'),
            'credit_cards': (r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b', '[CREDIT_CARD]'),
            'spotify_uris': (r'spotify:(track|album|artist|playlist|user):[a-zA-Z0-9]+', '[SPOTIFY_URI]')
        }
        
        # Fields to completely remove
        self.remove_fields = [
            'ip_addr', 'ipAddress', 'ip_address', 'ipAddrDecrypted',
            'email', 'emailAddress', 'email_address',
            'phone', 'phoneNumber', 'phone_number',
            'deviceId', 'device_id', 'deviceIdDecrypted',
            'macAddress', 'mac_address',
            'creditCard', 'credit_card', 'cardNumber',
            'password', 'token', 'accessToken', 'refreshToken',
            'sessionId', 'session_id',
            'userId', 'user_id', 'username',
            'address', 'street', 'city', 'zip', 'postalCode',
            'ssn', 'socialSecurity', 'passport',
            'location', 'latitude', 'longitude', 'gps',
            'timezone', 'timeZone',
            'platform', 'os', 'operatingSystem',
            'browser', 'userAgent',
            'connection', 'network', 'wifi',
            'bluetooth', 'bluetoothAddress'
        ]

    def sanitize_string(self, text):
        """Sanitize a string by redacting sensitive patterns"""
        if not isinstance(text, str):
            return text
        
        sanitized = text
        redactions = 0
        
        for pattern_name, (pattern, replacement) in self.redaction_patterns.items():
            matches = re.findall(pattern, sanitized)
            if matches:
                sanitized = re.sub(pattern, replacement, sanitized)
                redactions += len(matches)
        
        if redactions > 0:
            self.sanitization_stats["total_redactions"] += redactions
        
        return sanitized

    def sanitize_object(self, obj):
        """Recursively sanitize an object (dict, list, or primitive)"""
        if isinstance(obj, dict):
            sanitized = {}
            for key, value in obj.items():
                # Skip fields that should be removed
                if any(remove_field.lower() in key.lower() for remove_field in self.remove_fields):
                    continue
                
                # Sanitize the value
                sanitized[key] = self.sanitize_object(value)
            return sanitized
        
        elif isinstance(obj, list):
            return [self.sanitize_object(item) for item in obj]
        
        elif isinstance(obj, str):
            return self.sanitize_string(obj)
        
        else:
            return obj

    def should_skip_file(self, file_path):
        """Determine if a file should be skipped entirely"""
        file_name = file_path.name.lower()
        file_path_str = str(file_path).lower()
        
        # Skip technical log files entirely (they contain too much sensitive data)
        if 'technical' in file_path_str or 'log' in file_path_str:
            return True
        
        # Skip specific sensitive files
        sensitive_files = [
            'identity.json',
            'userdata.json',
            'payments.json',
            'follow.json',
            'inferences.json'
        ]
        
        if file_name in sensitive_files:
            return True
        
        return False

    def sanitize_file(self, file_path):
        """Sanitize a single file"""
        print(f"Processing: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.sanitization_stats["files_processed"] += 1
            
            # Check if file should be skipped
            if self.should_skip_file(file_path):
                print(f"  Skipping (contains sensitive data): {file_path}")
                return None
            
            # Create sanitized version
            sanitized_data = self.sanitize_object(data)
            
            # Check if any redactions were made
            if self.sanitization_stats["total_redactions"] > 0:
                self.sanitization_stats["files_sanitized"] += 1
                print(f"  Sanitized with {self.sanitization_stats['total_redactions']} redactions")
            
            return sanitized_data
            
        except Exception as e:
            print(f"  Error processing {file_path}: {e}")
            return None

    def save_sanitized_file(self, original_path, sanitized_data):
        """Save sanitized data to output directory"""
        if sanitized_data is None:
            return
        
        # Create relative path structure in output directory
        relative_path = original_path.relative_to(self.data_dir)
        output_path = self.output_dir / relative_path
        
        # Create parent directories if they don't exist
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Save sanitized data
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(sanitized_data, f, indent=2, ensure_ascii=False)
        
        print(f"  Saved sanitized version to: {output_path}")

    def create_safe_streaming_history(self):
        """Create a safe version of streaming history with only essential data"""
        print("Creating safe streaming history...")
        
        safe_streaming_data = []
        
        # Process all streaming history files
        streaming_files = []
        streaming_files.extend(glob.glob(str(self.data_dir / "Spotify Account Data" / "StreamingHistory_music_*.json")))
        streaming_files.extend(glob.glob(str(self.data_dir / "Spotify Extended Streaming History" / "Streaming_History_Audio_*.json")))
        
        for file_path in streaming_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if isinstance(data, list):
                    for entry in data:
                        # Only include essential, non-sensitive fields
                        safe_entry = {
                            "trackName": entry.get("trackName", ""),
                            "artistName": entry.get("artistName", ""),
                            "albumName": entry.get("albumName", ""),
                            "endTime": entry.get("endTime", ""),
                            "msPlayed": entry.get("msPlayed", 0)
                        }
                        
                        # Validate entry
                        if (safe_entry["trackName"] and 
                            safe_entry["artistName"] and 
                            safe_entry["endTime"] and 
                            safe_entry["msPlayed"]):
                            safe_streaming_data.append(safe_entry)
                
            except Exception as e:
                print(f"  Error processing streaming file {file_path}: {e}")
        
        # Save safe streaming history
        output_path = self.output_dir / "safe_streaming_history.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(safe_streaming_data, f, indent=2, ensure_ascii=False)
        
        print(f"  Saved {len(safe_streaming_data)} safe streaming records to: {output_path}")

    def create_safe_playlists(self):
        """Create a safe version of playlists with only essential data"""
        print("Creating safe playlists...")
        
        safe_playlists = []
        
        playlist_files = glob.glob(str(self.data_dir / "Spotify Account Data" / "Playlist*.json"))
        
        for file_path in playlist_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if isinstance(data, dict) and "playlists" in data:
                    for playlist in data["playlists"]:
                        # Only include essential, non-sensitive fields
                        safe_playlist = {
                            "name": playlist.get("name", ""),
                            "description": playlist.get("description", ""),
                            "numberOfFollowers": playlist.get("numberOfFollowers", 0),
                            "items": []
                        }
                        
                        # Process playlist items
                        if "items" in playlist:
                            for item in playlist["items"]:
                                safe_item = {
                                    "trackName": item.get("track", {}).get("trackName", ""),
                                    "artistName": item.get("track", {}).get("artistName", ""),
                                    "albumName": item.get("track", {}).get("albumName", ""),
                                    "addedAt": item.get("addedAt", "")
                                }
                                safe_playlist["items"].append(safe_item)
                        
                        safe_playlists.append(safe_playlist)
                
            except Exception as e:
                print(f"  Error processing playlist file {file_path}: {e}")
        
        # Save safe playlists
        output_path = self.output_dir / "safe_playlists.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({"playlists": safe_playlists}, f, indent=2, ensure_ascii=False)
        
        print(f"  Saved {len(safe_playlists)} safe playlists to: {output_path}")

    def sanitize_all_files(self):
        """Sanitize all JSON files in the Spotify data directories"""
        print("Starting data sanitization process...")
        print("=" * 60)
        
        # Find all JSON files in Spotify data directories
        spotify_dirs = [
            "Spotify Account Data",
            "Spotify Extended Streaming History"
        ]
        
        for dir_name in spotify_dirs:
            dir_path = self.data_dir / dir_name
            if dir_path.exists():
                print(f"\nProcessing directory: {dir_name}")
                json_files = glob.glob(str(dir_path / "*.json"))
                
                for file_path in json_files:
                    sanitized_data = self.sanitize_file(Path(file_path))
                    if sanitized_data is not None:
                        self.save_sanitized_file(Path(file_path), sanitized_data)
            else:
                print(f"Directory not found: {dir_name}")

    def save_sanitization_report(self, output_file="sanitization_report.json"):
        """Save the sanitization report"""
        output_path = self.output_dir / output_file
        
        report = {
            "sanitization_stats": self.sanitization_stats,
            "output_directory": str(self.output_dir),
            "redaction_patterns": list(self.redaction_patterns.keys()),
            "removed_fields": self.remove_fields
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\nSanitization report saved to: {output_path}")

    def print_summary(self):
        """Print a summary of the sanitization process"""
        print("\n" + "=" * 60)
        print("DATA SANITIZATION SUMMARY")
        print("=" * 60)
        
        print(f"Files processed: {self.sanitization_stats['files_processed']}")
        print(f"Files sanitized: {self.sanitization_stats['files_sanitized']}")
        print(f"Total redactions: {self.sanitization_stats['total_redactions']}")
        print(f"Output directory: {self.output_dir}")
        
        print("\nSafe data files created:")
        safe_files = [
            "safe_streaming_history.json",
            "safe_playlists.json"
        ]
        
        for file_name in safe_files:
            file_path = self.output_dir / file_name
            if file_path.exists():
                print(f"  ✅ {file_name}")
            else:
                print(f"  ❌ {file_name} (not created)")

    def run(self):
        """Run the complete sanitization process"""
        self.sanitize_all_files()
        self.create_safe_streaming_history()
        self.create_safe_playlists()
        self.save_sanitization_report()
        self.print_summary()

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Sanitize Spotify data for safe publication")
    parser.add_argument("--data-dir", default=".", help="Directory containing Spotify data folders")
    parser.add_argument("--output-dir", default="sanitized_data", help="Output directory for sanitized data")
    
    args = parser.parse_args()
    
    sanitizer = SpotifyDataSanitizer(args.data_dir, args.output_dir)
    sanitizer.run()

if __name__ == "__main__":
    main()
