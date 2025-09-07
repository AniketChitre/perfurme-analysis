"use client";

import type { PerfumeData } from "@/lib/types";
import { useState, useMemo, useTransition, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { PCA } from "ml-pca";
import { kmeans } from "ml-kmeans";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Label as RechartsLabel,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00C49F",
  "#FFBB28", "#FF8042", "#0088FE", "#A4DE6C", "#D0ED57"
];

// Helper to normalize accord strings
const normalizeAccord = (accord: string) => accord.toLowerCase().trim();

interface ClusterMapProps {
  perfumes: PerfumeData[];
  accordColumns: string[];
}

interface VectorizedPerfume {
  perfume: PerfumeData;
  vector: number[];
  processedAccords: string[];
}

interface PlottablePerfume {
  perfume: PerfumeData;
  x: number;
  y: number;
  clusterId: number;
  processedAccords: string[];
}

interface ClusterSummary {
  clusterId: number;
  size: number;
  avgRating: number;
  topAccords: string[];
  centroid: { x: number; y: number };
}

type SortKey = keyof Omit<ClusterSummary, "topAccords" | "centroid">;

export default function ClusterMap({ perfumes, accordColumns }: ClusterMapProps) {
  const [k, setK] = useState(10);
  const [yearRange, setYearRange] = useState([2019, 2024]);
  const [minRating, setMinRating] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedCluster, setHighlightedCluster] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  } | null>({ key: "size", direction: "descending" });

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [debouncedK] = useDebounce(k, 250);
  const [debouncedYearRange] = useDebounce(yearRange, 250);
  const [debouncedMinRating] = useDebounce(minRating, 250);

  const processedData = useMemo(() => {
    // 1. Filter and normalize perfumes
    const filteredPerfumes = perfumes
      .filter(p => {
        const year = parseInt(p.Year, 10);
        const rating = parseFloat(p["Rating Value"]?.replace(',', '.') || "0");
        return (
          year >= debouncedYearRange[0] &&
          year <= debouncedYearRange[1] &&
          rating >= debouncedMinRating &&
          (p.Perfume || p.Brand)
        );
      })
      .slice(0, 10000); // Cap at 10k points for performance

    if (perfumes.length > 10000) {
      toast({
        title: "Dataset Sampled",
        description: "Displaying the first 10,000 perfumes for performance. Summaries use the full dataset.",
      });
    }

    const uniqueAccords = new Set<string>();
    const vectorizedPerfumes: VectorizedPerfume[] = [];

    for (const perfume of filteredPerfumes) {
      const processedAccords = [
        ...new Set(
          accordColumns
            .map(col => perfume[col])
            .filter(Boolean)
            .map(normalizeAccord)
        ),
      ];
      
      if (processedAccords.length > 0) {
        processedAccords.forEach(accord => uniqueAccords.add(accord));
        vectorizedPerfumes.push({ perfume, vector: [], processedAccords });
      }
    }

    const accordIndexMap = new Map([...uniqueAccords].map((acc, i) => [acc, i]));

    // 2. Create multi-hot vectors
    for (const vp of vectorizedPerfumes) {
      const vector = new Array(uniqueAccords.size).fill(0);
      for (const accord of vp.processedAccords) {
        if (accordIndexMap.has(accord)) {
          vector[accordIndexMap.get(accord)!] = 1;
        }
      }
      vp.vector = vector;
    }

    return { vectorizedPerfumes, accordIndexMap };
  }, [perfumes, accordColumns, debouncedYearRange, debouncedMinRating, toast]);
  
  const clusteringResult = useMemo(() => {
    const { vectorizedPerfumes } = processedData;
    if (vectorizedPerfumes.length < debouncedK) {
       if(vectorizedPerfumes.length > 0) {
          toast({
            variant: "destructive",
            title: "Not enough data for clustering",
            description: `Reduced k to ${vectorizedPerfumes.length} due to insufficient data points.`,
          });
          setK(vectorizedPerfumes.length);
       }
       return { plottablePerfumes: [], clusterSummaries: [] };
    }
    
    // 3. K-means clustering
    const matrix = vectorizedPerfumes.map(p => p.vector);
    const kmeansResult = kmeans(matrix, debouncedK, {});
    
    const assignments = kmeansResult.clusters;
    
    // 4. PCA for 2D embedding
    const pca = new PCA(matrix);
    const projected = pca.predict(matrix, { nComponents: 2 }).to2DArray();

    const plottablePerfumes: PlottablePerfume[] = vectorizedPerfumes.map((vp, i) => ({
      perfume: vp.perfume,
      processedAccords: vp.processedAccords,
      x: projected[i][0],
      y: projected[i][1],
      clusterId: assignments[i],
    }));

    // 5. Compute cluster summaries
    const clusters = new Map<number, PlottablePerfume[]>();
    plottablePerfumes.forEach(p => {
      if (!clusters.has(p.clusterId)) clusters.set(p.clusterId, []);
      clusters.get(p.clusterId)!.push(p);
    });

    const clusterSummaries: ClusterSummary[] = [];
    clusters.forEach((points, id) => {
      const ratings = points
        .map(p => parseFloat(p.perfume["Rating Value"]?.replace(',', '.') || '0'))
        .filter(r => r > 0);
      const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      const accordFreq = new Map<string, number>();
      points.forEach(p => {
        p.processedAccords.forEach(acc => {
          accordFreq.set(acc, (accordFreq.get(acc) || 0) + 1);
        });
      });
      const topAccords = [...accordFreq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(e => e[0]);

      const centroid = {
          x: points.reduce((acc, p) => acc + p.x, 0) / points.length,
          y: points.reduce((acc, p) => acc + p.y, 0) / points.length,
      };

      clusterSummaries.push({
        clusterId: id,
        size: points.length,
        avgRating,
        topAccords,
        centroid
      });
    });

    return { plottablePerfumes, clusterSummaries };
  }, [processedData, debouncedK, toast]);
  
  const { plottablePerfumes, clusterSummaries } = clusteringResult;
  
  useEffect(() => {
    startTransition(() => {
       // This is just to trigger the useMemo recalculations when debounced values change
    });
  }, [clusteringResult]);
  
  const finalPlottableData = useMemo(() => {
    let data = plottablePerfumes;
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        data = data.map(p => ({
            ...p,
            perfume: {
                ...p.perfume,
                _isSearched: p.perfume.Perfume?.toLowerCase().includes(lowercasedQuery) || p.perfume.Brand?.toLowerCase().includes(lowercasedQuery)
            }
        }));
    }
    if (highlightedCluster !== null) {
      data = data.filter(p => p.clusterId === highlightedCluster);
    }
    return data;
  }, [plottablePerfumes, searchQuery, highlightedCluster]);

  const sortedSummaries = useMemo(() => {
    let summaries = [...clusterSummaries];
    if (sortConfig !== null) {
      summaries.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return summaries;
  }, [clusterSummaries, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Cluster Map (Accord Combinations)</CardTitle>
        <CardDescription>
          Perfumes grouped by accord combinations to reveal natural families.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="grid gap-2">
            <Label htmlFor="k-select">Number of Clusters (k)</Label>
            <Select value={String(k)} onValueChange={(val) => setK(Number(val))}>
              <SelectTrigger id="k-select">
                <SelectValue placeholder="Select k" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(11).keys()].map(i => (
                  <SelectItem key={i + 5} value={String(i + 5)}>{i + 5}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Year Range: {yearRange[0]} - {yearRange[1]}</Label>
            <Slider
                min={2000}
                max={2024}
                step={1}
                value={yearRange}
                onValueChange={setYearRange}
            />
          </div>
           <div className="grid gap-2">
            <Label>Min. Rating: {minRating.toFixed(1)}</Label>
            <Slider
                min={0}
                max={5}
                step={0.1}
                value={[minRating]}
                onValueChange={([val]) => setMinRating(val)}
            />
          </div>
          <div className="grid gap-2 relative">
             <Label htmlFor="search-perfume">Search Perfume/Brand</Label>
             <Search className="absolute left-2 top-9 h-4 w-4 text-muted-foreground" />
             <Input
                id="search-perfume"
                placeholder="e.g. 'Dior' or 'Sauvage'"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8"
             />
          </div>
        </div>
        <div className="w-full h-[520px] relative">
            {isPending && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <XAxis type="number" dataKey="x" tick={false} name="PCA 1" />
                    <YAxis type="number" dataKey="y" tick={false} name="PCA 2" />
                    <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload as PlottablePerfume;
                                return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm max-w-xs">
                                    <p className="font-bold text-base">{data.perfume.Perfume}</p>
                                    <p className="text-sm text-muted-foreground">{data.perfume.Brand} ({data.perfume.Year})</p>
                                    <p className="text-sm font-medium">Rating: {parseFloat(data.perfume["Rating Value"]?.replace(',', '.') || '0').toFixed(2)}</p>
                                    <p className="text-xs mt-2 break-words">
                                    <span className="font-semibold">Accords: </span>
                                    {data.processedAccords.join(", ")}
                                    </p>
                                </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Legend />
                    <Scatter name="Perfumes" data={finalPlottableData} fill="#8884d8">
                    {finalPlottableData.map((entry, index) => (
                        <circle
                            key={`point-${index}`}
                            cx={entry.x}
                            cy={entry.y}
                            r={((entry.perfume as any)._isSearched) ? 8 : 4}
                            fill={CHART_COLORS[entry.clusterId % CHART_COLORS.length]}
                            fillOpacity={((entry.perfume as any)._isSearched) ? 1 : 0.7}
                            stroke={((entry.perfume as any)._isSearched) ? "hsl(var(--foreground))" : "none"}
                        />
                    ))}
                    </Scatter>

                    {clusterSummaries.map(summary => (
                       <RechartsLabel
                            key={`label-${summary.clusterId}`}
                            value={`Cluster ${summary.clusterId}`}
                            position="top"
                            content={props => {
                                const { x, y, value } = props;
                                const textX = x as number + 5;
                                const textY = y as number;
                                return (
                                  <g transform={`translate(${summary.centroid.x}, ${summary.centroid.y})`}>
                                    <foreignObject x={-75} y={-50} width={150} height={100}>
                                      <div className="text-xs text-center p-1 rounded-md bg-background/80 border border-border shadow-sm">
                                        <p className="font-bold">Cluster {summary.clusterId}</p>
                                        <p>Avg Rating: {summary.avgRating.toFixed(2)}</p>
                                        <p className="truncate">Top: {summary.topAccords.join(', ')}</p>
                                      </div>
                                    </foreignObject>
                                  </g>
                                )
                            }}
                       />
                    ))}

                </ScatterChart>
            </ResponsiveContainer>
        </div>
        <div>
            <h3 className="text-lg font-headline mb-2">Cluster Summary</h3>
             <div className="h-[250px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                        <Button variant="ghost" onClick={() => requestSort("clusterId")}>
                            Cluster ID <ArrowUpDown className="ml-2 h-3 w-3" />
                        </Button>
                    </TableHead>
                    <TableHead>
                         <Button variant="ghost" onClick={() => requestSort("size")}>
                            Size <ArrowUpDown className="ml-2 h-3 w-3" />
                        </Button>
                    </TableHead>
                    <TableHead>
                         <Button variant="ghost" onClick={() => requestSort("avgRating")}>
                            Avg Rating <ArrowUpDown className="ml-2 h-3 w-3" />
                        </Button>
                    </TableHead>
                    <TableHead>Top 3 Accords</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSummaries.map((summary) => (
                    <TableRow
                        key={summary.clusterId}
                        onClick={() => setHighlightedCluster(highlightedCluster === summary.clusterId ? null : summary.clusterId)}
                        className={`cursor-pointer ${highlightedCluster === summary.clusterId ? 'bg-accent' : ''}`}
                    >
                      <TableCell>{summary.clusterId}</TableCell>
                      <TableCell>{summary.size}</TableCell>
                      <TableCell>{summary.avgRating.toFixed(2)}</TableCell>
                      <TableCell>{summary.topAccords.join(', ')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {highlightedCluster !== null && <Button variant="link" onClick={() => setHighlightedCluster(null)}>Clear selection</Button>}
        </div>
      </CardContent>
    </Card>
  );
}
