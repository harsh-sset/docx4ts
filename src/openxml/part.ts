import * as OLE from "./ole"

interface RelData {
	url: string;
	crc32?: number;
}

interface ImageOptions {
	ext?: string;
	mime?: string;
}

interface CreateElementFunction {
	(type: string, props: any, children: any): any;
}

interface IdentifyFunction {
	(node: any, part: Part): any;
}

/**
 * name: ABSOLUTE path of a part, word.xml, ppt/slides/slide1.xml
 * folder:absolute folder, ends with "/" or totally empty ""
 * relName:absolute path of a relationship part
 */
export default class Part {
	public name: string;
	public doc: any;
	public folder: string = "";
	public relName: string = "";
	public rels: any;
	public content: any;

	constructor(name: string, doc: any) {
		this.name = name
		this.doc = doc

		let folder = ""
		let relName = "_rels/" + name + ".rels"
		let i = name.lastIndexOf('/')

		if(i !== -1){
			folder = name.substring(0, i + 1)
			relName = folder + "_rels/" + name.substring(i + 1) + ".rels";
		}

		if(doc.parts[relName]){
			this.folder = folder
			this.relName = relName
			Object.defineProperty(this, "rels", {
				get(){
					return this.doc.getObjectPart(this.relName)
				}
			})
		}
		this._init()
	}

	_init(): void {
		Object.defineProperty(this, "content", {
			configurable: true,
			get(){
				return this.doc.getObjectPart(this.name)
			}
		})
	}

	_assignRel(supported: boolean | string[] = true): void {
		this.rels(`Relationship[Target$=".xml"]`).each((i: number, rel: any) => {
			let $ = this.rels(rel)
			let type = $.attr("Type").split("/").pop()
			if(supported === true || (Array.isArray(supported) && supported.indexOf(type) != -1)){
				let target = $.attr("Target")
				Object.defineProperty(this, type, {
                    configurable: true,
					get(){
						return this.getRelObject(target)
					}
				})
			}
		})
    }

	normalizePath(path: string = ""): string {
		if(path.startsWith("/"))
			return path.substr(1)
		return this.folder + path
	}

	getRelPart(id: string): Part {
		var rel = this.rels(`Relationship[Id="${id}"],Relationship[Type$="${id}"],Relationship[Target$="${id}"]`)
		var target = rel.attr("Target")
		return new Part(this.normalizePath(target), this.doc)
	}

	getRelTarget(type: string): string {
		return this.rels(`[Type$="${type}"]`).attr("Target")
	}

	getRelObject(target: string): any {
		return this.doc.getObjectPart(this.normalizePath(target))
	}

	getRel(id: string): RelData | any | undefined {
		var rel = this.rels(`Relationship[Id="${id}"]`)
		var target = rel.attr("Target")
		if(!target){
			return 
		}
		if(rel.attr("TargetMode") === 'External')
			return {url: target}

		switch(rel.attr("Type").split("/").pop()){
		case 'image':
			let url = this.doc.getDataPartAsUrl(this.normalizePath(target), "image/*")
			let crc32 = this.doc.getPartCrc32(this.normalizePath(target))
			return {url, crc32}
		default:
			if(target.endsWith(".xml"))
				return this.getRelObject(target)
			else
				return this.doc.getPart(this.normalizePath(target))
		}
	}

	_nextrId(): number {
		return Math.max(...this.rels('Relationship').toArray().map((a: any) => parseInt(a.attribs.Id.substring(3)))) + 1
	}

	add(type: string, target: string, data: any): string {
		const rId = `rId${this._nextrId()}`
		this.rels("Relationships")
			.append(`<Relationship Id="${rId}" type="${type}" target="${target}"/>`)
		const partName = this.normalizePath(target)
		this.doc.raw.file(partName, data)
		this.doc.parts[partName] = this.doc.raw.file(partName)
		return rId
	}

