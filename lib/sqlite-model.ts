import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

type AnyRecord = Record<string, any>;
type Projection = string | Record<string, 0 | 1 | boolean> | undefined;

interface ModelOptions<T extends AnyRecord> {
  defaults?: () => Partial<T>;
}

interface QueryExecutionContext {
  sortBy?: Record<string, 1 | -1>;
  limitValue?: number;
  skipValue?: number;
  projection?: Projection;
  leanMode?: boolean;
}

const TABLE_NAME = 'sqlite_documents';

let sqliteDb: DatabaseSync | null = null;
let sqlitePath = '';

function deepClone<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value: unknown): value is AnyRecord {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  if (value instanceof Date) return false;
  if (value instanceof RegExp) return false;
  return true;
}

function mergeRecords(base: AnyRecord, patch: AnyRecord): AnyRecord {
  const output: AnyRecord = deepClone(base) || {};
  for (const [key, value] of Object.entries(patch || {})) {
    if (isPlainObject(value) && isPlainObject(output[key])) {
      output[key] = mergeRecords(output[key], value);
      continue;
    }
    output[key] = deepClone(value);
  }
  return output;
}

function getDatabaseFilePath() {
  const configured = process.env.SQLITE_PATH?.trim();
  if (configured) return path.resolve(configured);
  return path.resolve(process.cwd(), 'data', 'waibi.sqlite');
}

