#!/bin/bash

# Basic File Relationship Analyzer
# Creates a simple HTML report of file imports and relationships

# Configuration
WEB_DIR="/var/www/html"
PROJECT_DIR="/var/www/rems"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="$WEB_DIR/code-report-$TIMESTAMP"
CURRENT_DATE=$(date)

# Create output directory
mkdir -p "$OUTPUT_DIR"
chmod 755 "$OUTPUT_DIR"

echo "=== Starting file relationship analysis ==="
echo "Results will be available at: http://24.144.115.137/code-report-$TIMESTAMP/"

# Create index.html
cat > "$OUTPUT_DIR/index.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Structure Analysis</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #333; }
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
    
    <div class="report-card">
      <h3>1. Unused Files Analysis</h3>
      <p>Files that aren't imported anywhere and might be candidates for removal</p>
      <a href="unused-files.html">View Report</a>
    </div>
    
    <div class="report-card">
      <h3>2. Most Important Files</h3>
      <p>Files that are imported by many other files (central to your codebase)</p>
      <a href="important-files.html">View Report</a>
    </div>
    
    <div class="report-card">
      <h3>3. Import Relationships</h3>
      <p>Shows which files import which other files</p>
      <a href="import-relationships.html">View Report</a>
    </div>
    
    <div class="report-card">
      <h3>4. File Directory Structure</h3>
      <p>Overview of your project file structure</p>
      <a href="file-structure.html">View Report</a>
    </div>
  </div>
</body>
</html>
EOF

# Create the unused files report
echo "Generating unused files report..."
cd "$PROJECT_DIR/frontend/src"

