#!/bin/bash

# Dependency Analysis Export Script
# This script runs various dependency analysis tools and exports results to web server directory
exec > >(tee -a "$OUTPUT_DIR/execution.log") 2>&1
echo "Starting execution at $(date)"
# Configuration
WEB_DIR="/var/www/html"
PROJECT_DIR="/var/www/rems"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="$WEB_DIR/code-analysis-$TIMESTAMP"

# Create output directory
mkdir -p "$OUTPUT_DIR"
chmod 755 "$OUTPUT_DIR"

echo "=== Starting dependency analysis ==="
echo "Results will be available at: http://24.144.115.137/code-analysis-$TIMESTAMP/"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Create index.html
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
    <p class="timestamp">Generated on $(date)</p>
    
    <h2>Available Reports</h2>
    <div id="reports">
      <!-- Reports will be added here -->
    </div>
  </div>
  
  <script>
    // This will be filled by the script
    const reports = [];
    
    function renderReports() {
      const reportsContainer = document.getElementById('reports');
      
      if (reports.length === 0) {
        reportsContainer.innerHTML = '<p>No reports generated yet.</p>';
        return;
      }
      
      reportsContainer.innerHTML = reports.map(report => {
        return \`
          <div class="report-card">
            <h3>\${report.title}</h3>
            <p>\${report.description}</p>
            <a href="\${report.url}" target="_blank">View Report</a>
          </div>
        \`;
      }).join('');
    }
    
    // Initial render
    renderReports();
  </script>
</body>
</html>
EOF

# Append a report to the index.html
add_report() {
  local title="$1"
  local description="$2"
  local url="$3"
  
  # Escape any double quotes in the parameters
  title=$(echo "$title" | sed 's/"/\\"/g')
  description=$(echo "$description" | sed 's/"/\\"/g')
  url=$(echo "$url" | sed 's/"/\\"/g')
  
  # Add report to the index.html
  sed -i "/const reports = \[/a\\    { title: \"$title\", description: \"$description\", url: \"$url\" }," "$OUTPUT_DIR/index.html"
}

# Run Dependo on the full project
cd "$PROJECT_DIR"
echo "Running Dependo on frontend..."

if command_exists dependo; then
  echo "Generating full project dependency graph..."
  dependo -f amd frontend/src/ > "$OUTPUT_DIR/full-dependencies.html"
  
  echo "Generating component dependency graph..."
  dependo -f amd frontend/src/components/ > "$OUTPUT_DIR/component-dependencies.html"
  
  echo "Generating utility dependency graph..."
  dependo -f amd frontend/src/utils/ > "$OUTPUT_DIR/utility-dependencies.html"
  
  add_report "Full Project Dependencies" "Interactive visualization of all frontend code dependencies" "full-dependencies.html"
  add_report "Component Dependencies" "Visualization of dependencies between UI components" "component-dependencies.html"
  add_report "Utility Dependencies" "Visualization of utility functions dependencies" "utility-dependencies.html"
else
  echo "Dependo not found. Install with: npm install -g dependo"
fi

# Run ts-unused-exports if available
if command_exists ts-unused-exports; then
  echo "Running ts-unused-exports..."
  ts-unused-exports frontend/tsconfig.json > "$OUTPUT_DIR/unused-exports.txt" 2>&1
  
  # Create a formatted HTML version
  cat > "$OUTPUT_DIR/unused-exports.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unused Exports Analysis</title>
  <style>
    body { font-family: monospace; margin: 2rem; line-height: 1.6; }
    h1 { color: #333; }
    pre { background-color: #f5f5f5; padding: 1rem; border-radius: 4px; overflow: auto; }
  </style>
</head>
<body>
  <h1>Unused Exports Analysis</h1>
  <pre>$(cat "$OUTPUT_DIR/unused-exports.txt")</pre>
</body>
</html>
EOF
  
  add_report "Unused Exports" "Analysis of exported TypeScript symbols that aren't used anywhere" "unused-exports.html"
else
  echo "ts-unused-exports not found. Install with: npm install -g ts-unused-exports"
fi

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

add_report "Files Not Imported" "Analysis of files that aren't imported by other files" "files-not-imported.html"

# Clean up
rm "$GREP_RESULTS"

# Set appropriate permissions
chmod -R 755 "$OUTPUT_DIR"

echo "=== Analysis complete ==="
echo "Results available at: http://24.144.115.137/code-analysis-$TIMESTAMP/"
echo "Open this URL in your browser to view the reports"