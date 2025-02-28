#!/bin/bash

# Script to list project structure as a tree, excluding node_modules and other installed components

# Directories to exclude
EXCLUDE_DIRS="node_modules|.git|.next|dist|build|coverage"

# Function to print the tree structure
print_tree() {
  local dir=$1
  local prefix=$2
  
  # Get list of files and directories, excluding the specified directories
  local entries=$(find "$dir" -maxdepth 1 -mindepth 1 -name "*" | grep -v -E "$EXCLUDE_DIRS" | sort)
  
  local count=$(echo "$entries" | wc -l)
  local current=0
  
  # Process each entry
  for entry in $entries; do
    ((current++))
    
    # Determine if this is the last entry at this level
    local is_last=0
    if [ $current -eq $count ]; then
      is_last=1
    fi
    
    # Get the entry name without the path
    local name=$(basename "$entry")
    
    # Determine the line prefix
    if [ $is_last -eq 1 ]; then
      echo "${prefix}└── $name"
      new_prefix="${prefix}    "
    else
      echo "${prefix}├── $name"
      new_prefix="${prefix}│   "
    fi
    
    # If it's a directory, recursively print its contents
    if [ -d "$entry" ]; then
      print_tree "$entry" "$new_prefix"
    fi
  done
}

# Main function
main() {
  local target_dirs=${@:-"."}  # Default to current directory if none provided
  
  for dir in $target_dirs; do
    if [ -d "$dir" ]; then
      echo "$dir"
      print_tree "$dir" ""
      echo ""
    else
      echo "Directory not found: $dir"
    fi
  done
}

# Run the script with the provided arguments
main "$@"