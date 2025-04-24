import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths configuration
const inputDir = process.argv[2] || '.'; // Input directory containing CSV files
const outputDir = process.argv[3] || path.join(__dirname, '../src/data/h2s'); // Output directory for JS files

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Process each CSV file
['Block1.csv', 'Block2.csv', 'Block3.csv'].forEach((csvFileName) => {
  try {
    const inputPath = path.join(inputDir, csvFileName);

    // Check if file exists
    if (!fs.existsSync(inputPath)) {
      console.log(
        `Warning: File ${inputPath} does not exist. Creating placeholder data.`,
      );
      createPlaceholderData(csvFileName, outputDir);
      return;
    }

    // Read and parse CSV
    const csvContent = fs.readFileSync(inputPath, 'utf8');
    const lines = csvContent.trim().split('\n');

    // If file is empty or only has header, create placeholder
    if (lines.length <= 1) {
      console.log(
        `Warning: File ${inputPath} is empty or only has headers. Creating placeholder data.`,
      );
      createPlaceholderData(csvFileName, outputDir);
      return;
    }

    // Get headers
    const headers = lines[0].split(',');

    // Extract data
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = {};

      // Map each column value to its header
      headers.forEach((header, index) => {
        if (values[index] !== undefined) {
          row[header] = parseFloat(values[index]);
        }
      });

      data.push(row);
    }

    // Create unique columns for interpolation
    const uniqueT = [...new Set(data.map((row) => row.T))]
      .filter(Boolean)
      .sort((a, b) => a - b);
    const uniqueP = [...new Set(data.map((row) => row.P))]
      .filter(Boolean)
      .sort((a, b) => a - b);
    const uniqueNaCl = [...new Set(data.map((row) => row.NaCl))]
      .filter(Boolean)
      .sort((a, b) => a - b);

    // Create data arrays for each value column depending on block type
    let valueColumns = {};

    if (csvFileName === 'Block3.csv') {
      // For Block3, we need xH2S or xH2SplusCO2
      valueColumns = {
        xH2SplusCO2: data.map((row) => row.xH2S || 0),
      };
    } else {
      // For Block1 and Block2, we need xH2S, r (density), and H2S
      valueColumns = {
        xH2S: data.map((row) => row.xH2S || 0),
        r: data.map((row) => row.r || 0),
        H2S: data.map((row) => row.H2S || 0),
        // Optional columns if they exist
        ...(data[0].H2O !== undefined
          ? { H2O: data.map((row) => row.H2O || 0) }
          : {}),
        ...(data[0].yH2O !== undefined
          ? { yH2O: data.map((row) => row.yH2O || 0) }
          : {}),
      };
    }

    // Create JS module content
    const blockName = csvFileName.replace('.csv', '').toLowerCase();
    let jsContent = `// Converted from ${csvFileName}\nexport const ${blockName}Data = {\n`;

    // Add array properties
    jsContent += `  T: ${JSON.stringify(uniqueT)},\n`;
    jsContent += `  P: ${JSON.stringify(uniqueP)},\n`;
    jsContent += `  NaCl: ${JSON.stringify(uniqueNaCl)},\n`;

    // Add value columns
    Object.entries(valueColumns).forEach(([key, values], index, array) => {
      jsContent += `  ${key}: ${JSON.stringify(values)}${index < array.length - 1 ? ',' : ''}\n`;
    });

    jsContent += '};\n';

    // Write JS file
    const outputPath = path.join(outputDir, `${blockName}.js`);
    fs.writeFileSync(outputPath, jsContent);
    console.log(`Successfully converted ${csvFileName} to ${outputPath}`);
  } catch (error) {
    console.error(`Error processing ${csvFileName}: ${error.message}`);
  }
});

// Create placeholder data for missing or empty files
function createPlaceholderData(csvFileName, outputDir) {
  const blockName = csvFileName.replace('.csv', '').toLowerCase();
  const isBlock3 = csvFileName === 'Block3.csv';

  // Temperature, pressure and NaCl values
  const T = [298.15, 323.15, 348.15, ...(isBlock3 ? [] : [373.15])];
  const P = Array.from({ length: 10 }, (_, i) => i * 60 + 10); // 10, 70, 130, 190... up to 550
  const NaCl = Array.from({ length: isBlock3 ? 5 : 7 }, (_, i) => i); // 0,1,2,3,4,(5,6)

  // Create placeholder values that increase with P and decrease with T and NaCl
  const createTestValues = (length, baseValue) => {
    return Array.from(
      { length },
      (_, i) =>
        (baseValue + (i % P.length) * 0.001) *
        (1 - Math.floor(i / P.length) * 0.02),
    );
  };

  let jsContent = `// Placeholder data for ${csvFileName}\nexport const ${blockName}Data = {\n`;
  jsContent += `  T: ${JSON.stringify(T)},\n`;
  jsContent += `  P: ${JSON.stringify(P)},\n`;
  jsContent += `  NaCl: ${JSON.stringify(NaCl)},\n`;

  if (isBlock3) {
    // Block3 has only xH2SplusCO2
    jsContent += `  xH2SplusCO2: ${JSON.stringify(createTestValues(T.length * P.length * NaCl.length, 0.01))}\n`;
  } else {
    // Block1 and Block2 have xH2S, r and H2S
    jsContent += `  xH2S: ${JSON.stringify(createTestValues(T.length * P.length * NaCl.length, 0.01))},\n`;
    jsContent += `  r: ${JSON.stringify(createTestValues(T.length * P.length * NaCl.length, 1000))},\n`;
    jsContent += `  H2S: ${JSON.stringify(createTestValues(T.length * P.length * NaCl.length, 0.5))},\n`;
    jsContent += `  yH2O: ${JSON.stringify(createTestValues(T.length * P.length * NaCl.length, 0.02))},\n`;
    jsContent += `  H2O: ${JSON.stringify(createTestValues(T.length * P.length * NaCl.length, -0.1))}\n`;
  }

  jsContent += '};\n';

  const outputPath = path.join(outputDir, `${blockName}.js`);
  fs.writeFileSync(outputPath, jsContent);
  console.log(`Generated placeholder data for ${csvFileName} at ${outputPath}`);
}

// Create an index.js file to export all data
const indexContent = `// Export all block data
export { block1Data } from './block1';
export { block2Data } from './block2';
export { block3Data } from './block3';
`;

fs.writeFileSync(path.join(outputDir, 'index.js'), indexContent);
console.log(`Created index.js file in ${outputDir}`);
