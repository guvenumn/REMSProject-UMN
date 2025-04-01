#!/bin/bash

# Script to zip project files, excluding node_modules, .git, .next, dist, build, coverage, and any .zip files

# Directories (or patterns) to exclude
EXCLUDE_DIRS="node_modules|.git|.next|dist|build|coverage"

# Output zip filename (with timestamp)
ZIP_FILENAME="project-files-$(date +%Y%m%d%H%M%S).zip"

# Function to find all files to include.
# This command finds all files, excludes any with a ".zip" extension,
# and then excludes files in directories matching the patterns above.
find_files() {
  find . -type f -not -iname "*.zip" | grep -v -E "($EXCLUDE_DIRS)" | sort
}

# Function to create the zip file
create_zip() {
  local files=$(find_files)
  local temp_file
  temp_file=$(mktemp)
  
  # Write list of files to temp file
  echo "$files" > "$temp_file"
  
  # Create the zip file using the file list
  zip -@ "$ZIP_FILENAME" < "$temp_file"
  
  # Clean up the temporary file
  rm "$temp_file"
  
  echo "Created zip file: $ZIP_FILENAME"
  echo "Contains $(echo "$files" | wc -l) files"
}

# Main function
main() {
  echo "Creating zip file of project files (excluding $EXCLUDE_DIRS and *.zip)..."
  create_zip
}

# Run the script
main
