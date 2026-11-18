const DATABASE_NAME_PATTERN = /^esekone(?:_[a-z0-9]+)*$/i;

export type DatabaseTarget = {
  hostname: string;
  databaseName: string;
};

/** Verify both host and database name; never accept a generic connection URL. */
export function parseEsekoneDatabaseTarget(
  connectionString: string,
  expectedHost: string,
  expectedDatabase: string,
  environment: "development" | "test" | "production",
): DatabaseTarget {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error("Database connection URL is invalid");
  }

  const hostname = parsed.hostname.toLowerCase();
  const expectedHostname = expectedHost.trim().toLowerCase();
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));

  if (!expectedHostname || hostname !== expectedHostname) {
    throw new Error("Database host does not match ESEKONE_DATABASE_HOST");
  }
  if (!DATABASE_NAME_PATTERN.test(expectedDatabase) || databaseName !== expectedDatabase) {
    throw new Error("Database name does not match the configured ESEKONE database");
  }
  if (environment === "production" &&
      (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".example"))) {
    throw new Error("Production ESEKONE must use its dedicated managed database host");
  }

  return { hostname, databaseName };
}
