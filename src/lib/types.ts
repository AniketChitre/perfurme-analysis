export type PerfumeData = Record<string, string>;

export interface Accord {
  accord: string;
  count: number;
  share: number;
  averageRating: number;
}

export interface AccordsByYear {
  year: number;
  [accord: string]: number;
}