function ensureDatabase() {
  if (sqliteDb) return sqliteDb;

  sqlitePath = getDatabaseFilePath();
  const dir = path.dirname(sqlitePath);
  fs.mkdirSync(dir, { recursive: true });

  sqliteDb = new DatabaseSync(sqlitePath);
  sqliteDb.exec('PRAGMA journal_mode = WAL;');
  sqliteDb.exec('PRAGMA synchronous = NORMAL;');
  sqliteDb.exec('PRAGMA foreign_keys = ON;');

  sqliteDb.prepare(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      collection TEXT NOT NULL,
      id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (collection, id)
    )
  `).run();

  sqliteDb.prepare(`CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_collection ON ${TABLE_NAME} (collection)`).run();
  sqliteDb.prepare(`CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_updated_at ON ${TABLE_NAME} (collection, updated_at DESC)`).run();

  return sqliteDb;
}

export function initializeSqlite() {
  return ensureDatabase();
}

export function closeSqlite() {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
}

export function getSqliteInfo() {
  return {
    connected: Boolean(sqliteDb),
    file: sqlitePath || getDatabaseFilePath(),
    engine: 'sqlite',
  };
}

function getByPath(source: AnyRecord, rawPath: string): any {
  const pathParts = rawPath.split('.');
  let current: any = source;
  for (const part of pathParts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

function setByPath(target: AnyRecord, rawPath: string, value: any) {
  const pathParts = rawPath.split('.');
  let cursor: AnyRecord = target;
  for (let i = 0; i < pathParts.length - 1; i += 1) {
    const part = pathParts[i];
    if (!isPlainObject(cursor[part])) {
      cursor[part] = {};
    }
    cursor = cursor[part];
  }
  cursor[pathParts[pathParts.length - 1]] = deepClone(value);
}

function deleteByPath(target: AnyRecord, rawPath: string) {
  const pathParts = rawPath.split('.');
  let cursor: AnyRecord = target;
  for (let i = 0; i < pathParts.length - 1; i += 1) {
    const part = pathParts[i];
    if (!isPlainObject(cursor[part])) return;
    cursor = cursor[part];
  }
  delete cursor[pathParts[pathParts.length - 1]];
}

function comparePrimitive(a: any, b: any) {
  if (a === b) return 0;
  if (a === undefined || a === null) return 1;
  if (b === undefined || b === null) return -1;

  const aValue = a instanceof Date ? a.toISOString() : a;
  const bValue = b instanceof Date ? b.toISOString() : b;

  if (typeof aValue === 'number' && typeof bValue === 'number') return aValue - bValue;
  if (typeof aValue === 'boolean' && typeof bValue === 'boolean') return Number(aValue) - Number(bValue);
  return String(aValue).localeCompare(String(bValue));
}

function valueEquals(left: any, right: any): boolean {
  const l = left instanceof Date ? left.toISOString() : left;
  const r = right instanceof Date ? right.toISOString() : right;

  if (Array.isArray(l) && Array.isArray(r)) {
    return JSON.stringify(l) === JSON.stringify(r);
  }

  if (isPlainObject(l) && isPlainObject(r)) {
    return JSON.stringify(l) === JSON.stringify(r);
  }

  return l === r;
}

function testRegex(value: any, regex: RegExp): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => testRegex(item, regex));
  }
  if (value == null) return false;
  return regex.test(String(value));
}

function matchComparable(fieldValue: any, queryValue: any, operator: '$gt' | '$gte' | '$lt' | '$lte') {
  const left = fieldValue instanceof Date ? fieldValue.getTime() : fieldValue;
  const right = queryValue instanceof Date ? queryValue.getTime() : queryValue;

  if (operator === '$gt') return left > right;
  if (operator === '$gte') return left >= right;
  if (operator === '$lt') return left < right;
  return left <= right;
}

function matchIn(fieldValue: any, candidates: any[]) {
  if (Array.isArray(fieldValue)) {
    return fieldValue.some((item) => candidates.some((candidate) => matchCondition(item, candidate)));
  }
  return candidates.some((candidate) => matchCondition(fieldValue, candidate));
}

function matchCondition(fieldValue: any, condition: any): boolean {
  if (condition === null) {
    return fieldValue === null || fieldValue === undefined;
  }

  if (condition instanceof RegExp) {
    return testRegex(fieldValue, condition);
  }

  if (isPlainObject(condition)) {
    const opKeys = Object.keys(condition).filter((key) => key.startsWith('$'));
    if (opKeys.length > 0) {
      return opKeys.every((operator) => {
        const operand = (condition as AnyRecord)[operator];

        if (operator === '$options') {
          return true;
        }

        if (operator === '$in') {
          if (!Array.isArray(operand)) return false;
          return matchIn(fieldValue, operand);
        }

        if (operator === '$regex') {
          const pattern = operand instanceof RegExp ? operand.source : String(operand);
          const flags = typeof (condition as AnyRecord).$options === 'string' ? (condition as AnyRecord).$options : '';
          const regex = operand instanceof RegExp ? operand : new RegExp(pattern, flags);
          return testRegex(fieldValue, regex);
        }

        if (operator === '$ne') {
          return !valueEquals(fieldValue, operand);
        }

        if (operator === '$gt' || operator === '$gte' || operator === '$lt' || operator === '$lte') {
          return matchComparable(fieldValue, operand, operator);
        }

        return valueEquals(fieldValue, operand);
      });
    }
  }

  if (Array.isArray(fieldValue) && !Array.isArray(condition)) {
    return fieldValue.some((item) => valueEquals(item, condition));
  }

  return valueEquals(fieldValue, condition);
}

function matchesFilter(document: AnyRecord, filter: AnyRecord): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;

  return Object.entries(filter).every(([key, value]) => {
    if (key === '$or') {
      if (!Array.isArray(value)) return false;
      return value.some((subFilter) => matchesFilter(document, subFilter));
    }

    if (key === '$and') {
      if (!Array.isArray(value)) return false;
      return value.every((subFilter) => matchesFilter(document, subFilter));
    }

    const fieldValue = getByPath(document, key);
    return matchCondition(fieldValue, value);
  });
}

function parseProjection(projection: Projection): { type: 'include' | 'exclude'; fields: string[] } | null {
  if (!projection) return null;

  if (typeof projection === 'string') {
    const fields = projection.split(/\s+/).filter(Boolean);
    if (fields.length === 0) return null;
    const hasExclude = fields.some((field) => field.startsWith('-'));
    if (hasExclude) {
      return {
        type: 'exclude',
        fields: fields.map((field) => field.replace(/^-/, '')).filter(Boolean),
      };
    }
    return { type: 'include', fields };
  }

  const entries = Object.entries(projection);
  if (entries.length === 0) return null;

  const includeFields = entries.filter(([, mode]) => mode === 1 || mode === true).map(([field]) => field);
  if (includeFields.length > 0) {
    return { type: 'include', fields: includeFields };
  }

  const excludeFields = entries.filter(([, mode]) => mode === 0 || mode === false).map(([field]) => field);
  if (excludeFields.length > 0) {
    return { type: 'exclude', fields: excludeFields };
  }

  return null;
}

function applyProjection(document: AnyRecord, projection: Projection): AnyRecord {
  const parsed = parseProjection(projection);
  if (!parsed) return deepClone(document);

  if (parsed.type === 'include') {
    const result: AnyRecord = {};
    for (const field of parsed.fields) {
      const value = getByPath(document, field);
      if (value !== undefined) {
        setByPath(result, field, value);
      }
    }
    if (!parsed.fields.includes('_id') && document._id !== undefined) {
      result._id = document._id;
    }
    return result;
  }

  const output = deepClone(document);
  for (const field of parsed.fields) {
    deleteByPath(output, field);
  }
  return output;
}

function toPlainObject(value: any): AnyRecord {
  if (!value || typeof value !== 'object') return {};
  const output: AnyRecord = {};
  for (const key of Object.keys(value)) {
    const current = (value as AnyRecord)[key];
    if (typeof current === 'function') continue;
    if (key.startsWith('__')) continue;
    output[key] = deepClone(current);
  }
  return output;
}

function normalizeTimestamps(document: AnyRecord, existing?: AnyRecord) {
  const now = new Date().toISOString();
  const createdAt = document.createdAt
    ? new Date(document.createdAt).toISOString()
    : existing?.createdAt || now;

  return {
    ...document,
    _id: typeof document._id === 'string' && document._id ? document._id : crypto.randomUUID(),
    createdAt,
    updatedAt: now,
  };
}

function readCollection(collection: string): AnyRecord[] {
  const db = ensureDatabase();
  const rows = db
    .prepare(`SELECT id, data, created_at AS createdAt, updated_at AS updatedAt FROM ${TABLE_NAME} WHERE collection = ?`)
    .all(collection) as Array<{ id: string; data: string; createdAt: string; updatedAt: string }>;

  return rows
    .map((row) => {
      try {
        const parsed = JSON.parse(row.data) as AnyRecord;
        return {
          ...parsed,
          _id: parsed._id || row.id,
          createdAt: parsed.createdAt || row.createdAt,
          updatedAt: parsed.updatedAt || row.updatedAt,
        };
      } catch {
        return {
          _id: row.id,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      }
    })
    .filter(Boolean);
}

function readById(collection: string, id: string): AnyRecord | null {
  const db = ensureDatabase();
  const row = db
    .prepare(`SELECT id, data, created_at AS createdAt, updated_at AS updatedAt FROM ${TABLE_NAME} WHERE collection = ? AND id = ? LIMIT 1`)
    .get(collection, id) as { id: string; data: string; createdAt: string; updatedAt: string } | undefined;

  if (!row) return null;
  try {
    const parsed = JSON.parse(row.data) as AnyRecord;
    return {
      ...parsed,
      _id: parsed._id || row.id,
      createdAt: parsed.createdAt || row.createdAt,
      updatedAt: parsed.updatedAt || row.updatedAt,
    };
  } catch {
    return {
      _id: row.id,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

function writeDocument(collection: string, rawDocument: AnyRecord) {
  const db = ensureDatabase();
  const plain = toPlainObject(rawDocument);
  const existing = plain._id ? readById(collection, String(plain._id)) : null;
  const normalized = normalizeTimestamps(plain, existing || undefined);

  db.prepare(`
    INSERT INTO ${TABLE_NAME} (collection, id, data, created_at, updated_at)
    VALUES (@collection, @id, @data, @createdAt, @updatedAt)
    ON CONFLICT(collection, id)
    DO UPDATE SET
      data = excluded.data,
      updated_at = excluded.updated_at
  `).run({
    collection,
    id: normalized._id,
    data: JSON.stringify(normalized),
    createdAt: normalized.createdAt,
    updatedAt: normalized.updatedAt,
  });

  return normalized;
}

function deleteDocument(collection: string, id: string) {
  const db = ensureDatabase();
  db.prepare(`DELETE FROM ${TABLE_NAME} WHERE collection = ? AND id = ?`).run(collection, id);
}

function sortDocuments(documents: AnyRecord[], sortBy?: Record<string, 1 | -1>) {
  if (!sortBy || Object.keys(sortBy).length === 0) return [...documents];

  const sortEntries = Object.entries(sortBy);
  const output = [...documents];
  output.sort((left, right) => {
    for (const [field, direction] of sortEntries) {
      const compare = comparePrimitive(getByPath(left, field), getByPath(right, field));
      if (compare !== 0) {
        return direction >= 0 ? compare : -compare;
      }
    }
    return 0;
  });

  return output;
}

function applyPagination(documents: AnyRecord[], skipValue?: number, limitValue?: number) {
  let output = [...documents];

  if (skipValue && skipValue > 0) {
    output = output.slice(skipValue);
  }

  if (typeof limitValue === 'number' && limitValue >= 0) {
    output = output.slice(0, limitValue);
  }

  return output;
}

function hasOperatorUpdate(update: AnyRecord) {
  return Object.keys(update).some((key) => key.startsWith('$'));
}

function applyUpdate(document: AnyRecord, update: AnyRecord) {
  const output = deepClone(document) || {};

  if (!isPlainObject(update)) return output;

  if (!hasOperatorUpdate(update)) {
    return mergeRecords(output, update);
  }

  for (const [operator, value] of Object.entries(update)) {
    if (!isPlainObject(value) && operator !== '$push') continue;

    if (operator === '$set' && isPlainObject(value)) {
      for (const [field, fieldValue] of Object.entries(value)) {
        setByPath(output, field, fieldValue);
      }
      continue;
    }

    if (operator === '$inc' && isPlainObject(value)) {
      for (const [field, amount] of Object.entries(value)) {
        const current = getByPath(output, field);
        const nextValue = Number(current || 0) + Number(amount || 0);
        setByPath(output, field, nextValue);
      }
      continue;
    }

    if (operator === '$push' && isPlainObject(value)) {
      for (const [field, item] of Object.entries(value)) {
        const current = getByPath(output, field);
        const list = Array.isArray(current) ? [...current] : [];
        list.push(deepClone(item));
        setByPath(output, field, list);
      }
      continue;
    }
  }

  return output;
}

function buildInsertFromFilter(filter: AnyRecord): AnyRecord {
  const output: AnyRecord = {};
  for (const [key, value] of Object.entries(filter || {})) {
    if (key.startsWith('$')) continue;
    if (isPlainObject(value)) continue;
    setByPath(output, key, value);
  }
  return output;
}

function hydrateModel(ModelClass: any, rawDocument: AnyRecord) {
  const instance = Object.create(ModelClass.prototype);
  Object.assign(instance, deepClone(rawDocument));
  return instance;
}

class SqliteQuery<T> implements PromiseLike<T> {
  private sortBy?: Record<string, 1 | -1>;
  private limitValue?: number;
  private skipValue?: number;
  private projection?: Projection;
  private leanMode = false;
  private executionPromise: Promise<T> | null = null;

  constructor(private readonly executor: (ctx: QueryExecutionContext) => Promise<T>, initialProjection?: Projection) {
    this.projection = initialProjection;
  }

  sort(value: Record<string, 1 | -1>) {
    this.sortBy = value;
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  skip(value: number) {
    this.skipValue = value;
    return this;
  }

  select(value: Projection) {
    this.projection = value;
    return this;
  }

  lean() {
    this.leanMode = true;
    return this;
  }

  exec() {
    if (!this.executionPromise) {
      this.executionPromise = this.executor({
        sortBy: this.sortBy,
        limitValue: this.limitValue,
        skipValue: this.skipValue,
        projection: this.projection,
        leanMode: this.leanMode,
      });
    }
    return this.executionPromise;
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled || undefined, onrejected || undefined);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
  ): Promise<T | TResult> {
    return this.exec().catch(onrejected || undefined);
  }

  finally(onfinally?: (() => void) | null): Promise<T> {
    return this.exec().finally(onfinally || undefined);
  }
}

export function createSqliteModel<T extends AnyRecord>(collection: string, options: ModelOptions<T> = {}) {
  const defaultsFactory = options.defaults || (() => ({}));

  class SqliteModel {
    [key: string]: any;

    constructor(document: Partial<T> = {}) {
      const defaults = deepClone(defaultsFactory() || {});
      const merged = mergeRecords(defaults as AnyRecord, deepClone(document) || {});
      Object.assign(this, merged);
    }

    toObject() {
      return toPlainObject(this);
    }

    async save() {
      const saved = writeDocument(collection, this.toObject());
      Object.assign(this, saved);
      return this;
    }

    static create(document: Partial<T>) {
      const defaults = deepClone(defaultsFactory() || {});
      const merged = mergeRecords(defaults as AnyRecord, deepClone(document) || {});
      const saved = writeDocument(collection, merged);
      return Promise.resolve(hydrateModel(this, saved));
    }

    static find(filter: AnyRecord = {}) {
      const ModelClass = this;
      return new SqliteQuery<any[]>(async (ctx) => {
        const matched = readCollection(collection).filter((item) => matchesFilter(item, filter));
        const sorted = sortDocuments(matched, ctx.sortBy);
        const paged = applyPagination(sorted, ctx.skipValue, ctx.limitValue);
        const projected = paged.map((item) => applyProjection(item, ctx.projection));

        if (ctx.leanMode) {
          return projected.map((item) => deepClone(item));
        }

        return projected.map((item) => hydrateModel(ModelClass, item));
      });
    }

    static findOne(filter: AnyRecord = {}, projection?: Projection) {
      const ModelClass = this;
      return new SqliteQuery<any | null>(async (ctx) => {
        const docs = readCollection(collection).filter((item) => matchesFilter(item, filter));
        const sorted = sortDocuments(docs, ctx.sortBy);
        const first = sorted[0] || null;
        if (!first) return null;

        const projected = applyProjection(first, ctx.projection ?? projection);
        if (ctx.leanMode) return deepClone(projected);
        return hydrateModel(ModelClass, projected);
      }, projection);
    }

    static findOneAndUpdate(filter: AnyRecord, update: AnyRecord, optionsArg: AnyRecord = {}) {
      const ModelClass = this;
      return new SqliteQuery<any | null>(async (ctx) => {
        const documents = readCollection(collection).filter((item) => matchesFilter(item, filter));
        const current = documents[0] || null;

        if (!current) {
          if (!optionsArg.upsert) return null;

          const seed = mergeRecords(buildInsertFromFilter(filter), hasOperatorUpdate(update) ? {} : update);
          const nextDoc = applyUpdate(seed, update);
          const inserted = writeDocument(collection, nextDoc);
          const projected = applyProjection(inserted, ctx.projection);
          if (ctx.leanMode) return deepClone(projected);
          return hydrateModel(ModelClass, projected);
        }

        const original = deepClone(current);
        const updatedDoc = applyUpdate(current, update);
        const saved = writeDocument(collection, updatedDoc);

        const selected = optionsArg.new ? saved : original;
        const projected = applyProjection(selected, ctx.projection);

        if (ctx.leanMode) return deepClone(projected);
        return hydrateModel(ModelClass, projected);
      });
    }

    static findOneAndDelete(filter: AnyRecord) {
      const ModelClass = this;
      return new SqliteQuery<any | null>(async (ctx) => {
        const docs = readCollection(collection).filter((item) => matchesFilter(item, filter));
        const current = docs[0] || null;
        if (!current) return null;

        deleteDocument(collection, String(current._id));
        const projected = applyProjection(current, ctx.projection);

        if (ctx.leanMode) return deepClone(projected);
        return hydrateModel(ModelClass, projected);
      });
    }

    static async updateMany(filter: AnyRecord, update: AnyRecord) {
      const docs = readCollection(collection).filter((item) => matchesFilter(item, filter));
      let modifiedCount = 0;

      for (const doc of docs) {
        const nextDoc = applyUpdate(doc, update);
        writeDocument(collection, nextDoc);
        modifiedCount += 1;
      }

      return {
        acknowledged: true,
        matchedCount: docs.length,
        modifiedCount,
      };
    }

    static async countDocuments(filter: AnyRecord = {}) {
      const docs = readCollection(collection).filter((item) => matchesFilter(item, filter));
      return docs.length;
    }
  }

  return SqliteModel as any;
}
