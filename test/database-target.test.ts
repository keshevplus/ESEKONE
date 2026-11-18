import assert from "node:assert/strict";
import test from "node:test";
import { parseEsekoneDatabaseTarget } from "../src/db/database-target.js";

const host = "ep-new-esekone.neon.tech";

test("accepts the explicitly configured ESEKONE database", () => {
  assert.deepEqual(
    parseEsekoneDatabaseTarget(`postgres://app:secret@${host}:5432/esekone_prod?sslmode=require`, host, "esekone_prod", "production"),
    { hostname: host, databaseName: "esekone_prod" },
  );
});

test("rejects an existing business database name", () => {
  assert.throws(
    () => parseEsekoneDatabaseTarget(`postgres://app:secret@${host}:5432/clinic`, host, "clinic", "production"),
    /ESEKONE database/,
  );
});

test("rejects a host that is not explicitly allowlisted", () => {
  assert.throws(
    () => parseEsekoneDatabaseTarget("postgres://app:secret@other.neon.tech:5432/esekone", host, "esekone", "production"),
    /DATABASE_HOST/,
  );
});

test("rejects a local database as a production target", () => {
  assert.throws(
    () => parseEsekoneDatabaseTarget("postgres://app:secret@localhost:5432/esekone", "localhost", "esekone", "production"),
    /dedicated managed database/,
  );
});
