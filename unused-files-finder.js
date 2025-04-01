// unused-files-finder.js
const fs = require("fs");
const path = require("path");
const glob = require("glob");

/**
 * Enhanced tool to find potentially unused files in a Next.js TypeScript project
 * with better support for full-stack projects and special Next.js patterns
 */

// Extensions to check
const extensions = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".css",
  ".scss",
  ".module.css",
  ".module.scss",
];

// Directories to ignore
const ignoreDirs = [
  "node_modules",
  ".git",
  ".next",
  "out",
  "build",
  "dist",
  "public",
  "coverage",
];

// Files to ignore (always considered "used")
const ignoreFiles = [
  // Config files and entry points
  "next.config.js",
  "next.config.ts",
  "tailwind.config.js",
  "tailwind.config.ts",
  "next-env.d.ts",
  "package.json",
  "tsconfig.json",
  ".eslintrc.js",
  "jest.config.js",
  ".babelrc.js",
  "postcss.config.js",
  "tailwind.config.js",
  "app.ts",
  "app.js",
  "server.ts",
  "server.js",
  "index.ts",
  "index.js",
  // Global definitions
  "global.d.ts",
  // This script
  "unused-files-finder.js",
];

// File patterns to always consider as used
const alwaysUsedPatterns = [
  // Types and definitions
  /\.d\.ts$/,
  // Tests
  /\.test\.(ts|js|tsx|jsx)$/,
  /\.spec\.(ts|js|tsx|jsx)$/,
  // Next.js special files
  /pages\/.*\.(ts|js|tsx|jsx)$/,
  /app\/.*\.(ts|js|tsx|jsx)$/,
  /api\/.*\.(ts|js|tsx|jsx)$/,
  // Backend files that might be dynamically required
  /models\/.*Model\.(ts|js)$/,
  /controllers\/.*Controller\.(ts|js)$/,
  /middleware\/.*Middleware\.(ts|js)$/,
  /services\/.*Service\.(ts|js)$/,
  /routes\/.*\.(ts|js)$/,
  // Scripts that might be invoked directly
  /scripts\/.*\.(ts|js)$/,
  // Configuration files
  /config\/.*\.(ts|js)$/,
  // Hooks that might be dynamically imported
  /hooks\/.*\.(ts|js|tsx|jsx)$/,
];

// Root directory of the project (current directory)
const rootDir = process.cwd();

/**
 * Get all source files in the project with specified extensions
 */
function getAllSourceFiles() {
  const allFiles = [];

  for (const ext of extensions) {
    const files = glob.sync(`**/*${ext}`, {
      cwd: rootDir,
      ignore: ignoreDirs.map((dir) => `**/${dir}/**`),
      absolute: true,
    });
    allFiles.push(...files);
  }

  // Filter out ignored files
  return allFiles.filter((file) => !ignoreFiles.includes(path.basename(file)));
}

/**
 * Check if a file matches any of the always-used patterns
 */
function isAlwaysUsedFile(filePath) {
  return alwaysUsedPatterns.some((pattern) => pattern.test(filePath));
}

/**
 * Check if a file is imported or referenced in any other file
 */
