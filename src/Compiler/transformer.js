'use strict';

const Node = Kumis.Node;

let sym = 0;
function gensym() {
    return 'hole_' + sym++;
}

// Copy-on-write version of map
function mapCOW(arr, func) {
    let res = null;
    for (let i = 0; i < arr.length; i++) {
        const item = func(arr[i]);

        if (item !== arr[i]) {
            if (!res) {
                res = arr.slice();
            }

            res[i] = item;
        }
    }

    return res || arr;
}

function walk(ast, func, depthFirst) {
    if (!(ast instanceof Node.Node)) {
        return ast;
    }

    if (!depthFirst) {
        const astT = func(ast);

        if (astT && astT !== ast) {
            return astT;
        }
    }

    if (ast instanceof Node.NodeList) {
        const children = mapCOW(ast.children, (node) => walk(node, func, depthFirst));

        if (children !== ast.children) {
            ast = new Node[ast.typename](ast.lineno, ast.colno, children);
        }
    } else if (ast instanceof Node.CallExtension) {
        const args = walk(ast.args, func, depthFirst);
        const contentArgs = mapCOW(ast.contentArgs, (node) => walk(node, func, depthFirst));

        if (args !== ast.args || contentArgs !== ast.contentArgs) {
            ast = new Node[ast.typename](ast.extName, ast.prop, args, contentArgs);
        }
    } else {
        const props = ast.fields.map((field) => ast[field]);
        const propsT = mapCOW(props, (prop) => walk(prop, func, depthFirst));

        if (propsT !== props) {
            ast = new Node[ast.typename](ast.lineno, ast.colno);
            propsT.forEach((prop, i) => {
                ast[ast.fields[i]] = prop;
            });
        }
    }

    return depthFirst ? (func(ast) || ast) : ast;
}

function depthWalk(ast, func) {
    return walk(ast, func, true);
}

function _liftFilters(node, prop) {
    const children = [];

    const walked = depthWalk(prop ? node[prop] : node, (descNode) => {
        if (descNode instanceof Node.Block) {
            return descNode;
        }

        return undefined;
    });

    if (prop) {
        node[prop] = walked;
    } else {
        node = walked;
    }

    if (children.length) {
        children.push(node);

        return new Node.NodeList(
            node.lineno,
            node.colno,
            children
        );
    }
    return node;

}

function liftFilters(ast) {
    return depthWalk(ast, (node) => {
        if (node instanceof Node.Output) {
            return _liftFilters(node);
        } else if (node instanceof Node.Set) {
            return _liftFilters(node, 'value');
        } else if (node instanceof Node.For) {
            return _liftFilters(node, 'arr');
        } else if (node instanceof Node.If) {
            return _liftFilters(node, 'cond');
        } else if (node instanceof Node.CallExtension) {
            return _liftFilters(node, 'args');
        }
        return undefined;

    });
}

function transform(ast) {
    return walk(liftFilters(ast), (blockNode) => {
        if (!(blockNode instanceof Node.Block)) {
            return;
        }

        let hasSuper = false;
        const symbol = gensym();

        blockNode.body = walk(blockNode.body, (node) => { // eslint-disable-line consistent-return
            if (node instanceof Node.FunCall && 'super' === node.name.value) {
                hasSuper = true;
                return new Node.SymbolNode(node.lineno, node.colno, symbol);
            }
        });

        if (hasSuper) {
            blockNode.body.children.unshift(new Node.Super(
                0, 0, blockNode.name, new Node.SymbolNode(0, 0, symbol)
            ));
        }
    });
}

module.exports = {
    transform: transform,
};
