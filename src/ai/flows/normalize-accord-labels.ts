'use server';

/**
 * @fileOverview This file defines a Genkit flow for normalizing accord labels.
 *
 * - normalizeAccordLabels - A function that normalizes accord labels based on user preference and AI decision.
 * - NormalizeAccordLabelsInput - The input type for the normalizeAccordLabels function.
 * - NormalizeAccordLabelsOutput - The return type for the normalizeAccordLabels function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NormalizeAccordLabelsInputSchema = z.object({
  labels: z.array(z.string()).describe('An array of accord labels to normalize.'),
  shouldNormalize: z
    .boolean()
    .describe(
      'A boolean indicating whether the AI should normalize the labels or not, based on the user request.'
    ),
});
export type NormalizeAccordLabelsInput = z.infer<
  typeof NormalizeAccordLabelsInputSchema
>;

const NormalizeAccordLabelsOutputSchema = z.object({
  normalizedLabels: z
    .array(z.string())
    .describe('The array of normalized accord labels.'),
});
export type NormalizeAccordLabelsOutput = z.infer<
  typeof NormalizeAccordLabelsOutputSchema
>;

export async function normalizeAccordLabels(
  input: NormalizeAccordLabelsInput
): Promise<NormalizeAccordLabelsOutput> {
  return normalizeAccordLabelsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'normalizeAccordLabelsPrompt',
  input: {schema: NormalizeAccordLabelsInputSchema},
  output: {schema: NormalizeAccordLabelsOutputSchema},
  prompt: `You are a data normalization expert specializing in accord labels for perfumes.\

  The user has provided a list of accord labels and indicated whether they want you to normalize them. Normalization involves the following steps:

  1.  Replacing multiple spaces with a single space.
  2.  Replacing a single space with a dash.
  3.  Trimming leading/trailing whitespace.

  If the user wants you to normalize, apply these steps to each label. Otherwise, return the labels as they are.

  Here are the accord labels: {{{labels}}}
  Should normalize: {{shouldNormalize}}
  `,
});

const normalizeAccordLabelsFlow = ai.defineFlow(
  {
    name: 'normalizeAccordLabelsFlow',
    inputSchema: NormalizeAccordLabelsInputSchema,
    outputSchema: NormalizeAccordLabelsOutputSchema,
  },
  async input => {
    if (!input.shouldNormalize) {
      return {normalizedLabels: input.labels};
    }
    const {output} = await prompt(input);
    return {
      normalizedLabels: output!.normalizedLabels.map(label =>
        label.replace(/\s+/g, ' ').replace(/ /g, '-').trim()
      ),
    };
  }
);
