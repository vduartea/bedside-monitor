import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";

interface VitalSign {
  time: string;
  hr: number;
  bp: string;
  temp: number;
  spo2: number;
}

interface VitalSignsChartProps {
  data: VitalSign[];
}

export function VitalSignsChart({ data }: VitalSignsChartProps) {
  // Transform data for the chart
  const chartData = data.map((vital) => ({
    time: vital.time,
    "FC (lpm)": vital.hr,
    "Temp (°C)": vital.temp * 10, // Scale for visibility
    "SpO₂ (%)": vital.spo2,
  }));

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="time" 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="FC (lpm)"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="Temp (°C)"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ fill: '#f97316', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="SpO₂ (%)"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={{ fill: '#06b6d4', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {data.map((vital, index) => (
          <Card key={index} className="p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {vital.time}
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>PA:</span>
                <span className="font-bold">{vital.bp}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
