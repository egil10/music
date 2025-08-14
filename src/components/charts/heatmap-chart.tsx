'use client'

import { AnalyticsData } from '@/types/spotify'

interface HeatmapChartProps {
  data: AnalyticsData
}

export function HeatmapChart({ data }: HeatmapChartProps) {
  // Generate heatmap data from streaming history
  const heatmapData = generateHeatmapData(data.streamingHistory)

  const getColorIntensity = (value: number, maxValue: number) => {
    const intensity = value / maxValue
    if (intensity === 0) return 'bg-gray-800'
    if (intensity < 0.25) return 'bg-spotify-green/20'
    if (intensity < 0.5) return 'bg-spotify-green/40'
    if (intensity < 0.75) return 'bg-spotify-green/60'
    return 'bg-spotify-green/80'
  }

  const maxValue = Math.max(...Object.values(heatmapData))

  return (
    <div className="w-full h-full flex flex-col">
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs text-gray-400 font-medium">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1 flex-1">
        {Array.from({ length: 7 * 24 }, (_, i) => {
          const day = i % 7
          const hour = Math.floor(i / 7)
          const key = `${day}-${hour}`
          const value = heatmapData[key] || 0
          
          return (
            <div
              key={key}
              className={`w-full h-full rounded-sm transition-colors ${getColorIntensity(value, maxValue)}`}
              title={`${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]} ${hour}:00 - ${value} minutes`}
            />
          )
        })}
      </div>
      
      <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
        <span>Less</span>
        <div className="flex space-x-1">
          <div className="w-3 h-3 bg-gray-800 rounded-sm"></div>
          <div className="w-3 h-3 bg-spotify-green/20 rounded-sm"></div>
          <div className="w-3 h-3 bg-spotify-green/40 rounded-sm"></div>
          <div className="w-3 h-3 bg-spotify-green/60 rounded-sm"></div>
          <div className="w-3 h-3 bg-spotify-green/80 rounded-sm"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  )
}

function generateHeatmapData(streamingHistory: any[]) {
  const heatmap: { [key: string]: number } = {}
  
  streamingHistory.forEach(entry => {
    const date = new Date(entry.endTime)
    const day = date.getDay()
    const hour = date.getHours()
    const key = `${day}-${hour}`
    
    if (!heatmap[key]) {
      heatmap[key] = 0
    }
    
    heatmap[key] += entry.duration / 60 // Convert to minutes
  })
  
  return heatmap
}
