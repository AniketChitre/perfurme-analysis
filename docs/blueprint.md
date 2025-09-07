# **App Name**: Scent Mapper

## Core Features:

- CSV Upload and Parsing: Allows users to upload a semicolon-delimited, latin1-encoded CSV file containing perfume data. The application parses the CSV file, storing all data columns for later use.
- Accord Frequency Analysis: Analyzes the extracted data to count the frequency of unique accords across the specified columns. It handles messy data by trimming strings, lowercasing accords, ignoring empty cells, and deduplicating accords within each perfume row.
- Bar Chart Visualization: Renders a bar chart using Chart.js to visualize the frequency of accords in descending order. The chart is interactive, displaying the count and percentage on hover.
- Sortable Table Display: Presents the accord data in a sortable table format, including columns for 'Accord', 'Count', and 'Share (%)'. Users can sort the table by any column and filter the accords based on search criteria.
- Chip Cloud Visualization: Displays a chip cloud of accord tags, sized by rank or with count badges, providing a visual representation of accord importance.
- Data Normalization Tool: Offers a toggle to normalize accord labels (e.g., 'fresh spicy' vs 'fresh-spicy') using a simple mapping to replace multiple spaces with a single space and trim the labels. The AI will decide, in response to a request to do so from the user, if labels in a query should be normalized.
- Error Handling and User Feedback: Provides clear and human-readable error messages for various scenarios, such as wrong delimiter, misnamed columns, or empty files. It also includes loading states and keyboard-navigable interactions to improve the user experience.

## Style Guidelines:

- Primary color: Soft lavender (#E6E6FA) for a gentle and sophisticated feel reminiscent of classic perfume imagery.
- Background color: Light, desaturated off-white (#F5F5F5) to provide a clean and airy backdrop that highlights the data visualizations.
- Accent color: Muted purple (#B0A4C3) to complement the lavender primary, drawing visual interest without overwhelming the user. This accent color guides the user to interactive components and key information.
- Font pairing: 'Playfair' (serif) for headlines, lending an elegant and high-end feel, combined with 'PT Sans' (sans-serif) for body text, ensuring readability and a modern touch.
- Simple and elegant line icons for user interface elements, enhancing clarity and visual appeal. Icons should be monochromatic in the muted purple (#B0A4C3).
- Clean and modern layout with ample whitespace, prioritizing data clarity and ease of navigation. The bar chart, table, and chip cloud should be arranged in a logical flow to facilitate data exploration.
- Subtle transitions and animations for loading states and data updates to provide a smooth and engaging user experience.