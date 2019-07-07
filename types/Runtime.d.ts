declare namespace Kumis {
    import TemplateError = Kumis.Exception.TemplateError;
    import Frame = Kumis.Util.Frame;

    export class Runtime {
        static makeMacro(argNames: string[], kwargNames: string[], func: Function): Function;
        static makeKeywordArgs(obj: any): any;
        static isKeywordArgs(obj: any): boolean;

        static getKeywordArgs(args: any[]): any;
        static numArgs(args: any[]): number;

        static suppressValue(val: any, autoescape: boolean): string;

        static memberLookup(obj: any, val: string): any;
        static callWrap(obj: any, name: string, context: any, args: any[]): any;
        static contextOrFrameLookup(context: Context, frame: Frame, name: string): any;

        static handleError(error: Error, lineno: number, colno: number): TemplateError;

        static fromIterator(arr: null): null;
        static fromIterator<T>(arr: T[]): T[];
        static fromIterator<K, T extends Iterable<K>>(arr: T): K[];
        static fromIterator(arr: any): any;

        static inOperator(key: any, val: string|any[]|Record<any, any>): boolean;
    }
}
