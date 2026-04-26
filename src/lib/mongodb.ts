import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

/**
 * Resolves a mongodb+srv:// URI into a standard mongodb:// URI
 * by performing SRV + TXT DNS lookups via Google DNS (8.8.8.8).
 * This bypasses ISP-level SRV record blocking.
 */
async function resolveSRV(uri: string): Promise<string> {
  if (!uri.startsWith('mongodb+srv://')) return uri;

  const { Resolver } = await import('dns/promises');
  const resolver = new Resolver();
  resolver.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

  // Parse the SRV URI
  const withoutScheme = uri.slice('mongodb+srv://'.length);
  const atIdx = withoutScheme.lastIndexOf('@');
  const credentials = withoutScheme.slice(0, atIdx);          // user:pass
  const rest = withoutScheme.slice(atIdx + 1);                // host/db?params
  const slashIdx = rest.indexOf('/');
  const srvHost = slashIdx >= 0 ? rest.slice(0, slashIdx) : rest;
  const dbAndParams = slashIdx >= 0 ? rest.slice(slashIdx) : '/';

  // Resolve SRV records
  const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${srvHost}`);
  const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(',');

  // Resolve TXT options (replicaSet name etc.)
  let txtOptions = '';
  try {
    const txtRecords = await resolver.resolveTxt(srvHost);
    txtOptions = txtRecords.flat().join('&');
  } catch {
    // TXT optional
  }

  // Merge all params, deduplicating keys (later values win)
  const existingSearch = dbAndParams.includes('?') ? dbAndParams.slice(dbAndParams.indexOf('?') + 1) : '';
  const dbPath = dbAndParams.includes('?') ? dbAndParams.slice(0, dbAndParams.indexOf('?')) : dbAndParams;

  const paramMap = new Map<string, string>();
  // Add SSL default first (lowest priority)
  paramMap.set('ssl', 'true');
  paramMap.set('authSource', 'admin');
  // TXT record options override defaults
  if (txtOptions) {
    for (const part of txtOptions.split('&')) {
      const [k, v] = part.split('=');
      if (k) paramMap.set(k, v ?? '');
    }
  }
  // Original URI params have highest priority
  if (existingSearch) {
    for (const part of existingSearch.split('&')) {
      const [k, v] = part.split('=');
      if (k) paramMap.set(k, v ?? '');
    }
  }

  const queryString = Array.from(paramMap.entries()).map(([k, v]) => `${k}=${v}`).join('&');
  return `mongodb://${credentials}@${hosts}${dbPath}?${queryString}`;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const rawURI = process.env.MONGODB_URI!;
    if (!rawURI) throw new Error('MONGODB_URI is not defined');

    cached.promise = resolveSRV(rawURI).then((resolvedURI) =>
      mongoose.connect(resolvedURI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000,
      })
    );
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
