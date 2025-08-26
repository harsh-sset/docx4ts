import cheerio from "cheerio"

interface PropsOptions {
	names?: { [key: string]: string };
	nameFn?: (a: string, node?: any, parentProps?: any) => string;
	__filter?: string;
	tidy?: (a: any) => any;
	[key: string]: any;
}

interface Node {
	name: string;
	attribs: { [key: string]: string };
	children: Node[];
	parent?: Node;
	next?: Node;
	prev?: Node;
}

cheerio.prototype.props = function(opt: PropsOptions = {}): any {
    if(this.length == 0)
        return {}
    const $ = this.constructor
    const {names, nameFn = (a: string) => names && names[a] || a, __filter = '*', tidy = (a: any) => a} = opt

    const propsAttribs = (attribs: { [key: string]: string }) => Object.keys(attribs)
        .filter(k => !k.startsWith("xmlns"))
        .reduce((props: any, attribKey: string) => {
            const value = attribs[attribKey]
            attribKey = attribKey.split(":").pop()!
            const parsedValue = opt[attribKey] ? opt[attribKey](value) : value
            if(parsedValue != undefined){
                props[nameFn(attribKey)] = parsedValue
            }
            return props
        }, {})

	const propsChild = (node: Node, parentProps: any, index: number) => {
        const tagName = node.name.split(":").pop()!
        const parsed = opt[tagName] ? opt[tagName](node) : toJS(node)
        if(parsed != undefined){
            const key = Array.isArray(parentProps) ? index : nameFn(tagName, node, parentProps)
            parentProps[key == "[]" ? tagName : key] = opt[`tidy_${tagName}`] ? opt[`tidy_${tagName}`](parsed) : parsed
        }
        return parentProps
    }

    const toJS = (node: Node, p?: any) => {
        const {children, attribs, name = ""} = node
        const tagName = name.split(":").pop()!
        return children
            .filter(a => a.name && $(a).is(__filter))
            .reduce(
                (parentProps: any, child: Node, i: number) => propsChild(child, parentProps, i),
                nameFn(tagName, node) === "[]" ? [] : propsAttribs(attribs)
            )
    }

    const props = toJS(this[0])

    return tidy ? tidy(props) : props
}

cheerio.prototype.forwardUntil = function(selector: string, filter?: string): any {
    const Empty = this.constructor.root().not((a: any) => true)
    const $ = (n: any) => Empty.not((a: any) => true).add(n)
    let until = Empty, filtered = Empty

    let next = this.get(0)
    const parentNext = (node: any): any => node && (node.parent && (node.parent.next || parentNext(node.parent)))
    const getNext = (node: any) => node && ((node.children && node.children[0]) || node.next || parentNext(node))
    while(next && (next = getNext(next))){
        let $n = $(next)
        if($n.is(selector)){
            until = until.add(next)
            break
        }else if(filter && $n.is(filter)){
            filtered = filtered.add(next)
        }
    }
    return filter ? filtered : until
}

cheerio.prototype.backwardUntil = function(selector: string, filter?: string): any {
    const Empty = this.constructor.root().not((a: any) => true)
    const $ = (n: any) => Empty.not((a: any) => true).add(n)
    let until = Empty, filtered = Empty

    let prev = this.get(0)
    const parentPrev = (node: any): any => node && (node.parent && (node.parent.prev || parentPrev(node.parent)))
    const getPrev = (node: any) => node && ((node.children && node.children[node.children.length-1]) || node.prev || parentPrev(node))
    while(prev && (prev = getPrev(prev))){
        let $n = $(prev)
        if($n.is(selector)){
            until = until.add(prev)
            break
        }else if(filter && $n.is(filter)){
            filtered = filtered.add(prev)
        }
    }
    return filter ? filtered : until
}
