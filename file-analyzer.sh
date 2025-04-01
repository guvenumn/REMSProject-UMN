#!/bin/bash

# File Usage Analysis Script
# This script analyzes which files are potentially unused in your codebase

# Configuration
WEB_DIR="/var/www/html"
PROJECT_DIR="/var/www/rems"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="$WEB_DIR/code-analysis-$TIMESTAMP"
CURRENT_DATE=$(date)

# Create output directory
mkdir -p "$OUTPUT_DIR"
chmod 755 "$OUTPUT_DIR"

echo "=== Starting file usage analysis ==="
echo "Results will be available at: http://24.144.115.137/code-analysis-$TIMESTAMP/"

# Create index.html
cat > "$OUTPUT_DIR/index.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Structure Analysis</title>
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
    <h1>Code Structure Analysis</h1>
    <p class="timestamp">Generated on $CURRENT_DATE</p>
    
    <h2>Available Reports</h2>
    <div id="reports">
      <div class="report-card">
        <h3>Frontend Unused Files</h3>
        <p>Analysis of files in frontend that might be unused</p>
        <a href="frontend-unused-files.html" target="_blank">View Report</a>
      </div>
      
      <div class="report-card">
        <h3>Backend Unused Files</h3>
        <p>Analysis of files in backend that might be unused</p>
        <a href="backend-unused-files.html" target="_blank">View Report</a>
      </div>
      
      <div class="report-card">
        <h3>Frontend Import References</h3>
        <p>Which files are imported by other files</p>
        <a href="frontend-imports.html" target="_blank">View Report</a>
      </div>
      
      <div class="report-card">
        <h3>File Structure</h3>
        <p>Directory structure of your codebase</p>
        <a href="file-structure.html" target="_blank">View Report</a>
      </div>
    </div>
  </div>
</body>
</html>
EOF

# Generate file structure
echo "Generating file structure..."
cd "$PROJECT_DIR"

