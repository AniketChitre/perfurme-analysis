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
import { ChartTooltipContent } from "@/components/ui/chart";

interface AccordBarChartProps {
  data: Accord[];
}

export default function AccordBarChart({ data }: AccordBarChartProps) {
  const chartData = data.slice(0, 15).reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Top 15 Accords</CardTitle>
        <CardDescription>Frequency of the most common accords.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis
              dataKey="accord"
              type="category"
              width={100}
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--accent))" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col space-y-1">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Accord
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {data.accord}
                          </span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Count
                          </span>
                          <span className="font-bold">{data.count}</span>
                        </div>
                         <div className="flex flex-col space-y-1">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Share
                          </span>
                          <span className="font-bold">{data.share.toFixed(2)}%</span>
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
