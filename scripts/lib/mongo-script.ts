/**
 * Shared Mongo connection for maintenance scripts (backend/.env).
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { MongoClient, type Db } from "mongodb";

loadEnv({ path: path.resolve(process.cwd(), "backend", ".env") });

export function getScriptMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error("Missing MONGODB_URI in backend/.env");
  return uri;
}

export function getScriptMongoDbName(uri: string): string {
  if (process.env.MONGODB_DB?.trim()) return process.env.MONGODB_DB.trim();
  try {
    const u = new URL(uri);
    const p = u.pathname?.replace(/^\//, "").trim();
    return p ? decodeURIComponent(p) : "ksoshtc";
  } catch {
    return "ksoshtc";
  }
}

export async function scriptMongoConnect(): Promise<{ client: MongoClient; db: Db }> {
  const uri = getScriptMongoUri();
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(getScriptMongoDbName(uri));
  return { client, db };
}
