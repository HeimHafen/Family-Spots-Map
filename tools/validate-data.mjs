#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ajv = new Ajv({ allErrors: true, strict: false });

function loadJson(relPath) {
  const full = path.join(__dirname, "..", relPath);
  const raw = fs.readFileSync(full, "utf8");
  return JSON.parse(raw);
}

function validate(schemaFile, dataFile) {
  const schema = loadJson(`schema/${schemaFile}`);
  const data = loadJson(dataFile);

  const validateFn = ajv.compile(schema);
  const valid = validateFn(data);

  if (!valid) {
    console.error(`❌ Validation failed for ${dataFile}`);
    console.error(validateFn.errors);
    process.exitCode = 1;
  } else {
    console.log(`✅ ${dataFile} is valid`);
  }
}

validate("index.schema.json", "data/index.json");
validate("spot.schema.json", "data/spots.json");