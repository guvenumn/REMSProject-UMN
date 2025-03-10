#!/bin/bash

# Script to zip project files, excluding node_modules and other specified directories

# Directories to exclude
EXCLUDE_DIRS="node_modules|.git|.next|dist|build|coverage"

# Output zip filename
ZIP_FILENAME="project-files-$(date +%Y%m%d%H%M%S).zip"

# Find all files to include, excluding the specified directories
find_files() {
  find . -type f | grep -v -E "($EXCLUDE_DIRS)" | sort
}

# Create the zip file
create_zip() {
  local files=$(find_files)
  local temp_file=$(mktemp)
  
  # Write list of files to temp file
  echo "$files" > "$temp_file"
  
  # Create zip file using the file list
  zip -@ "$ZIP_FILENAME" < "$temp_file"
  
  # Clean up temp file
  rm "$temp_file"
  
  echo "Created zip file: $ZIP_FILENAME"
  echo "Contains $(echo "$files" | wc -l) files"
}

# Main function
main() {
  echo "Creating zip file of project files (excluding $EXCLUDE_DIRS)..."
  create_zip
}

# Run the script
main