cat > "$OUTPUT_DIR/unused-files.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Potentially Unused Files</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #333; }
    .warning { color: #856404; background-color: #fff3cd; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    tr:hover { background-color: #f5f5f5; }
    .potentially-unused { background-color: #ffebee; }
    .likely-used { background-color: #e8f5e9; }
    .search { width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box; border: 1px solid #ddd; border-radius: 4px; }
    .file-path { font-family: monospace; }
    .back-link { margin-bottom: 20px; display: block; }
  </style>
  <script>
    function filterTable() {
      const input = document.getElementById('searchInput');
      const filter = input.value.toLowerCase();
      const table = document.getElementById('filesTable');
      const rows = table.getElementsByTagName('tr');
      
      for (let i = 1; i < rows.length; i++) {
        const td = rows[i].getElementsByTagName('td')[0];
        if (td) {
          const txtValue = td.textContent || td.innerText;
          if (txtValue.toLowerCase().indexOf(filter) > -1) {
            rows[i].style.display = '';
          } else {
            rows[i].style.display = 'none';
          }
        }
      }
    }
  </script>
</head>
<body>
  <div class="container">
    <a href="index.html" class="back-link">← Back to main page</a>
    <h1>Potentially Unused Files</h1>
    
    <div class="warning">
      <strong>Note:</strong> This analysis relies on static code analysis and might miss dynamically loaded files or files used through Next.js routing conventions.
    </div>
    
    <input type="text" id="searchInput" onkeyup="filterTable()" placeholder="Search for files..." class="search">
    
    <table id="filesTable">
      <tr>
        <th>File Path</th>
        <th>Status</th>
        <th>Notes</th>
      </tr>
EOF

# Find all TypeScript/JavaScript files
ALL_FILES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | grep -v "node_modules" | sort)

# API Routes, Pages and Layouts
API_ROUTES=$(find ./app -type f -name "route.ts" 2>/dev/null)
PAGE_FILES=$(find ./app -type f -name "page.tsx" 2>/dev/null)
LAYOUT_FILES=$(find ./app -type f -name "layout.tsx" 2>/dev/null)

# For each file, check if it's imported anywhere
for file in $ALL_FILES; do
  # Get basename without extension for import checking
  BASE=$(basename "$file" | sed 's/\.[^.]*$//')
  DIR=$(dirname "$file")
  
  # Check if this file is imported anywhere
  IMPORTED=$(grep -l "from ['\"].*$BASE['\"]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -r . | grep -v "$file" || echo "")
  
  # For index files, also check if the directory is imported
  if [[ "$BASE" == "index" ]]; then
    DIR_IMPORTED=$(grep -l "from ['\"].*$DIR['\"]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -r . | grep -v "$file" || echo "")
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
  IS_TYPE_DEF=$(echo "$file" | grep -q ".d.ts" && echo "yes" || echo "no")
  
  # Determine status and notes
  if [[ "$IS_PAGE" == "yes" ]] || [[ "$IS_LAYOUT" == "yes" ]] || [[ "$IS_API_ROUTE" == "yes" ]]; then
    STATUS="Likely Used"
    NOTES="Next.js convention (page, layout, or API route)"
    CSS_CLASS="likely-used"
  elif [[ "$IS_INDEX" == "yes" ]]; then
    STATUS="Likely Used"
    NOTES="Index file for directory exports"
    CSS_CLASS="likely-used"
  elif [[ "$IS_TYPE_DEF" == "yes" ]]; then
    STATUS="Likely Used"
    NOTES="TypeScript definition file"
    CSS_CLASS="likely-used"
  else
    STATUS="Potentially Unused"
    NOTES="Not imported by any other file"
    CSS_CLASS="potentially-unused"
  fi
  
  # Add row to the table
  echo "<tr class=\"$CSS_CLASS\">" >> "$OUTPUT_DIR/unused-files.html"
  echo "  <td class=\"file-path\">$file</td>" >> "$OUTPUT_DIR/unused-files.html"
  echo "  <td>$STATUS</td>" >> "$OUTPUT_DIR/unused-files.html"
  echo "  <td>$NOTES</td>" >> "$OUTPUT_DIR/unused-files.html"
  echo "</tr>" >> "$OUTPUT_DIR/unused-files.html"
done

# Close the HTML file
cat >> "$OUTPUT_DIR/unused-files.html" << EOF
    </table>
  </div>
</body>
</html>
EOF

# Create the important files report
echo "Generating important files report..."
cd "$PROJECT_DIR/frontend/src"

cat > "$OUTPUT_DIR/important-files.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Most Important Files</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #333; }
    .info { color: #004085; background-color: #cce5ff; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; cursor: pointer; }
    tr:hover { background-color: #f5f5f5; }
    .file-path { font-family: monospace; }
    .search { width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box; border: 1px solid #ddd; border-radius: 4px; }
    .import-count { font-weight: bold; text-align: center; }
    .very-important { background-color: #e3f2fd; }
    .back-link { margin-bottom: 20px; display: block; }
  </style>
  <script>
    function filterTable() {
      const input = document.getElementById('searchInput');
      const filter = input.value.toLowerCase();
      const table = document.getElementById('filesTable');
      const rows = table.getElementsByTagName('tr');
      
      for (let i = 1; i < rows.length; i++) {
        const td = rows[i].getElementsByTagName('td')[0];
        if (td) {
          const txtValue = td.textContent || td.innerText;
          if (txtValue.toLowerCase().indexOf(filter) > -1) {
            rows[i].style.display = '';
          } else {
            rows[i].style.display = 'none';
          }
        }
      }
    }
    
    function sortTable(n) {
      const table = document.getElementById('filesTable');
      let rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
      switching = true;
      dir = 'desc';  // Start with descending order for imports
      
      while (switching) {
        switching = false;
        rows = table.rows;
        
        for (i = 1; i < (rows.length - 1); i++) {
          shouldSwitch = false;
          
          x = rows[i].getElementsByTagName('td')[n];
          y = rows[i + 1].getElementsByTagName('td')[n];
          
          if (dir == 'asc') {
            if (n === 1) {
              // Numeric comparison for import count
              if (Number(x.innerHTML) > Number(y.innerHTML)) {
                shouldSwitch = true;
                break;
              }
            } else {
              // Text comparison for file path
              if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                shouldSwitch = true;
                break;
              }
            }
          } else if (dir == 'desc') {
            if (n === 1) {
              // Numeric comparison for import count
              if (Number(x.innerHTML) < Number(y.innerHTML)) {
                shouldSwitch = true;
                break;
              }
            } else {
              // Text comparison for file path
              if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                shouldSwitch = true;
                break;
              }
            }
          }
        }
        
        if (shouldSwitch) {
          rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
          switching = true;
          switchcount++;
        } else {
          if (switchcount == 0 && dir == 'desc') {
            dir = 'asc';
            switching = true;
          }
        }
      }
    }
  </script>
</head>
<body>
  <div class="container">
    <a href="index.html" class="back-link">← Back to main page</a>
    <h1>Most Important Files</h1>
    
    <div class="info">
      <p><strong>What makes a file important?</strong> Files that are imported by many other files are central to your codebase. Changes to these files can have widespread impact.</p>
    </div>
    
    <input type="text" id="searchInput" onkeyup="filterTable()" placeholder="Search for files..." class="search">
    
    <table id="filesTable">
      <tr>
        <th onclick="sortTable(0)">File Path</th>
        <th onclick="sortTable(1)">Import Count</th>
        <th>Notes</th>
      </tr>
EOF

# Go through all files and count how many times they're imported
declare -A IMPORT_COUNTS
for file in $ALL_FILES; do
  # Skip node_modules and generate simplified path for matching
  BASE=$(basename "$file" | sed 's/\.[^.]*$//')
  
  # Count imports of this file
  COUNT=$(grep -l "from ['\"].*$BASE['\"]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -r . | grep -v "$file" | wc -l)
  
  # For index files, also count imports of their directory
  if [[ "$BASE" == "index" ]]; then
    DIR=$(dirname "$file")
    DIR_COUNT=$(grep -l "from ['\"].*$DIR['\"]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -r . | grep -v "$file" | wc -l)
    COUNT=$((COUNT + DIR_COUNT))
  fi
  
  # Store the count
  IMPORT_COUNTS["$file"]=$COUNT
done

# Sort files by import count and output the top ones
for file in $(
  for k in "${!IMPORT_COUNTS[@]}"; do
    echo "$k ${IMPORT_COUNTS[$k]}"
  done | sort -rn -k2 | head -30 | cut -d' ' -f1
); do
  COUNT=${IMPORT_COUNTS["$file"]}
  
  # Skip files with no imports
  if [[ $COUNT -eq 0 ]]; then
    continue
  fi
  
  # Determine importance level
  if [[ $COUNT -gt 5 ]]; then
    CSS_CLASS="very-important"
    NOTES="Heavily used across the codebase"
  else
    CSS_CLASS=""
    NOTES="Used by multiple components"
  fi
  
  # Add row to the table
  echo "<tr class=\"$CSS_CLASS\">" >> "$OUTPUT_DIR/important-files.html"
  echo "  <td class=\"file-path\">$file</td>" >> "$OUTPUT_DIR/important-files.html"
  echo "  <td class=\"import-count\">$COUNT</td>" >> "$OUTPUT_DIR/important-files.html"
  echo "  <td>$NOTES</td>" >> "$OUTPUT_DIR/important-files.html"
  echo "</tr>" >> "$OUTPUT_DIR/important-files.html"
done

# Close the HTML file
cat >> "$OUTPUT_DIR/important-files.html" << EOF
    </table>
  </div>
</body>
</html>
EOF

# Create the import relationships report
echo "Generating import relationships report..."
cd "$PROJECT_DIR/frontend/src"

cat > "$OUTPUT_DIR/import-relationships.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Import Relationships</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #333; }
    .file-section { margin-bottom: 30px; }
    .file-heading { background-color: #f5f5f5; padding: 10px; border-radius: 4px; cursor: pointer; }
    .file-heading:hover { background-color: #e9e9e9; }
    .imports-list { margin-left: 20px; margin-top: 10px; }
    .import-item { margin-bottom: 5px; font-family: monospace; }
    .search { width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box; border: 1px solid #ddd; border-radius: 4px; }
    .back-link { margin-bottom: 20px; display: block; }
  </style>
  <script>
    function filterFiles() {
      const input = document.getElementById('searchInput');
      const filter = input.value.toLowerCase();
      const fileSections = document.getElementsByClassName('file-section');
      
      for (let i = 0; i < fileSections.length; i++) {
        const heading = fileSections[i].getElementsByClassName('file-heading')[0];
        if (heading) {
          const txtValue = heading.textContent || heading.innerText;
          if (txtValue.toLowerCase().indexOf(filter) > -1) {
            fileSections[i].style.display = '';
          } else {
            fileSections[i].style.display = 'none';
          }
        }
      }
    }
    
    function toggleImports(element) {
      const importsList = element.nextElementSibling;
      if (importsList.style.display === 'none') {
        importsList.style.display = 'block';
      } else {
        importsList.style.display = 'none';
      }
    }
  </script>
</head>
<body>
  <div class="container">
    <a href="index.html" class="back-link">← Back to main page</a>
    <h1>Import Relationships</h1>
    
    <p>This report shows what each file imports. Click on a file name to see its imports.</p>
    
    <input type="text" id="searchInput" onkeyup="filterFiles()" placeholder="Search for files..." class="search">
EOF

# Find file imports
for file in $ALL_FILES; do
  IMPORTS=$(grep -n "import .*from" "$file" 2>/dev/null || echo "")
  
  if [[ -n "$IMPORTS" ]]; then
    # Start file section
    echo "<div class=\"file-section\">" >> "$OUTPUT_DIR/import-relationships.html"
    echo "  <div class=\"file-heading\" onclick=\"toggleImports(this)\">$file</div>" >> "$OUTPUT_DIR/import-relationships.html"
    echo "  <div class=\"imports-list\" style=\"display:none;\">" >> "$OUTPUT_DIR/import-relationships.html"
    
    # Add each import
    while IFS= read -r line; do
      LINE_NUM=$(echo "$line" | cut -d: -f1)
      IMPORT_TEXT=$(echo "$line" | cut -d: -f2-)
      echo "    <div class=\"import-item\">Line $LINE_NUM: $IMPORT_TEXT</div>" >> "$OUTPUT_DIR/import-relationships.html"
    done <<< "$IMPORTS"
    
    # End file section
    echo "  </div>" >> "$OUTPUT_DIR/import-relationships.html"
    echo "</div>" >> "$OUTPUT_DIR/import-relationships.html"
  fi
done

# Close the HTML file
cat >> "$OUTPUT_DIR/import-relationships.html" << EOF
  </div>
</body>
</html>
EOF

# Create the file structure report
echo "Generating file structure report..."
cd "$PROJECT_DIR"

cat > "$OUTPUT_DIR/file-structure.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>File Directory Structure</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #333; }
    pre { background-color: #f5f5f5; padding: 20px; border-radius: 4px; overflow: auto; font-family: monospace; }
    .file { color: #333; }
    .directory { color: #0066cc; font-weight: bold; }
    .search { width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box; border: 1px solid #ddd; border-radius: 4px; }
    .back-link { margin-bottom: 20px; display: block; }
  </style>
  <script>
    function filterStructure() {
      const input = document.getElementById('searchInput');
      const filter = input.value.toLowerCase();
      const pre = document.getElementById('structure');
      const lines = pre.innerHTML.split('<br>');
      
      let filteredLines = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().indexOf(filter) > -1) {
          filteredLines.push(lines[i]);
        }
      }
      
      if (filter === '') {
        pre.innerHTML = originalStructure;
      } else {
        pre.innerHTML = filteredLines.join('<br>');
      }
    }
    
    let originalStructure = '';
    window.onload = function() {
      originalStructure = document.getElementById('structure').innerHTML;
    };
  </script>
</head>
<body>
  <div class="container">
    <a href="index.html" class="back-link">← Back to main page</a>
    <h1>File Directory Structure</h1>
    
    <p>This is an overview of your project's file structure.</p>
    
    <input type="text" id="searchInput" onkeyup="filterStructure()" placeholder="Filter the structure..." class="search">
    
    <h2>Frontend Structure</h2>
    <pre id="structure">$(find frontend/src -type f | sort | sed -E 's/^frontend\///' | sed -E 's/([^/]+\/)/\1/g' | sed -E 's/([^/]+)$/<span class="file">\1<\/span>/' | sed -E 's/([^/]+)\//<span class="directory">\1\/<\/span>/g')</pre>
    
    <h2>Backend Structure</h2>
    <pre id="backend-structure">$(find backend/src -type f | sort | sed -E 's/^backend\///' | sed -E 's/([^/]+\/)/\1/g' | sed -E 's/([^/]+)$/<span class="file">\1<\/span>/' | sed -E 's/([^/]+)\//<span class="directory">\1\/<\/span>/g')</pre>
  </div>
</body>
</html>
EOF

# Set permissions
chmod -R 755 "$OUTPUT_DIR"

echo "=== Analysis complete ==="
echo "Results available at: http://24.144.115.137/code-report-$TIMESTAMP/"
echo "Open this URL in your browser to view the reports"