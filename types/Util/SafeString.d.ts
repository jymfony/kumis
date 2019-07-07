declare namespace Kumis.Util {
    /**
     * A SafeString object indicates that the string should not be
     * autoescaped. This happens magically because autoescaping only
     * occurs on primitive string objects.
     */
    export class SafeString extends String {
        constructor(val: string);

        /**
         * Returns the primitive value of the specified object.
         */
        valueOf(): string;

        /**
         * Returns a string representation of a string.
         */
        toString(): string;

        static markSafe(val: string): SafeString;
        static markSafe(val: () => string): () => SafeString;
        static markSafe<T>(val: () => T): () => T;
        static markSafe<T>(val: T): T;

        static copy(dest: SafeString, target: any): SafeString;
        static copy(dest: any, target: any): string;
    }
}
