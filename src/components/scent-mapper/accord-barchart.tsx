"use client";

import type { Accord } from "@/lib/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AccordBarChartProps {
  data: Accord[];
  topN?: number; // optional prop to choose how many to show
}

export default function AccordBarChart({ data, topN = 15 }: AccordBarChartProps) {
  const chartData = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Top {topN} Accords</CardTitle>
        <CardDescription>Frequency of the most common accords.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis
              dataKey="accord"
              type="category"
              width={120}
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--accent))" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as Accord;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col space-y-1">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">Accord</span>
                          <span className="font-bold text-muted-foreground">{d.accord}</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">Count</span>
                          <span className="font-bold">{d.count}</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">Share</span>
                          <span className="font-bold">
                            {typeof d.share === "number" ? d.share.toFixed(2) : "-"}%
                          </span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">Avg. Rating</span>
                          <span className="font-bold">
                            {typeof (d as any).averageRating === "number"
                              ? (d as any).averageRating.toFixed(2)
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
