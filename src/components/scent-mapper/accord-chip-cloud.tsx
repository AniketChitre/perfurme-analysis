"use client";

import type { Accord } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AccordChipCloudProps {
  data: Accord[];
}

export default function AccordChipCloud({ data }: AccordChipCloudProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Accord Cloud</CardTitle>
        <CardDescription>
          Visual representation of all unique accords.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {data.map((item) => (
            <Badge key={item.accord} variant="secondary" className="font-normal">
              {item.accord}
              <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 p-1 text-xs font-medium text-primary-foreground">
                {item.count}
              </span>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
