#!/usr/bin/env node
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Accept MONGO_URI from env or command line
const argUri = process.argv[2];
const MONGO_URI = argUri || process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Error: MONGO_URI must be provided as an env var or as the first argument.");
  console.error("Usage: node scripts/normalizeBooks.js <MONGO_URI>");
  process.exit(1);
}

// Import the model dynamically so the script can be run from repo root
const { default: Book } = await import("../Backend/model/book.model.js");

async function normalize() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to MongoDB");

  const cursor = Book.collection.find();
  let fixed = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const keys = Object.keys(doc);
    // Find keys that look like a JSON string (starts with '{' and ends with '}')
    const badKey = keys.find((k) => typeof k === "string" && k.trim().startsWith("{") && k.trim().endsWith("}"));
    if (!badKey) continue;

    try {
      const parsed = JSON.parse(badKey);
      if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
        console.warn(`Skipping doc ${doc._id}: parsed value is not an object`);
        continue;
      }

      // Preserve _id, but replace the document with the parsed object
      const updated = { ...parsed, _id: doc._id };

      // Validate fields present (optional)
      // Replace the entire document with the corrected structure
      await Book.collection.replaceOne({ _id: doc._id }, updated);
      fixed++;
      console.log(`Fixed document ${doc._id}`);
    } catch (err) {
      console.warn(`Failed to parse bad key for doc ${doc._id}: ${err.message}`);
    }
  }

  console.log(`Done. Fixed ${fixed} documents.`);
  await mongoose.disconnect();
  process.exit(0);
}

normalize().catch((err) => {
  console.error(err);
  process.exit(1);
});
