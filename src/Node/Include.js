const TemplateRef = Kumis.Node.TemplateRef;

/**
 * @memberOf Kumis.Node
 */
export default class Include extends TemplateRef {
    get fields() {
        return [ ...super.fields, 'ignoreMissing' ];
    }
}
