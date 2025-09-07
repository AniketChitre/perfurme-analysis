import ScentMapperPage from '@/components/scent-mapper/scent-mapper-page';
import { promises as fs } from 'fs';
import path from 'path';
import type { PerfumeData } from '@/lib/types';

// Helper function to parse CSV text
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


export default async function Home() {
  // Load and parse the CSV file on the server
  const filePath = path.join(process.cwd(), 'src', 'data', 'perfume-data.csv');
  let perfumes: PerfumeData[] = [];
  let accordColumns: string[] = [];
  let error: string | null = null;

  try {
    // Read the file with latin1 encoding
    const fileContents = await fs.readFile(filePath, 'latin1');
    const parsed = parseCSV(fileContents);
    perfumes = parsed.perfumes;
    accordColumns = parsed.accordColumns;
  } catch (e: any) {
    console.error("Failed to load or parse perfume data:", e);
    error = "Could not load perfume data. Please make sure 'src/data/perfume-data.csv' exists and is correctly formatted.";
  }

  return <ScentMapperPage perfumes={perfumes} accordColumns={accordColumns} error={error} />;
}
