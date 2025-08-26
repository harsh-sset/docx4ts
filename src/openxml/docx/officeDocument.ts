import Base from "../officeDocument"
import drawml from "../drawml"

interface DocumentData {
	styles?: any;
	numbering?: any;
	document: any;
}

interface SectionData {
	type: string;
	children: any[];
	headers: Map<string, any>;
	footers: Map<string, any>;
	hasTitlePage: boolean;
}

interface ParagraphData {
	type: string;
	pr?: any;
	children: any[];
}

export default class extends Base {
	protected styles: any;
	protected numbering: any;

	_init(): void {
		super._init()
		this._assignRel("styles,numbering,settings".split(","))

		if(this.styles){
			let $ = this.styles
			this.styles.prototype.basest = function(selector: string): any {
				let current = this
				while(current.length > 0){
					if(current.is(selector)){
						return $(current)
					}
					current = $.root().find(`w\\:style[w\\:styleId="${current.children("w\\:basedOn").attr("w:val")}"]`)
				}
				return this.not(this)
			}
		}
	}

	render(createElement: any, identify: any = (this.constructor as any).identify.bind(this.constructor)): any {
		let styles: any, numbering: any
		if(this.styles)
			styles = this.renderNode(this.styles("w\\:styles").get(0), createElement, identify)
		if(this.numbering)
			numbering = this.renderNode(this.numbering("w\\:numbering").get(0), createElement, identify)
		return this.renderNode(this.content("w\\:document").get(0), createElement, identify, {styles, numbering})
	}

	parse(domHandler: any, identify: any = (this.constructor as any).identify.bind(this.constructor)): DocumentData {
		const doc: DocumentData = {document: null}
		const createElement = domHandler.createElement.bind(domHandler)
		function _identify(...args: any[]): any {
			let model = identify(...args)
			if(model && typeof(model) == "object"){
				domHandler.emit("*", model, ...args)
				domHandler.emit(model.type, model, ...args)
				if(domHandler[`on${model.type}`])
					domHandler[`on${model.type}`](model, ...args)
			}
			return model
		}

		if(this.styles)
			doc.styles = this.renderNode(this.styles("w\\:styles").get(0), createElement, _identify)
		if(this.numbering)
			doc.numbering = this.renderNode(this.numbering("w\\:numbering").get(0), createElement, _identify)
		doc.document = this.renderNode(this.content("w\\:document").get(0), createElement, _identify)
		return doc
	}

	static identities: {[key: string]: Function} = {
		document(wXml: any, officeDocument: any): any {
			let $ = officeDocument.content
			let current: any = null
			let children = $("w\\:sectPr").each((i: number, sect: any) => {
				let end = $(sect).closest('w\\:body>*')
				sect.content = end.prevUntil(current).toArray().reverse()
				if(!end.is(sect))
					sect.content.push(end.get(0))
				current = end
			}).toArray()
			return {type: "document", children}
		},
		sectPr(wXml: any, officeDocument: any): SectionData {
			const hf = (type: string) => wXml.children.filter((a: any) => a.name == `w:${type}Reference`).reduce((headers: Map<string, any>, a: any) => {
					headers.set(a.attribs["w:type"], officeDocument.getRel(a.attribs["r:id"]))
					return headers
				}, new Map())

			return {
				type: "section",
				children: wXml.content,
				headers: hf("header"),
				footers: hf("footer"),
				hasTitlePage: !!wXml.children.find((a: any) => a.name == "w:titlePg")
			}
		},
		p(wXml: any, officeDocument: any): ParagraphData {
			let $ = officeDocument.content(wXml)
			let type = "p"

			let identity: ParagraphData = {type, pr: wXml.children.find(({name}: any) => name == "w:pPr"), children: wXml.children.filter(({name}: any) => name != "w:pPr")}

			let pPr = $.find("w\\:pPr")
			if(pPr.length){
				let styleId = pPr.find("w\\:pStyle").attr("w:val")

				let numPr = pPr.children("w\\:numPr")
				if(!numPr.length && styleId){
					numPr = officeDocument
						.styles(`w\\:style[w\\:styleId="${styleId}"]`)
						.basest(`:has(w\\:numPr)`)
						.find("w\\:numPr")
				}

				if(numPr.length){
					// Continue with the rest of the logic...
				}
			}
			return identity
		}
	}
}
