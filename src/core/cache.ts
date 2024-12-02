export class Cache<K, V> extends Map<K, V> {
    constructor(entries?: readonly (readonly [K, V])[] | null) {
        super(entries);
    }

    /**
     * Set a value in the cache.
     * @param key The key to set.
     * @param value The value to set.
     * @returns The instance of the cache for chaining.
     */
    set(key: K, value: V): this {
        super.set(key, value);
        return this;
    }

    /**
     * Get a value from the cache.
     * @param key The key to retrieve.
     * @returns The value associated with the key, or undefined if not found.
     */
    get(key: K): V | undefined {
        return super.get(key);
    }

    /**
     * Delete a key from the cache.
     * @param key The key to delete.
     * @returns True if the key was removed, false otherwise.
     */
    delete(key: K): boolean {
        return super.delete(key);
    }

    /**
     * Clear all entries in the cache.
     */
    clear(): void {
        super.clear();
    }

    /**
     * Get all values in the cache.
     * @returns An array of all values in the cache.
     */
    valuesArray(): V[] {
        return Array.from(super.values());
    }

    /**
     * Get all keys in the cache.
     * @returns An array of all keys in the cache.
     */
    keysArray(): K[] {
        return Array.from(super.keys());
    }

    /**
     * Get all entries in the cache.
     * @returns An array of all key-value pairs in the cache.
     */
    entriesArray(): [K, V][] {
        return Array.from(super.entries());
    }

    /**
     * Check if the cache contains a specific value.
     * @param value The value to search for.
     * @returns True if the value exists, false otherwise.
     */
    hasValue(value: V): boolean {
        return Array.from(this.values()).includes(value);
    }

    /**
     * Find a key by its associated value.
     * @param value The value to find the key for.
     * @returns The first key associated with the value, or undefined if not found.
     */
    findKey(value: V): K | undefined {
        for (const [key, val] of this.entries()) {
            if (val === value) {
                return key;
            }
        }
        return undefined;
    }

    /**
     * Convert the cache to a plain object.
     * @returns An object representation of the cache.
     */
    toObject(): Record<string, V> {
        const obj: Record<string, V> = {};
        for (const [key, value] of this.entries()) {
            obj[key as unknown as string] = value;
        }
        return obj;
    }

    /**
     * Load entries into the cache from a plain object.
     * @param obj The object containing entries to load.
     */
    fromObject(obj: Record<string, V>): void {
        for (const [key, value] of Object.entries(obj)) {
            this.set(key as unknown as K, value);
        }
    }
}