cat > "$OUTPUT_DIR/file-structure.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>File Structure</title>
  <style>
    body { font-family: monospace; margin: 2rem; line-height: 1.4; }
    h1 { color: #333; }
    pre { background-color: #f5f5f5; padding: 1rem; border-radius: 4px; overflow: auto; }
    .dir { color: #0066cc; font-weight: bold; }
    .file { color: #333; }
  </style>
</head>
<body>
  <h1>Project File Structure</h1>
  <pre>$(find frontend -type f -not -path "*/node_modules/*" -not -path "*/.next/*" | sort | awk '{print "<span class=\"file\">" $0 "</span>"}')
  </pre>
</body>
</html>
EOF

# Frontend unused files analysis
echo "Analyzing frontend files..."
cd "$PROJECT_DIR/frontend"

# Create a report for frontend
cat > "$OUTPUT_DIR/frontend-unused-files.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Frontend Unused Files</title>
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
    .import-count { text-align: center; }
    .search-box { padding: 10px; margin-bottom: 20px; width: 100%; box-sizing: border-box; font-size: 16px; border: 1px solid #ddd; border-radius: 4px; }
  </style>
  <script>
    function filterTable() {
      const input = document.getElementById('searchInput');
      const filter = input.value.toLowerCase();
      const table = document.getElementById('filesTable');
      const rows = table.getElementsByTagName('tr');
      
      for (let i = 1; i < rows.length; i++) {
        const filePath = rows[i].getElementsByTagName('td')[0].textContent.toLowerCase();
        if (filePath.includes(filter)) {
          rows[i].style.display = "";
        } else {
          rows[i].style.display = "none";
        }
      }
    }
    
    function sortTable(n) {
      const table = document.getElementById('filesTable');
      let switchCount = 0;
      let switching = true;
      let dir = "asc";
      let shouldSwitch;
      
      while (switching) {
        switching = false;
        const rows = table.rows;
        
        for (let i = 1; i < (rows.length - 1); i++) {
          shouldSwitch = false;
          const x = rows[i].getElementsByTagName("td")[n];
          const y = rows[i + 1].getElementsByTagName("td")[n];
          
          if (dir === "asc") {
            if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
              shouldSwitch = true;
              break;
            }
          } else if (dir === "desc") {
            if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
              shouldSwitch = true;
              break;
            }
          }
        }
        
        if (shouldSwitch) {
          rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
          switching = true;
          switchCount++;
        } else {
          if (switchCount === 0 && dir === "asc") {
            dir = "desc";
            switching = true;
          }
        }
      }
    }
  </script>
</head>
<body>
  <h1>Frontend Potentially Unused Files</h1>
  
  <div class="warning">
    <strong>Note:</strong> This analysis might not catch all usage patterns. Files that are dynamically imported or used by Next.js conventions might be incorrectly flagged as unused.
  </div>
  
  <input type="text" id="searchInput" class="search-box" onkeyup="filterTable()" placeholder="Search for files...">
  
  <h2>Analysis Results</h2>
  
  <table id="filesTable">
    <thead>
      <tr>
        <th onclick="sortTable(0)">File Path</th>
        <th onclick="sortTable(1)">Status</th>
        <th onclick="sortTable(2)">Notes</th>
      </tr>
    </thead>
    <tbody>
EOF

cd "$PROJECT_DIR/frontend/src"

# Find all TypeScript/JavaScript files
ALL_FILES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | grep -v "node_modules" | sort)

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
  DIR=$(dirname "$file")
  
  # Check if this file is imported anywhere
  IMPORTED=$(grep -l "import.*from.*['\"].*$BASE" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -r . | grep -v "$file" || echo "")
  
  # Also check for imports with the directory
  if [[ "$BASE" == "index" ]]; then
    DIR_IMPORTED=$(grep -l "import.*from.*['\"].*$DIR" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -r . | grep -v "$file" || echo "")
    if [[ -n "$DIR_IMPORTED" ]]; then
      IMPORTED="$IMPORTED $DIR_IMPORTED"
    fi
  fi
  
  # Skip if imported
  if [[ -n "$IMPORTED" ]]; then
    continue
  fi
  
  # Determine if this is a special file that might not need imports
  IS_PAGE=$(echo "$PAGE_FILES" | grep -q "$file" && echo "yes" || echo "no")
  IS_LAYOUT=$(echo "$LAYOUT_FILES" | grep -q "$file" && echo "yes" || echo "no")
  IS_API_ROUTE=$(echo "$API_ROUTES" | grep -q "$file" && echo "yes" || echo "no")
  IS_INDEX=$(echo "$file" | grep -q "index.ts" && echo "yes" || echo "no")
  
  # Determine status and notes
  if [[ "$IS_PAGE" == "yes" ]] || [[ "$IS_LAYOUT" == "yes" ]] || [[ "$IS_API_ROUTE" == "yes" ]]; then
    STATUS="Likely Used"
    NOTES="Next.js convention file (page, layout, or API route)"
    CSS_CLASS="likely-used"
  elif [[ "$IS_INDEX" == "yes" ]]; then
    STATUS="Likely Used"
    NOTES="Index file for directory exports"
    CSS_CLASS="likely-used"
  else
    STATUS="Potentially Unused"
    NOTES="Not imported by any other file"
    CSS_CLASS="potentially-unused"
  fi
  
  # Write to the report
  echo "<tr class=\"$CSS_CLASS\">" >> "$OUTPUT_DIR/frontend-unused-files.html"
  echo "  <td class=\"file-path\">$file</td>" >> "$OUTPUT_DIR/frontend-unused-files.html"
  echo "  <td>$STATUS</td>" >> "$OUTPUT_DIR/frontend-unused-files.html"
  echo "  <td>$NOTES</td>" >> "$OUTPUT_DIR/frontend-unused-files.html"
  echo "</tr>" >> "$OUTPUT_DIR/frontend-unused-files.html"
done

# Close the HTML table
cat >> "$OUTPUT_DIR/frontend-unused-files.html" << EOF
    </tbody>
  </table>
</body>
</html>
EOF

# Backend unused files analysis
echo "Analyzing backend files..."
cd "$PROJECT_DIR/backend"

# Create a report for backend
cat > "$OUTPUT_DIR/backend-unused-files.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Backend Unused Files</title>
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
    .import-count { text-align: center; }
    .search-box { padding: 10px; margin-bottom: 20px; width: 100%; box-sizing: border-box; font-size: 16px; border: 1px solid #ddd; border-radius: 4px; }
  </style>
  <script>
    function filterTable() {
      const input = document.getElementById('searchInput');
      const filter = input.value.toLowerCase();
      const table = document.getElementById('filesTable');
      const rows = table.getElementsByTagName('tr');
      
      for (let i = 1; i < rows.length; i++) {
        const filePath = rows[i].getElementsByTagName('td')[0].textContent.toLowerCase();
        if (filePath.includes(filter)) {
          rows[i].style.display = "";
        } else {
          rows[i].style.display = "none";
        }
      }
    }
    
    function sortTable(n) {
      const table = document.getElementById('filesTable');
      let switchCount = 0;
      let switching = true;
      let dir = "asc";
      let shouldSwitch;
      
      while (switching) {
        switching = false;
        const rows = table.rows;
        
        for (let i = 1; i < (rows.length - 1); i++) {
          shouldSwitch = false;
          const x = rows[i].getElementsByTagName("td")[n];
          const y = rows[i + 1].getElementsByTagName("td")[n];
          
          if (dir === "asc") {
            if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
              shouldSwitch = true;
              break;
            }
          } else if (dir === "desc") {
            if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
              shouldSwitch = true;
              break;
            }
          }
        }
        
        if (shouldSwitch) {
          rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
          switching = true;
          switchCount++;
        } else {
          if (switchCount === 0 && dir === "asc") {
            dir = "desc";
            switching = true;
          }
        }
      }
    }
  </script>
</head>
<body>
  <h1>Backend Potentially Unused Files</h1>
  
  <div class="warning">
    <strong>Note:</strong> This analysis might not catch all usage patterns. Files that are dynamically imported or loaded through configuration might be incorrectly flagged as unused.
  </div>
  
  <input type="text" id="searchInput" class="search-box" onkeyup="filterTable()" placeholder="Search for files...">
  
  <h2>Analysis Results</h2>
  
  <table id="filesTable">
    <thead>
      <tr>
        <th onclick="sortTable(0)">File Path</th>
        <th onclick="sortTable(1)">Status</th>
        <th onclick="sortTable(2)">Notes</th>
      </tr>
    </thead>
    <tbody>
EOF

cd "$PROJECT_DIR/backend/src"

# Find all TypeScript/JavaScript files
ALL_FILES=$(find . -type f -name "*.ts" -o -name "*.js" | sort)

# For each file, check if it's imported anywhere
for file in $ALL_FILES; do
  # Get basename without extension
  BASE=$(basename "$file" | sed 's/\.[^.]*$//')
  
  # Check if this is app.ts or a model
  IS_APP=$(echo "$file" | grep -q "/app.ts" && echo "yes" || echo "no")
  IS_MODEL=$(echo "$file" | grep -q "/models/" && echo "yes" || echo "no")
  IS_ROUTE=$(echo "$file" | grep -q "/routes/" && echo "yes" || echo "no")
  IS_INDEX=$(echo "$file" | grep -q "index.ts" && echo "yes" || echo "no")
  
  # Check if this file is imported anywhere
  IMPORTED=$(grep -l "import.*from.*['\"].*$BASE" --include="*.ts" --include="*.js" -r . | grep -v "$file" || echo "")
  
  # Special handling for index files
  if [[ "$BASE" == "index" ]]; then
    DIR=$(dirname "$file")
    DIR_IMPORTED=$(grep -l "import.*from.*['\"].*$DIR" --include="*.ts" --include="*.js" -r . | grep -v "$file" || echo "")
    if [[ -n "$DIR_IMPORTED" ]]; then
      IMPORTED="$IMPORTED $DIR_IMPORTED"
    fi
  fi
  
  # Skip if imported
  if [[ -n "$IMPORTED" ]]; then
    continue
  fi
  
  # Determine status and notes
  if [[ "$IS_APP" == "yes" ]]; then
    STATUS="Likely Used"
    NOTES="Main application entry point"
    CSS_CLASS="likely-used"
  elif [[ "$IS_MODEL" == "yes" ]]; then
    STATUS="Likely Used"
    NOTES="Database model - might be loaded dynamically"
    CSS_CLASS="likely-used"
  elif [[ "$IS_ROUTE" == "yes" ]]; then
    STATUS="Likely Used"
    NOTES="API route - might be loaded dynamically"
    CSS_CLASS="likely-used"
  elif [[ "$IS_INDEX" == "yes" ]]; then
    STATUS="Likely Used"
    NOTES="Index file for directory exports"
    CSS_CLASS="likely-used"
  else
    STATUS="Potentially Unused"
    NOTES="Not imported by any other file"
    CSS_CLASS="potentially-unused"
  fi
  
  # Write to the report
  echo "<tr class=\"$CSS_CLASS\">" >> "$OUTPUT_DIR/backend-unused-files.html"
  echo "  <td class=\"file-path\">$file</td>" >> "$OUTPUT_DIR/backend-unused-files.html"
  echo "  <td>$STATUS</td>" >> "$OUTPUT_DIR/backend-unused-files.html"
  echo "  <td>$NOTES</td>" >> "$OUTPUT_DIR/backend-unused-files.html"
  echo "</tr>" >> "$OUTPUT_DIR/backend-unused-files.html"
done

# Close the HTML table
cat >> "$OUTPUT_DIR/backend-unused-files.html" << EOF
    </tbody>
  </table>
</body>
</html>
EOF

# Generate file import references
echo "Generating import references..."
cd "$PROJECT_DIR/frontend/src"

# Create a report for frontend imports
cat > "$OUTPUT_DIR/frontend-imports.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Frontend Import References</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem; line-height: 1.6; }
    h1, h2 { color: #333; }
    .file-list { margin-top: 20px; }
    .file-heading { background-color: #f5f5f5; padding: 10px; margin-top: 20px; border-radius: 4px; cursor: pointer; }
    .file-heading:hover { background-color: #e9e9e9; }
    .imports-list { margin-left: 20px; padding-left: 20px; border-left: 2px solid #ddd; }
    .import-item { margin: 5px 0; font-family: monospace; }
    .search-box { padding: 10px; margin-bottom: 20px; width: 100%; box-sizing: border-box; font-size: 16px; border: 1px solid #ddd; border-radius: 4px; }
  </style>
  <script>
    function filterFiles() {
      const input = document.getElementById('searchInput');
      const filter = input.value.toLowerCase();
      const fileHeadings = document.getElementsByClassName('file-heading');
      
      for (let i = 0; i < fileHeadings.length; i++) {
        const filePath = fileHeadings[i].textContent.toLowerCase();
        const fileSection = fileHeadings[i].nextElementSibling;
        
        if (filePath.includes(filter)) {
          fileHeadings[i].style.display = "";
          fileSection.style.display = "";
        } else {
          fileHeadings[i].style.display = "none";
          fileSection.style.display = "none";
        }
      }
    }
    
    function toggleImports(element) {
      const importsList = element.nextElementSibling;
      if (importsList.style.display === "none") {
        importsList.style.display = "block";
      } else {
        importsList.style.display = "none";
      }
    }
  </script>
</head>
<body>
  <h1>Frontend Files Import References</h1>
  
  <p>This report shows import statements found in each file, allowing you to trace dependencies.</p>
  
  <input type="text" id="searchInput" class="search-box" onkeyup="filterFiles()" placeholder="Search for files...">
  
  <div class="file-list">
EOF

# Find all TypeScript files and extract imports
for file in $(find . -type f -name "*.ts" -o -name "*.tsx" | sort); do
  IMPORTS=$(grep -n "import .*from" "$file" || echo "")
  
  if [[ -n "$IMPORTS" ]]; then
    echo "<h3 class=\"file-heading\" onclick=\"toggleImports(this)\">$file</h3>" >> "$OUTPUT_DIR/frontend-imports.html"
    echo "<div class=\"imports-list\">" >> "$OUTPUT_DIR/frontend-imports.html"
    
    while IFS= read -r line; do
      LINE_NUM=$(echo "$line" | cut -d: -f1)
      IMPORT_TEXT=$(echo "$line" | cut -d: -f2-)
      echo "<div class=\"import-item\">Line $LINE_NUM: $IMPORT_TEXT</div>" >> "$OUTPUT_DIR/frontend-imports.html"
    done <<< "$IMPORTS"
    
    echo "</div>" >> "$OUTPUT_DIR/frontend-imports.html"
  fi
done

# Close the HTML
cat >> "$OUTPUT_DIR/frontend-imports.html" << EOF
  </div>
</body>
</html>
EOF

# Set permissions
chmod -R 755 "$OUTPUT_DIR"

echo "=== Analysis complete ==="
echo "Results available at: http://24.144.115.137/code-analysis-$TIMESTAMP/"
echo "Open this URL in your browser to view the reports"