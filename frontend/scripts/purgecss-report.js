import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import fg from 'fast-glob';
import { PurgeCSS } from 'purgecss';

const cssFiles = await fg('dist/**/*.css');
const contentFiles = await fg(['dist/**/*.js', 'dist/**/*.html']);

console.log(chalk.blue('\n🔍·Purging·unused·CSS...'));

let totalBefore = 0;
let totalAfter = 0;

for (const cssFile of cssFiles) {
  const original = await readFile(cssFile, 'utf-8');
  const sizeBefore = Buffer.byteLength(original);

  const purgeResult = await new PurgeCSS().purge({
    content: contentFiles,
    css: [{ raw: original }],
  });

  const purged = purgeResult[0].css;
  const sizeAfter = Buffer.byteLength(purged);

  await writeFile(cssFile, purged, 'utf-8');

  totalBefore += sizeBefore;
  totalAfter += sizeAfter;

  const saved = ((sizeBefore - sizeAfter) / sizeBefore) * 100;

  console.log(
    `${chalk.green('✓')} ${path.basename(cssFile)} — ${(
      sizeBefore / 1024
    ).toFixed(
      1,
    )}KB → ${(sizeAfter / 1024).toFixed(1)}KB (${saved.toFixed(1)}% saved)`,
  );
}

console.log(
  `\n💾 Total CSS reduced: ${chalk.bold(
    (totalBefore / 1024).toFixed(1),
  )}KB → ${chalk.bold((totalAfter / 1024).toFixed(1))}KB (${chalk.green.bold(
    `${((1 - totalAfter / totalBefore) * 100).toFixed(1)} % saved`,
  )})\n`,
);
