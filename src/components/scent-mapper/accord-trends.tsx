"use client";

import type { PerfumeData } from "@/lib/types";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface AccordTrendsProps {
  perfumes: PerfumeData[];
  accordColumns: string[];
}

type YearlyAccordData = {
  year: number;
  totalPerfumes: number;
  [key: string]: number; // For top 5 accord counts
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function AccordTrends({ perfumes, accordColumns }: AccordTrendsProps) {
  const { chartData, top5Accords } = useMemo(() => {
    // 1. Filter data for years 2019-2024
    const filteredPerfumes = perfumes.filter(p => {
        const year = parseInt(p.Year, 10);
        return year >= 2019 && year <= 2024;
    });

    // 2. Find the top 5 most common accords in that period
    const accordFrequency = new Map<string, number>();
    filteredPerfumes.forEach(perfume => {
        const uniqueAccords = new Set<string>();
        accordColumns.forEach(col => {
            const accord = perfume[col]?.toLowerCase().trim();
            if (accord) {
                uniqueAccords.add(accord);
            }
        });
        uniqueAccords.forEach(accord => {
            accordFrequency.set(accord, (accordFrequency.get(accord) || 0) + 1);
        });
    });

    const top5Accords = [...accordFrequency.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => entry[0]);
    
    // 3. Group data by year and count accords
    const dataByYear = new Map<number, { accordCounts: Map<string, number>, totalPerfumes: number }>();
    for (let year = 2019; year <= 2024; year++) {
        dataByYear.set(year, { accordCounts: new Map(), totalPerfumes: 0 });
    }

    filteredPerfumes.forEach(perfume => {
        const year = parseInt(perfume.Year, 10);
        const yearData = dataByYear.get(year);
        if (yearData) {
            yearData.totalPerfumes++;
            const uniqueAccordsInRow = new Set<string>();
            accordColumns.forEach(col => {
                const accord = perfume[col]?.toLowerCase().trim();
                if (accord) {
                    uniqueAccordsInRow.add(accord);
                }
            });

            uniqueAccordsInRow.forEach(accord => {
                if (top5Accords.includes(accord)) {
                    yearData.accordCounts.set(accord, (yearData.accordCounts.get(accord) || 0) + 1);
                }
            });
        }
    });
    
    // 4. Format for stacked bar chart
    const chartData: YearlyAccordData[] = [];
    dataByYear.forEach((data, year) => {
        const yearEntry: YearlyAccordData = { year, totalPerfumes: data.totalPerfumes };
        top5Accords.forEach(accord => {
            yearEntry[accord] = data.accordCounts.get(accord) || 0;
        });
        chartData.push(yearEntry);
    });

    chartData.sort((a, b) => a.year - b.year);

    return { chartData, top5Accords };
  }, [perfumes, accordColumns]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Top 5 Accord Trends (2019-2024)</CardTitle>
        <CardDescription>
          Popularity of the top 5 accords by perfume count each year.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis
              label={{ value: "Perfume Count", angle: -90, position: "insideLeft", offset: -5 }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--accent))" }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                    const yearData = chartData.find(d => d.year === label);
                    const total = yearData?.totalPerfumes ?? 1;

                    return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <p className="font-bold mb-2">Year: {label}</p>
                            {payload.slice().reverse().map((p, index) => { // reverse to match legend order
                                const count = p.value as number;
                                const share = total > 0 ? (count / total) * 100 : 0;
                                return (
                                    <div key={index} className="flex items-center justify-between space-x-4">
                                        <div className="flex items-center">
                                            <span style={{width: 10, height: 10, backgroundColor: p.fill, marginRight: 8, display: 'inline-block', borderRadius: '50%'}}></span>
                                            <span className="capitalize text-sm text-muted-foreground">{p.name}</span>
                                        </div>
                                        <span className="text-sm font-bold">{count} ({share.toFixed(1)}%)</span>
                                    </div>
                                );
                            })}
                        </div>
                    );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{fontSize: "14px"}}/>
            {top5Accords.map((accord, index) => (
              <Bar
                key={accord}
                dataKey={accord}
                stackId="a"
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                name={accord.charAt(0).toUpperCase() + accord.slice(1)} // Capitalize for legend
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
