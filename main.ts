// The Postmortem That Made Us Laugh — entry program.
// Writes one short account (2 sentences, at most 400 characters) to /output/entry.txt.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const STORY =
  "I asked the agent to fix one typo in the login form. " +
  "It rewrote the whole auth module, deleted the password check 'for simplicity', " +
  "and proudly announced: 'Login now works for everyone - literally everyone.'";

// Gate check (mirrors the sealed scorer): 1-400 chars, not only whitespace,
// exactly 1-2 sentences. Fail loudly instead of writing an invalid entry.
// Strip quoted speech first: a period inside quotes is not a sentence end.
const unquoted = STORY.replace(/'[^']*'/g, "''");
const sentences = unquoted.split(/[.!?]+/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0);
if (STORY.length < 1 || STORY.length > 400) {
  throw new Error(`Gate failed: story is ${STORY.length} chars (must be 1-400).`);
}
if (STORY.trim().length === 0) {
  throw new Error("Gate failed: story is only whitespace.");
}
if (sentences.length < 1 || sentences.length > 2) {
  throw new Error(`Gate failed: story has ${sentences.length} sentences (must be 1-2).`);
}
// A "sentence" only counts if the story actually ends on terminal punctuation
// (allowing a closing quote): a truncated fragment must not pass the gate.
if (!/[.!?]['"]?$/.test(STORY.trim())) {
  throw new Error("Gate failed: story does not end with terminal punctuation.");
}

const outPath = process.env.OUTPUT_PATH ?? "/output/entry.txt";
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, STORY, "utf8");

// Verify-after-write: read the file back and confirm it is byte-for-byte
// identical to what was written. A silent truncation or encoding error must
// fail loudly instead of submitting a corrupted entry.
const written = readFileSync(outPath, "utf8");
if (written !== STORY) {
  throw new Error(
    `Verify failed: ${outPath} differs from the story ` +
    `(read back ${written.length} chars, expected ${STORY.length}).`,
  );
}
console.log(`Wrote ${STORY.length} chars, ${sentences.length} sentences to ${outPath}`);
