declare namespace Kumis.Node {
    export class Import extends Node {
        public template: TemplateRef;
        public target: Value;
        public withContext: boolean;
    }
}
