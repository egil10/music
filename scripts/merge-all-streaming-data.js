// Merge all Spotify streaming history files from 2015-2025
// This script combines all the individual year files into one complete dataset

const fs = require("fs");
const path = require("path");

const STREAMING_HISTORY_DIR = "Spotify Extended Streaming History";
const OUTPUT_FILE = "raw/merged_spotify_data_complete.json";

// Get all streaming history files
function getStreamingHistoryFiles() {
  const files = fs.readdirSync(STREAMING_HISTORY_DIR);
  return files
    .filter(file => file.startsWith("Streaming_History_Audio_") && file.endsWith(".json"))
    .sort(); // Sort to process in chronological order
}

// Merge all streaming history data
function mergeStreamingHistory() {
  console.log("🔄 Merging all streaming history files...");
  
  const files = getStreamingHistoryFiles();
  console.log(`Found ${files.length} streaming history files:`);
  files.forEach(file => console.log(`  - ${file}`));
  
  const allStreamingHistory = [];
  const yearStats = {};
  
  for (const file of files) {
    const filePath = path.join(STREAMING_HISTORY_DIR, file);
    console.log(`\n📁 Processing ${file}...`);
    
    try {
      const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (Array.isArray(fileData)) {
        // Direct array of streaming history
        const year = new Date(fileData[0]?.endTime).getFullYear();
        yearStats[year] = (yearStats[year] || 0) + fileData.length;
        allStreamingHistory.push(...fileData);
        console.log(`  ✅ Added ${fileData.length} records from ${year}`);
      } else if (fileData.streaming_history && Array.isArray(fileData.streaming_history)) {
        // Nested structure with streaming_history array
        const year = new Date(fileData.streaming_history[0]?.endTime).getFullYear();
        yearStats[year] = (yearStats[year] || 0) + fileData.streaming_history.length;
        allStreamingHistory.push(...fileData.streaming_history);
        console.log(`  ✅ Added ${fileData.streaming_history.length} records from ${year}`);
      } else {
        console.log(`  ⚠️  Skipping ${file} - unexpected format`);
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${file}:`, error.message);
    }
  }
  
  // Sort by endTime to ensure chronological order
  allStreamingHistory.sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
  
  // Create the merged data structure
  const mergedData = {
    streaming_history: allStreamingHistory,
    metadata: {
      total_records: allStreamingHistory.length,
      year_breakdown: yearStats,
      date_range: {
        earliest: allStreamingHistory[0]?.endTime,
        latest: allStreamingHistory[allStreamingHistory.length - 1]?.endTime
      },
      files_processed: files,
      merge_timestamp: new Date().toISOString()
    }
  };
  
  // Ensure output directory exists
  if (!fs.existsSync("raw")) {
    fs.mkdirSync("raw", { recursive: true });
  }
  
  // Write the merged data
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mergedData, null, 2));
  
  console.log("\n✅ Merge completed!");
  console.log(`📊 Total records: ${allStreamingHistory.length}`);
  console.log("📅 Year breakdown:");
  Object.entries(yearStats)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([year, count]) => {
      console.log(`  ${year}: ${count} records`);
    });
  console.log(`📁 Output: ${OUTPUT_FILE}`);
  
  return mergedData;
}

// Run the merge
mergeStreamingHistory();
