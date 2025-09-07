"use client";

import { useState, useTransition, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import type { PerfumeData, Accord } from "@/lib/types";
import { normalizeAccordLabels } from "@/ai/flows/normalize-accord-labels";
import { useToast } from "@/hooks/use-toast";
import { Loader2, File as FileIcon, UploadCloud, Wand2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AccordBarChart from "./accord-barchart";
import AccordTable from "./accord-table";
import AccordChipCloud from "./accord-chip-cloud";
import { Skeleton } from "@/components/ui/skeleton";

export default function ScentMapperPage() {
  const [rawPerfumes, setRawPerfumes] = useState<PerfumeData[] | null>(null);
  const [originalAccords, setOriginalAccords] = useState<Accord[] | null>(null);
  const [normalizedAccords, setNormalizedAccords] = useState<Accord[] | null>(null);
  const [accordColumns, setAccordColumns] = useState<string[]>([]);
  const [isNormalized, setIsNormalized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNormalizing, startNormalizationTransition] = useTransition();
  const { toast } = useToast();
  const [fileName, setFileName] = useState<string | null>(null);

  const displayedAccords = useMemo(() => {
    return isNormalized ? normalizedAccords : originalAccords;
  }, [isNormalized, originalAccords, normalizedAccords]);

  const parseCSV = (csvText: string): { perfumes: PerfumeData[], accordColumns: string[] } => {
    const lines = csvText.trim().split(/\r\n|\n/);
    if (lines.length < 2) throw new Error("CSV file must contain a header and at least one data row.");

    const headerLine = lines[0];
    if (headerLine.split(';').length <= 1) {
        throw new Error("Invalid delimiter. Please use a semicolon (;) delimited file.");
    }
    const headers = headerLine.split(';').map(h => h.trim());
    
    const dynamicAccordColumns = headers.filter(h => {
        const lowerCaseHeader = h.toLowerCase();
        return lowerCaseHeader.startsWith('accord_') || lowerCaseHeader.startsWith('mainaccord');
    });

    if (dynamicAccordColumns.length === 0) {
        throw new Error(`CSV must contain columns starting with 'accord_' or 'mainaccord'.`);
    }

    const data = lines.slice(1).map((line) => {
      const values = line.split(';').map(v => v.trim());
      const entry: PerfumeData = {};
      headers.forEach((header, index) => {
        entry[header] = values[index] || "";
      });
      return entry;
    });

    return { perfumes: data, accordColumns: dynamicAccordColumns };
  };

  const analyzeAccords = (perfumes: PerfumeData[], columns: string[]): Accord[] => {
    const frequencyMap = new Map<string, number>();
    
    perfumes.forEach(perfume => {
        const uniqueAccordsInRow = new Set<string>();
        columns.forEach(col => {
            const accord = perfume[col];
            if (accord) {
                uniqueAccordsInRow.add(accord.toLowerCase().trim());
            }
        });

        uniqueAccordsInRow.forEach(accord => {
            frequencyMap.set(accord, (frequencyMap.get(accord) || 0) + 1);
        });
    });

    if (frequencyMap.size === 0) {
        toast({
            variant: "destructive",
            title: "No Accords Found",
            description: "No data was found in the accord columns. Please check your file.",
        });
        return [];
    }

    const totalPerfumes = perfumes.length;

    const sortedAccords: Accord[] = Array.from(frequencyMap.entries())
      .map(([accord, count]) => ({ accord, count, share: (count / totalPerfumes) * 100 }))
      .sort((a, b) => b.count - a.count);
      
    return sortedAccords;
  };
  
  const handleFile = (file: File) => {
    setIsLoading(true);
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error("File is empty.");
        const { perfumes: parsedData, accordColumns: dynamicAccordColumns } = parseCSV(text);
        setRawPerfumes(parsedData);
        setAccordColumns(dynamicAccordColumns);
        const analysisResult = analyzeAccords(parsedData, dynamicAccordColumns);
        setOriginalAccords(analysisResult);
        setNormalizedAccords(null);
        setIsNormalized(false);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Oh no! Something went wrong.",
          description: error.message,
        });
        handleReset();
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
        toast({
            variant: "destructive",
            title: "File Read Error",
            description: "Could not read the selected file.",
        });
        handleReset();
        setIsLoading(false);
    }

    reader.readAsText(file, 'latin1');
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  const handleNormalizationToggle = (checked: boolean) => {
    setIsNormalized(checked);
    if (checked && !normalizedAccords && rawPerfumes) {
      startNormalizationTransition(async () => {
        try {
          const allAccordLabels = [...new Set(
            rawPerfumes.flatMap(p => accordColumns.map(col => p[col]?.toLowerCase().trim()).filter(Boolean))
          )];
          
          const { normalizedLabels } = await normalizeAccordLabels({
            labels: allAccordLabels,
            shouldNormalize: true,
          });

          const labelMap = new Map(allAccordLabels.map((original, i) => [original, normalizedLabels[i]]));
          
          const normalizedPerfumeData = rawPerfumes.map(perfume => {
              const newPerfume = { ...perfume };
              accordColumns.forEach(col => {
                  const originalAccord = newPerfume[col]?.toLowerCase().trim();
                  if (originalAccord && labelMap.has(originalAccord)) {
                      newPerfume[col] = labelMap.get(originalAccord) || "";
                  }
              });
              return newPerfume;
          });

          const normalizedAnalysis = analyzeAccords(normalizedPerfumeData, accordColumns);
          setNormalizedAccords(normalizedAnalysis);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Normalization Failed",
                description: "The AI-powered normalization could not be completed.",
            });
            setIsNormalized(false); // Revert toggle on failure
        }
      });
    }
  };

  const handleReset = () => {
    setRawPerfumes(null);
    setOriginalAccords(null);
    setNormalizedAccords(null);
    setIsNormalized(false);
    setAccordColumns([]);
    setFileName(null);
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <header className="p-4 border-b">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-headline text-primary-foreground">Scent Mapper</h1>
          {rawPerfumes && <Button onClick={handleReset} variant="outline">Upload New File</Button>}
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        {!rawPerfumes ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Upload Your Perfume Data</CardTitle>
                    <CardDescription>Drag &amp; drop a semicolon-delimited CSV file or click to select.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-accent' : 'border-border hover:border-primary'}`}>
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <UploadCloud className="w-12 h-12" />
                            <p>{isDragActive ? 'Drop the file here...' : 'Drag & drop or click to upload'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </div>
        ) : isLoading ? (
          <div className="grid gap-8">
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-8 w-32" />
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[400px] w-full" />
            </div>
             <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          displayedAccords && (
            <div className="grid gap-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center space-x-2 p-2 rounded-lg bg-card border">
                    <FileIcon className="h-5 w-5 text-primary"/>
                    <span className="font-medium text-primary-foreground">{fileName}</span>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-lg bg-card border">
                  <Wand2 className="h-5 w-5 text-primary" />
                  <Label htmlFor="normalization-switch">AI Normalize Labels</Label>
                  <Switch
                    id="normalization-switch"
                    checked={isNormalized}
                    onCheckedChange={handleNormalizationToggle}
                    disabled={isNormalizing}
                  />
                  {isNormalizing && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <AccordBarChart data={displayedAccords} />
                <AccordChipCloud data={displayedAccords} />
              </div>
              <AccordTable data={displayedAccords} />
            </div>
          )
        )}
      </main>
      <footer className="text-center p-4 border-t text-muted-foreground text-sm">
        <p>Created with elegance by an expert UX designer.</p>
      </footer>
    </div>
  );
}
