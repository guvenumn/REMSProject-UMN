#!/bin/bash

# Simplified Dependency Analysis Export Script
# This script runs dependency analysis tools and exports results to the web server

# Configuration
WEB_DIR="/var/www/html"
PROJECT_DIR="/var/www/rems"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="$WEB_DIR/code-analysis-$TIMESTAMP"
CURRENT_DATE=$(date)

# Create output directory
mkdir -p "$OUTPUT_DIR"
chmod 755 "$OUTPUT_DIR"

echo "=== Starting dependency analysis ==="
echo "Results will be available at: http://24.144.115.137/code-analysis-$TIMESTAMP/"

# Run Dependo on the full project
cd "$PROJECT_DIR"
echo "Running Dependo on frontend..."

echo "Generating full project dependency graph..."
dependo -f amd frontend/src/ > "$OUTPUT_DIR/full-dependencies.html"

echo "Generating component dependency graph..."
dependo -f amd frontend/src/components/ > "$OUTPUT_DIR/component-dependencies.html"

echo "Generating utility dependency graph..."
dependo -f amd frontend/src/utils/ > "$OUTPUT_DIR/utility-dependencies.html"

# Find files that aren't imported by any other files
echo "Analyzing imports..."
cd "$PROJECT_DIR/frontend/src"

# Create a temporary file to store grep results
GREP_RESULTS=$(mktemp)

# Search for all imports
find . -type f -name "*.ts" -o -name "*.tsx" | xargs grep -l "import.*from" > "$GREP_RESULTS"

# Generate a report of files that aren't imported anywhere
cat > "$OUTPUT_DIR/files-not-imported.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Files Not Imported</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem; line-height: 1.6; }
    h1, h2 { color: #333; }
    .warning { color: #856404; background-color: #fff3cd; padding: 0.75rem; border-radius: 0.25rem; margin-bottom: 1rem; }
    table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    tr:hover { background-color: #f5f5f5; }
    .file-path { font-family: monospace; }
    .likely-used { background-color: #d4edda; }
    .potentially-unused { background-color: #f8d7da; }
  </style>
</head>
<body>
  <h1>Files Not Imported</h1>
  
  <div class="warning">
    <strong>Note:</strong> This analysis might not catch all usage patterns. Files that are dynamically imported or used by Next.js conventions might be incorrectly flagged as unused.
  </div>
  
  <h2>Analysis Results</h2>
  
  <table>
    <thead>
      <tr>
        <th>File Path</th>
        <th>Status</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
EOF

# Find all TypeScript/JavaScript files
ALL_FILES=$(find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | sort)

# Backend API routes
API_ROUTES=$(find ./app/api -type f -name "route.ts" 2>/dev/null)

# Page components
PAGE_FILES=$(find ./app -type f -name "page.tsx" 2>/dev/null)

# Layout components
LAYOUT_FILES=$(find ./app -type f -name "layout.tsx" 2>/dev/null)

# For each file, check if it's imported anywhere
for file in $ALL_FILES; do
  # Get basename without extension
  BASE=$(basename "$file" | sed 's/\.[^.]*$//')
  
  # Check if this file is imported anywhere
  IMPORTED=$(grep -l "import.*from.*['\"].*$BASE" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -r . || echo "")
  
  # Skip checking files that are imported
  if [ -n "$IMPORTED" ]; then
    continue
  fi
  
  # Determine if this is a special file that might not need imports
  IS_PAGE=$(echo "$PAGE_FILES" | grep -q "$file" && echo "yes" || echo "no")
  IS_LAYOUT=$(echo "$LAYOUT_FILES" | grep -q "$file" && echo "yes" || echo "no")
  IS_API_ROUTE=$(echo "$API_ROUTES" | grep -q "$file" && echo "yes" || echo "no")
  IS_INDEX=$(echo "$file" | grep -q "index.ts" && echo "yes" || echo "no")
  
  # Determine status and notes
  if [ "$IS_PAGE" = "yes" ] || [ "$IS_LAYOUT" = "yes" ] || [ "$IS_API_ROUTE" = "yes" ]; then
    STATUS="Likely Used"
    NOTES="Next.js convention file (page, layout, or API route)"
    CSS_CLASS="likely-used"
  elif [ "$IS_INDEX" = "yes" ]; then
    STATUS="Likely Used"
    NOTES="Index file for directory exports"
    CSS_CLASS="likely-used"
  else
    STATUS="Potentially Unused"
    NOTES="Not imported by any other file"
    CSS_CLASS="potentially-unused"
  fi
  
  # Write to the report
  echo "<tr class=\"$CSS_CLASS\">" >> "$OUTPUT_DIR/files-not-imported.html"
  echo "  <td class=\"file-path\">$file</td>" >> "$OUTPUT_DIR/files-not-imported.html"
  echo "  <td>$STATUS</td>" >> "$OUTPUT_DIR/files-not-imported.html"
  echo "  <td>$NOTES</td>" >> "$OUTPUT_DIR/files-not-imported.html"
  echo "</tr>" >> "$OUTPUT_DIR/files-not-imported.html"
done

# Close the HTML file
cat >> "$OUTPUT_DIR/files-not-imported.html" << EOF
    </tbody>
  </table>
</body>
</html>
EOF

# Create a simpler, static index.html file
cat > "$OUTPUT_DIR/index.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Dependency Analysis</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem; line-height: 1.6; }
    h1, h2 { color: #333; }
    .container { max-width: 1200px; margin: 0 auto; }
    .report-card { border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; border-radius: 4px; }
    .report-card h3 { margin-top: 0; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .timestamp { color: #666; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Code Dependency Analysis</h1>
    <p class="timestamp">Generated on $CURRENT_DATE</p>
    
    <h2>Available Reports</h2>
    <div id="reports">
      <div class="report-card">
        <h3>Full Project Dependencies</h3>
        <p>Interactive visualization of all frontend code dependencies</p>
        <a href="full-dependencies.html" target="_blank">View Report</a>
      </div>
      
      <div class="report-card">
        <h3>Component Dependencies</h3>
        <p>Visualization of dependencies between UI components</p>
        <a href="component-dependencies.html" target="_blank">View Report</a>
      </div>
      
      <div class="report-card">
        <h3>Utility Dependencies</h3>
        <p>Visualization of utility functions dependencies</p>
        <a href="utility-dependencies.html" target="_blank">View Report</a>
      </div>
      
      <div class="report-card">
        <h3>Files Not Imported</h3>
        <p>Analysis of files that aren't imported by other files</p>
        <a href="files-not-imported.html" target="_blank">View Report</a>
      </div>
    </div>
  </div>
</body>
</html>
EOF

# Clean up
rm "$GREP_RESULTS"

# Set appropriate permissions
chmod -R 755 "$OUTPUT_DIR"

echo "=== Analysis complete ==="
echo "Results available at: http://24.144.115.137/code-analysis-$TIMESTAMP/"
echo "Open this URL in your browser to view the reports"