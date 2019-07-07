const TemplateRef = Kumis.Node.TemplateRef;

/**
 * @memberOf Kumis.Node
 */
class Include extends TemplateRef {
    get fields() {
        return [ ...super.fields, 'ignoreMissing' ];
    }
}

module.exports = Include;
