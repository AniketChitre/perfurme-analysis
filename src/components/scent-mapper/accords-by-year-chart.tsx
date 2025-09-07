"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AccordsByYear } from "@/lib/types";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from "recharts";

interface AccordsByYearChartProps {
  data: AccordsByYear[];
  topAccords: string[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(260, 70%, 60%)",
  "hsl(300, 70%, 60%)",
  "hsl(340, 70%, 60%)",
  "hsl(20, 70%, 60%)",
  "hsl(60, 70%, 60%)",
];

export default function AccordsByYearChart({ data, topAccords }: AccordsByYearChartProps) {
    if (!data || data.length === 0) {
        return null;
    }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Top 10 Accords by Year</CardTitle>
        <CardDescription>
          Popularity of the top 10 accords over time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
              }}
            />
            <Legend />
            {topAccords.map((accord, index) => (
              <Line
                key={accord}
                type="monotone"
                dataKey={accord}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