	addImage(data: any, {ext = "jpg", mime = "image/jpg"}: ImageOptions = {}): string {
		const type = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"
		let id = `rId${this._nextrId()}`

		let targetName = "media/image" + (Math.max(0, ...this.rels("Relationship[Type$='image']").toArray().map((t: any) => {
			return parseInt(t.attribs.Target.match(/\d+\./) || [0])
		})) + 1) + "." + ext;

		let partName = this.normalizePath(targetName)
		this.doc.raw.file(partName, data)
		this.doc.parts[partName] = this.doc.raw.file(partName)

		this.rels("Relationships")
			.append(`<Relationship Id="${id}" Type="${type}" Target="${targetName}"/>`)

		const DefaultTypes = this.doc.getObjectPart("[Content_Types].xml")(`Types`)
		const extType = DefaultTypes.find(`>Default[Extension='${ext}']`)
		if(extType.length == 0){
			DefaultTypes.prepend(`<Default Extension="${ext}" ContentType="${mime}"/>`)
		}
		return id
	}

	addExternalImage(url: string): string {
		const type = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"

		let id = `rId${this._nextrId()}`

		this.rels("Relationships")
			.append(`<Relationship Id="${id}" Type="${type}" TargetMode="External" Target="${url}"/>`)

		return id
	}

	addChunk(data: any, relationshipType?: string, contentType?: string, ext?: string): string {
		relationshipType = relationshipType || "http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk"
		contentType = contentType || this.doc.constructor.mime
		ext = ext || this.doc.constructor.ext

		let id = this._nextrId()
		let rId = `rId${id}`
		let targetName = `chunk/chunk${id}.${ext}`

		let partName = this.normalizePath(targetName)
		this.doc.raw.file(partName, data)
		this.doc.parts[partName] = this.doc.raw.file(partName)

		this.rels("Relationships")
			.append(`<Relationship Id="${rId}" Type="${relationshipType}" Target="${targetName}"/>`)

		this.doc.contentTypes
			.append(`<Override PartName="/${partName}" ContentType="${contentType}"/>`)

		return rId
	}

	getRelOleObject(rid: string): string | any {
		let rel = this.rels(`Relationship[Id=${rid}]`)
		let type = rel.attr("Type")
		let targetName = rel.attr("Target")
		let data = this.doc.getDataPart(this.normalizePath(targetName))
		switch(type.split("/").pop()){
			case "oleObject":
				return OLE.parse(data)
			default:
				return data
		}
	}

	removeRel(id: string): void {
		let rel = this.rels(`Relationship[Id="${id}"]`)
		if(rel.attr("TargetMode") !== "External"){
			let partName = this.normalizePath(rel.attr("Target"))
			this.doc.contentTypes.find(`[PartName='/${partName}']`).remove()
			this.doc.raw.remove(partName)
			delete this.doc.parts[partName]
		}
		rel.remove()
	}

	renderNode(node: any, createElement: CreateElementFunction = (type, props, children) => ({type, props, children}), identify?: IdentifyFunction, extra?: any): any {
		let {name: tagName, children, id, parent} = node
		if(node.type == "text"){
			return node.data
		}

		let type = tagName
		let props: any = {}

		if(identify){
			let model = identify(node, this)
			if(!model)
				return null

			if(typeof(model) == "string"){
				type = model
			}else{
				let content;
				({type, children: content, ...props} = model);
				if(content !== undefined)
					children = content
			}
		}
		props.key = id
		props.node = node
		props.type = type

		if(extra)
			Object.assign(props, extra)

		let childElements = children
		if(Array.isArray(children)){
			if(children.length){
				childElements = children.map((a: any) => a ? this.renderNode(a, createElement, identify) : null).filter((a: any) => !!a)
			}
		}

		return createElement(
				type,
				props,
				childElements
			)
	}

	$(node: any): any {
		return this.doc.$(node)
	}
}

class RelsPart extends Part {
	_init(): void {
		super._init()
	}
}
