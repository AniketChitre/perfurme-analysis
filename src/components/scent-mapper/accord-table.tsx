"use client";

import * as React from "react";
import type { Accord } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Search } from "lucide-react";

type SortKey = keyof Accord;

interface AccordTableProps {
  data: Accord[];
}

export default function AccordTable({ data }: AccordTableProps) {
  const [filter, setFilter] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  } | null>({ key: "count", direction: "descending" });

  const sortedAndFilteredData = React.useMemo(() => {
    let tableData = [...data];

    if (filter) {
      tableData = tableData.filter((item) =>
        item.accord.toLowerCase().includes(filter.toLowerCase())
      );
    }

    if (sortConfig !== null) {
      tableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return tableData;
  }, [data, filter, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === "ascending" ? (
      <ArrowUpDown className="ml-2 h-4 w-4" /> // Could use ArrowUp
    ) : (
      <ArrowUpDown className="ml-2 h-4 w-4" /> // Could use ArrowDown
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Detailed Breakdown</CardTitle>
        <CardDescription>
          A complete list of all accords found in the dataset.
        </CardDescription>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter accords..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-8"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] overflow-auto rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => requestSort("accord")}
                  >
                    Accord
                    {getSortIndicator("accord")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => requestSort("count")}
                  >
                    Count
                    {getSortIndicator("count")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                   <Button
                    variant="ghost"
                    onClick={() => requestSort("share")}
                  >
                    Share (%)
                    {getSortIndicator("share")}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredData.map((item) => (
                <TableRow key={item.accord}>
                  <TableCell className="font-medium">{item.accord}</TableCell>
                  <TableCell className="text-right">{item.count}</TableCell>
                  <TableCell className="text-right">
                    {item.share.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
