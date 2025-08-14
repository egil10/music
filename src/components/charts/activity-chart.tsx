'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ActivityChartProps {
  data: { [month: string]: number }
}

export function ActivityChart({ data }: ActivityChartProps) {
  // Convert data to chart format
  const chartData = Object.entries(data)
    .map(([month, value]) => ({
      month,
      streams: Math.round(value / 60), // Convert to minutes
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="month" 
          stroke="#9CA3AF"
          fontSize={12}
          tickFormatter={(value) => {
            const [year, month] = value.split('-')
            return `${month}/${year.slice(2)}`
          }}
        />
        <YAxis 
          stroke="#9CA3AF"
          fontSize={12}
          tickFormatter={(value) => `${value}m`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F9FAFB',
          }}
          labelFormatter={(value) => {
            const [year, month] = value.split('-')
            return `${month}/${year}`
          }}
          formatter={(value: any) => [`${value} minutes`, 'Listening Time']}
        />
        <Line
          type="monotone"
          dataKey="streams"
          stroke="#1DB954"
          strokeWidth={3}
          dot={{ fill: '#1DB954', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#1DB954', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
