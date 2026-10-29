#!/usr/bin/env node
import { assertNodeFloorSamples, isPatchedNode } from './node-floor.mjs';

assertNodeFloorSamples();

if (!isPatchedNode(process.versions.node)) {
  console.error(`Node ${process.version} is not patched for CVE-2026-111497.`);
  console.error('Install Node 22.23.4+, 24.22.1+, or 26.12.1+ (see .nvmrc).');
  process.exit(1);
}
