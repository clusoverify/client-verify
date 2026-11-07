/**
 * Shared Soft Delete Module.
 *
 * Provides helpers for soft-deleting documents and filtering out soft-deleted records.
 */

// MongoDB/D1 Database interface
type Db = any;
type Filter<T = any> = any;

// ─── Soft Delete Fields ────────────────────────────────────────

export interface SoftDeleteFields {
  isDeleted: boolean;
  deletedAt: Date;
  deletedBy: string;
  deletionReason: string;
}

// ─── Filters ───────────────────────────────────────────────────

/**
 * Returns a MongoDB filter that excludes soft-deleted documents.
 * Merge this into your find/findOne queries.
 *
 * Usage:
 *   db.collection("orgs").find({ ...yourFilter, ...notDeleted() })
 */
export function notDeleted(): Filter<any> {
  return { isDeleted: { $ne: true } };
}

// ─── Soft Delete Operation ─────────────────────────────────────

/**
 * Soft-delete a single document by setting isDeleted fields.
 *
 * @returns The number of documents matched (0 or 1)
 */
export async function softDeleteOne(
  db: Db,
  collectionName: string,
  filter: Filter<any>,
  actorId: string,
  reason: string
): Promise<number> {
  const result = await db.collection(collectionName).updateOne(
    { ...filter, ...notDeleted() },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: actorId,
        deletionReason: reason,
      },
    }
  );
  return result.matchedCount;
}

/**
 * Soft-delete multiple documents matching a filter.
 *
 * @returns The number of documents modified
 */
export async function softDeleteMany(
  db: Db,
  collectionName: string,
  filter: Filter<any>,
  actorId: string,
  reason: string
): Promise<number> {
  const result = await db.collection(collectionName).updateMany(
    { ...filter, ...notDeleted() },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: actorId,
        deletionReason: reason,
      },
    }
  );
  return result.modifiedCount;
}

/**
 * Permanently purge soft-deleted documents. Use with extreme caution.
 * This should only be called from a highly restricted admin endpoint.
 *
 * @returns The number of documents permanently deleted
 */
export async function purgeDeleted(
  db: Db,
  collectionName: string,
  filter?: Filter<any>
): Promise<number> {
  const deleteFilter: Filter<any> = {
    isDeleted: true,
    ...(filter || {}),
  };
  const result = await db.collection(collectionName).deleteMany(deleteFilter);
  return result.deletedCount;
}