function isFileReferenced(filePath, allFiles) {
  // First check if this is a file we consider always used
  if (isAlwaysUsedFile(filePath)) {
    return true;
  }

  // Get the file basename (without extension) to look for imports
  const fileBasename = path.basename(filePath, path.extname(filePath));

  // Special handling for index files - consider them used if their directory is imported
  const isIndexFile = fileBasename === "index";
  const dirName = isIndexFile ? path.basename(path.dirname(filePath)) : null;

  // Get relative paths for more accurate import detection
  const relativeDir = path.dirname(filePath).replace(rootDir, "");

  // Check each file for references to our target file
  for (const sourceFile of allFiles) {
    if (sourceFile === filePath) continue; // Skip self

    try {
      const content = fs.readFileSync(sourceFile, "utf-8");

      // Check for various import patterns
      const importPatterns = [
        // Direct import with filename
        new RegExp(
          `(import|require|from)\\s+['"].*[/]?${fileBasename}['"]`,
          "g"
        ),
        // Relative import with path parts
        new RegExp(
          `(import|require|from)\\s+['"].*${path.basename(
            path.dirname(filePath)
          )}\/?${fileBasename}['"]`,
          "g"
        ),
        // Absolute imports (from project root)
        new RegExp(
          `(import|require|from)\\s+['"]@\/.*\/?${fileBasename}['"]`,
          "g"
        ),
        // For CSS modules or other direct file references
        new RegExp(`['"].*${path.basename(filePath)}['"]`, "g"),
        // Path-based imports
        new RegExp(
          `(import|require|from)\\s+['"]${relativeDir}\/?${fileBasename}['"]`,
          "g"
        ),
        // Dynamic imports
        new RegExp(`import\\(.*${fileBasename}.*\\)`, "g"),
      ];

      // Check for directory imports if this is an index file
      if (isIndexFile && dirName) {
        importPatterns.push(
          new RegExp(`(import|require|from)\\s+['"].*${dirName}['"]`, "g")
        );
        importPatterns.push(
          new RegExp(`(import|require|from)\\s+['"].*${dirName}\/['"]`, "g")
        );
      }

      // If any pattern matches, the file is referenced
      if (importPatterns.some((pattern) => pattern.test(content))) {
        return true;
      }

      // Check for React component usage (for JSX files)
      if (
        (filePath.endsWith(".tsx") || filePath.endsWith(".jsx")) &&
        fileBasename.match(/^[A-Z][a-zA-Z0-9]*$/)
      ) {
        // The file follows React component naming convention (PascalCase)
        const componentName = fileBasename;
        const componentPattern = new RegExp(`<${componentName}[\\s/>]`, "g");

        if (componentPattern.test(content)) {
          return true;
        }
      }
    } catch (error) {
      console.warn(`Error reading file ${sourceFile}: ${error.message}`);
    }
  }

  return false;
}

/**
 * Main function to find unused files
 */
function findUnusedFiles() {
  console.log("Scanning for potentially unused files...");

  const allFiles = getAllSourceFiles();
  console.log(`Found ${allFiles.length} source files to analyze.`);

  const unusedFiles = [];
  let processedCount = 0;

  // Check each file if it's referenced anywhere
  for (const file of allFiles) {
    if (!isFileReferenced(file, allFiles)) {
      unusedFiles.push(file);
    }

    // Show progress
    processedCount++;
    if (processedCount % 20 === 0 || processedCount === allFiles.length) {
      const percentComplete = Math.round(
        (processedCount / allFiles.length) * 100
      );
      process.stdout.write(`\rAnalyzing files: ${percentComplete}% complete`);
    }
  }

  console.log("\n\nPotentially unused files:");
  if (unusedFiles.length === 0) {
    console.log("No unused files found!");
  } else {
    // Group by directory for better organization
    const groupedUnused = {};

    unusedFiles.forEach((file) => {
      const relativePath = path.relative(rootDir, file);
      const dir = path.dirname(relativePath);

      if (!groupedUnused[dir]) {
        groupedUnused[dir] = [];
      }

      groupedUnused[dir].push(path.basename(file));
    });

    // Display grouped results
    Object.keys(groupedUnused)
      .sort()
      .forEach((dir) => {
        console.log(`\n${dir}/`);
        groupedUnused[dir].forEach((file) => {
          console.log(`  - ${file}`);
        });
      });

    console.log(`\nFound ${unusedFiles.length} potentially unused files.`);
    console.log(
      "\nNote: This is a heuristic analysis. Please verify before deleting any files."
    );
    console.log(
      "Some files might be dynamically imported or used in ways this tool cannot detect."
    );
  }
}

// Run the analysis
findUnusedFiles();
