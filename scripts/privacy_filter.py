#!/usr/bin/env python3
"""
Spotify Privacy Filter Script

This script analyzes Spotify data files and identifies potentially sensitive information
that should not be published to GitHub. It provides recommendations for data sanitization.
"""

import json
import os
import glob
import re
from pathlib import Path
from datetime import datetime
from collections import defaultdict

class SpotifyPrivacyFilter:
    def __init__(self, data_dir="."):
        self.data_dir = Path(data_dir)
        self.sensitive_patterns = {
            'ip_addresses': r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b',
            'email_addresses': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'device_ids': r'\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b',
            'spotify_uris': r'spotify:(track|album|artist|playlist|user):[a-zA-Z0-9]+',
            'mac_addresses': r'\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b',
            'phone_numbers': r'\b\+?[1-9]\d{1,14}\b',
            'credit_cards': r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b'
        }
        
        self.sensitive_fields = {
            'high_risk': [
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
                'ssn', 'socialSecurity', 'passport'
            ],
            'medium_risk': [
                'location', 'latitude', 'longitude', 'gps',
                'timezone', 'timeZone',
                'language', 'locale',
                'platform', 'os', 'operatingSystem',
                'browser', 'userAgent',
                'connection', 'network', 'wifi',
                'bluetooth', 'bluetoothAddress'
            ],
            'low_risk': [
                'timestamp', 'date', 'time',
                'duration', 'msPlayed',
                'trackName', 'artistName', 'albumName',
                'playlistName', 'playlist_name'
            ]
        }
        
        self.analysis_results = {
            'files_analyzed': 0,
            'sensitive_data_found': defaultdict(list),
            'recommendations': [],
            'safe_files': [],
            'risky_files': [],
            'timestamp': datetime.now().isoformat()
        }

    def analyze_file(self, file_path):
        """Analyze a single file for sensitive data"""
        print(f"Analyzing: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            file_issues = []
            file_path_str = str(file_path)
            
            # Check file path for sensitive patterns
            for pattern_name, pattern in self.sensitive_patterns.items():
                matches = re.findall(pattern, file_path_str)
                if matches:
                    file_issues.append(f"Path contains {pattern_name}: {matches}")
            
            # Recursively analyze JSON structure
            issues = self._analyze_json_structure(data, file_path.name)
            file_issues.extend(issues)
            
            if file_issues:
                self.analysis_results['risky_files'].append({
                    'file': str(file_path),
                    'issues': file_issues
                })
                self.analysis_results['sensitive_data_found'][str(file_path)] = file_issues
            else:
                self.analysis_results['safe_files'].append(str(file_path))
            
            self.analysis_results['files_analyzed'] += 1
            
        except Exception as e:
            print(f"  Error analyzing {file_path}: {e}")
            self.analysis_results['risky_files'].append({
                'file': str(file_path),
                'issues': [f"Error reading file: {e}"]
            })

    def _analyze_json_structure(self, obj, context=""):
        """Recursively analyze JSON structure for sensitive data"""
        issues = []
        
        if isinstance(obj, dict):
            for key, value in obj.items():
                # Check field names for sensitive patterns
                key_issues = self._check_field_name(key, context)
                issues.extend(key_issues)
                
                # Check values for sensitive patterns
                value_issues = self._check_field_value(value, f"{context}.{key}")
                issues.extend(value_issues)
                
                # Recursively check nested structures
                if isinstance(value, (dict, list)):
                    nested_issues = self._analyze_json_structure(value, f"{context}.{key}")
                    issues.extend(nested_issues)
                    
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                if isinstance(item, (dict, list)):
                    nested_issues = self._analyze_json_structure(item, f"{context}[{i}]")
                    issues.extend(nested_issues)
        
        return issues

    def _check_field_name(self, field_name, context):
        """Check if a field name contains sensitive patterns"""
        issues = []
        field_lower = field_name.lower()
        
        # Check against sensitive field patterns
        for risk_level, fields in self.sensitive_fields.items():
            for sensitive_field in fields:
                if sensitive_field.lower() in field_lower:
                    issues.append(f"Field '{field_name}' in {context} matches {risk_level} pattern: {sensitive_field}")
        
        # Check for sensitive patterns in field names
        for pattern_name, pattern in self.sensitive_patterns.items():
            if re.search(pattern, field_name):
                issues.append(f"Field name '{field_name}' in {context} contains {pattern_name}")
        
        return issues

    def _check_field_value(self, value, context):
        """Check if a field value contains sensitive patterns"""
        issues = []
        
        if isinstance(value, str):
            # Check for sensitive patterns in string values
            for pattern_name, pattern in self.sensitive_patterns.items():
                matches = re.findall(pattern, value)
                if matches:
                    issues.append(f"Value in {context} contains {pattern_name}: {matches[:3]}...")  # Show first 3 matches
        
        elif isinstance(value, (int, float)):
            # Check for potential sensitive numeric values
            if value > 1000000000000:  # Large numbers might be IDs
                issues.append(f"Large numeric value in {context}: {value}")
        
        return issues

    def analyze_all_files(self):
        """Analyze all JSON files in the Spotify data directories"""
        print("Starting privacy analysis of Spotify data files...")
        print("=" * 60)
        
        # Find all JSON files in Spotify data directories
        spotify_dirs = [
            "Spotify Account Data",
            "Spotify Extended Streaming History", 
            "Spotify Technical Log Information"
        ]
        
        for dir_name in spotify_dirs:
            dir_path = self.data_dir / dir_name
            if dir_path.exists():
                print(f"\nAnalyzing directory: {dir_name}")
                json_files = glob.glob(str(dir_path / "*.json"))
                
                for file_path in json_files:
                    self.analyze_file(Path(file_path))
            else:
                print(f"Directory not found: {dir_name}")

    def generate_recommendations(self):
        """Generate recommendations based on analysis results"""
        print("\nGenerating privacy recommendations...")
        
        recommendations = []
        
        # Analyze findings
        total_risky_files = len(self.analysis_results['risky_files'])
        total_safe_files = len(self.analysis_results['safe_files'])
        
        if total_risky_files == 0:
            recommendations.append("✅ All files appear to be safe for GitHub publication")
        else:
            recommendations.append(f"⚠️  Found {total_risky_files} files with potential sensitive data")
            
            # Group issues by type
            issue_types = defaultdict(int)
            for file_data in self.analysis_results['risky_files']:
                for issue in file_data['issues']:
                    if 'ip_addresses' in issue:
                        issue_types['IP Addresses'] += 1
                    elif 'email_addresses' in issue:
                        issue_types['Email Addresses'] += 1
                    elif 'device_ids' in issue:
                        issue_types['Device IDs'] += 1
                    elif 'spotify_uris' in issue:
                        issue_types['Spotify URIs'] += 1
                    else:
                        issue_types['Other'] += 1
            
            for issue_type, count in issue_types.items():
                recommendations.append(f"  - {issue_type}: {count} instances found")
        
        # Specific recommendations
        if any('Technical Log Information' in file for file in self.analysis_results['sensitive_data_found']):
            recommendations.append("🚨 RECOMMENDATION: Consider excluding 'Spotify Technical Log Information' directory entirely")
        
        if any('ip_addresses' in str(issues) for issues in self.analysis_results['sensitive_data_found'].values()):
            recommendations.append("🔒 RECOMMENDATION: Remove or anonymize IP addresses before publishing")
        
        if any('email_addresses' in str(issues) for issues in self.analysis_results['sensitive_data_found'].values()):
            recommendations.append("📧 RECOMMENDATION: Remove or redact email addresses before publishing")
        
        if any('device_ids' in str(issues) for issues in self.analysis_results['sensitive_data_found'].values()):
            recommendations.append("📱 RECOMMENDATION: Remove or anonymize device IDs before publishing")
        
        self.analysis_results['recommendations'] = recommendations

    def save_analysis_report(self, output_file="privacy_analysis_report.json"):
        """Save the analysis report to a JSON file"""
        output_path = self.data_dir / output_file
        
        print(f"\nSaving analysis report to: {output_path}")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.analysis_results, f, indent=2, ensure_ascii=False)
        
        print(f"Analysis report saved successfully!")

    def print_summary(self):
        """Print a summary of the analysis results"""
        print("\n" + "=" * 60)
        print("PRIVACY ANALYSIS SUMMARY")
        print("=" * 60)
        
        print(f"Files analyzed: {self.analysis_results['files_analyzed']}")
        print(f"Safe files: {len(self.analysis_results['safe_files'])}")
        print(f"Files with issues: {len(self.analysis_results['risky_files'])}")
        
        print("\nRECOMMENDATIONS:")
        for rec in self.analysis_results['recommendations']:
            print(f"  {rec}")
        
        if self.analysis_results['risky_files']:
            print("\nFILES WITH POTENTIAL SENSITIVE DATA:")
            for file_data in self.analysis_results['risky_files'][:5]:  # Show first 5
                print(f"  - {file_data['file']}")
                for issue in file_data['issues'][:3]:  # Show first 3 issues
                    print(f"    • {issue}")
                if len(file_data['issues']) > 3:
                    print(f"    • ... and {len(file_data['issues']) - 3} more issues")
            if len(self.analysis_results['risky_files']) > 5:
                print(f"  ... and {len(self.analysis_results['risky_files']) - 5} more files")

    def run(self):
        """Run the complete privacy analysis"""
        self.analyze_all_files()
        self.generate_recommendations()
        self.save_analysis_report()
        self.print_summary()

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Analyze Spotify data for privacy concerns")
    parser.add_argument("--data-dir", default=".", help="Directory containing Spotify data folders")
    parser.add_argument("--output", default="privacy_analysis_report.json", help="Output report file name")
    
    args = parser.parse_args()
    
    filter_tool = SpotifyPrivacyFilter(args.data_dir)
    filter_tool.run()

if __name__ == "__main__":
    main()
