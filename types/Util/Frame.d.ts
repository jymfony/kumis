declare namespace Kumis.Util {
    /**
     * Frames keep track of scoping both at compile-time and run-time so
     * we know how to access variables. Block tags can introduce special
     * variables, for example.
     */
    export class Frame {
        public variables: Record<string, any>;
        public parent?: Frame;
        public topLevel: boolean;
        public isolateWrites: boolean;

        /**
         * Constructor.
         */
        __construct(parent: Frame, isolateWrites: boolean): void;
        constructor(parent: Frame, isolateWrites: boolean);

        /**
         * Sets a variable.
         */
        set(name: string, val: any, resolveUp?: boolean): void;

        /**
         * Gets a variable from current frame.
         */
        get(name: string): void;

        /**
         * Looks up a variable with given name recursively
         * to parent frames.
         */
        lookup(name: string): any;

        /**
         * Resolves a frame for the variable with the given name.
         */
        resolve(name: string, forWrite: boolean): Frame;

        /**
         * Creates and gets a new frame child of this frame.
         */
        push(isolateWrites: boolean): Frame;

        /**
         * Pops out the parent frame.
         */
        pop(): Frame;
    }
}
