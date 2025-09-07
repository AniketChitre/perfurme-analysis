"use client";

import { useState, useMemo, useCallback } from "react";
import type { PerfumeData, Accord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import AccordBarChart from "./accord-barchart";
import AccordTable from "./accord-table";
import ClusterMap from "./cluster-map";

interface ScentMapperPageProps {
    perfumes: PerfumeData[];
    accordColumns: string[];
    error: string | null;
}

export default function ScentMapperPage({ perfumes: initialPerfumes, accordColumns, error }: ScentMapperPageProps) {
  const [genderFilter, setGenderFilter] = useState('all');
  const { toast } = useToast();

  const filteredPerfumes = useMemo(() => {
    if (!initialPerfumes) return [];
    if (genderFilter === 'all') {
        return initialPerfumes;
    }
    return initialPerfumes.filter(p => p.Gender && p.Gender.toLowerCase() === genderFilter);
  }, [initialPerfumes, genderFilter]);

  const analyzeAccords = useCallback((perfumes: PerfumeData[], columns: string[]): Accord[] => {
    const frequencyMap = new Map<string, { count: number; ratings: number[] }>();
    
    perfumes.forEach(perfume => {
        const uniqueAccordsInRow = new Set<string>();
        columns.forEach(col => {
            const accord = perfume[col];
            if (accord) {
                uniqueAccordsInRow.add(accord.toLowerCase().trim());
            }
        });
        
        const rating = parseFloat(perfume['Rating Value']?.replace(',', '.') || '0');

        uniqueAccordsInRow.forEach(accord => {
            if (!frequencyMap.has(accord)) {
                frequencyMap.set(accord, { count: 0, ratings: [] });
            }
            const current = frequencyMap.get(accord)!;
            current.count++;
            if (!isNaN(rating) && rating > 0) {
                current.ratings.push(rating);
            }
        });
    });

    if (frequencyMap.size === 0 && perfumes.length > 0) {
        toast({
            variant: "destructive",
            title: "No Accords Found",
            description: "No data was found in the accord columns for the current filter.",
        });
        return [];
    }

    const totalPerfumesWithAccords = new Set(perfumes.filter(p => columns.some(col => p[col]))).size;

    const sortedAccords: Accord[] = Array.from(frequencyMap.entries())
      .map(([accord, { count, ratings }]) => {
        const sumOfRatings = ratings.reduce((acc, r) => acc + r, 0);
        const averageRating = ratings.length > 0 ? sumOfRatings / ratings.length : 0;
        return { 
          accord, 
          count, 
          share: (count / totalPerfumesWithAccords) * 100,
          averageRating
        };
      })
      .sort((a, b) => b.count - a.count);
      
    return sortedAccords;
  }, [toast]);
  
  const displayedAccords = useMemo(() => {
    if (filteredPerfumes && accordColumns.length > 0) {
      return analyzeAccords(filteredPerfumes, accordColumns);
    }
    return [];
  }, [filteredPerfumes, accordColumns, analyzeAccords]);

  if (error) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl text-destructive flex items-center justify-center gap-2">
                        <AlertTriangle /> Error Loading Data
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{error}</p>
                    <p className="mt-4 text-sm text-muted-foreground">Please check the console for more details.</p>
                </CardContent>
            </Card>
        </div>
    )
  }


  return (
    <div className="min-h-screen bg-background text-foreground font-body">
       <header className="p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="container mx-auto flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-3xl font-headline text-primary-foreground flex items-center gap-2">
          <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-primary"
            >
              <path d="M12 5.5V3.5" />
              <path d="M9.5 3.5h5" />
              <path d="M12 8.5V5.5" />
              <path d="M8 8.5h8" />
              <path d="M19.5 14.5c0-4.1-3.4-7.5-7.5-7.5s-7.5 3.4-7.5 7.5c0 3.1 1.9 5.8 4.5 6.9" />
              <path d="M5.5 18.5c2.9 1.2 6.1 1.2 9 0" />
              <path d="M19 4l1.5 1.5" />
              <path d="M21.5 8l-1.5-1.5" />
              <path d="M17.5 6.5l1.5-1.5" />
            </svg>
            Scent Mapper
          </h1>
          <div className="flex items-center space-x-4 p-2 rounded-lg bg-card border">
            <RadioGroup value={genderFilter} onValueChange={setGenderFilter} className="flex items-center space-x-2">
              <Label>Gender:</Label>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="men" id="men" />
                <Label htmlFor="men">Men</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="women" id="women" />
                <Label htmlFor="women">Women</Label>
              </div>
               <div className="flex items-center space-x-1">
                <RadioGroupItem value="unisex" id="unisex" />
                <Label htmlFor="unisex">Unisex</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        {displayedAccords && filteredPerfumes ? (
            <div className="grid gap-8">
              {displayedAccords.length > 0 ? (
                <>
                <div className="grid md:grid-cols-2 gap-8">
                    <AccordBarChart data={displayedAccords} />
                    <AccordTable data={displayedAccords} />
                </div>
                <div className="grid grid-cols-1 gap-8">
                    <ClusterMap perfumes={filteredPerfumes} accordColumns={accordColumns} />
                </div>
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Data Available</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>There is no perfume data to display for the selected filter. Please select another option.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
        }
      </main>
      <footer className="text-center p-4 border-t text-muted-foreground text-sm">
        <p>Created by UX novice (Aniket Chitre) vibe coding on Firebase.</p>
        <a href="https://www.kaggle.com/datasets/olgagmiufana1/fragrantica-com-fragrance-dataset" target="_blank" rel="noopener noreferrer" className="text-xs mt-2 hover:underline">
            https://www.kaggle.com/datasets/olgagmiufana1/fragrantica-com-fragrance-dataset
        </a>
      </footer>
    </div>
  );
}
