/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { analyzeMetafile } from 'esbuild';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const metafilePath = resolve('dist/stats.json');
const metafile = readFileSync(metafilePath, 'utf-8');
const text = await analyzeMetafile(metafile, { verbose: false, color: true });
console.log(text);

const { outputs } = JSON.parse(metafile);
const rows = [];

for (const [outPath, outData] of Object.entries(outputs)) {
  if (!outPath.endsWith('.js') || !outData.inputs) continue;
  const name = outPath.split('/').pop();
  const totalKB = (outData.bytes / 1024).toFixed(1);
  const top = Object.entries(outData.inputs)
    .sort(([, a], [, b]) => b.bytesInOutput - a.bytesInOutput)
    .slice(0, 8)
    .map(([p, i]) => `  ${(i.bytesInOutput / 1024).toFixed(1).padStart(7)} KB  ${p.replace(/^.*node_modules\//, 'node_modules/')}`)
    .join('\n');
  rows.push({ bytes: outData.bytes, text: `\n=== ${name}  (${totalKB} KB) ===\n${top}` });
}

rows.toSorted((a, b) => b.bytes - a.bytes).forEach((r) => console.log(r.text));
