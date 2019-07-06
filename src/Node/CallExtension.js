const Node = Kumis.Node.Node;
const NodeList = Kumis.Node.NodeList;

/**
 * @memberOf Kumis.Node
 */
class CallExtension extends Node {
    __construct(ext, prop, args, contentArgs, { autoescape = true } = {}) {
        super.__construct();

        this.extName = ext.name || ext;
        this.prop = prop;
        this.args = args || new NodeList();
        this.contentArgs = contentArgs || [];
        this.autoescape = !! autoescape;
    }

    get fields() {
        return [ 'extName', 'prop', 'args', 'contentArgs' ];
    }
}

module.exports = CallExtension;
