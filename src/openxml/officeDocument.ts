import Part from "./part"
import drawml from "./drawml"

interface ThemeColor {
	color: string;
}

interface ThemeFont {
	latin?: string;
	ea?: string;
	cs?: string;
}

interface TransformResult {
	[key: string]: any;
}

export default class extends Part {
	protected theme: any;

	_init(...args: any[]): void {
		super._init()
		this._assignRel(["theme"])

		const doc = this.doc
		const transform = (ph: any): TransformResult => ({
			...drawml(this),
			tidy_schemeClr: ({val, ...effect}: any) => {
				return this.doc.asColor(val == "phClr" ? ph.color : this.theme.color(val), effect)
			},
		})
		if(this.theme){
			Object.assign(this.theme, {
				font: (typeface: string): string => {
					const type: {[key: string]: string} = {mn: "minor", mj: "major"}
					const [a, b] = typeface.split(/[+-]/g).filter((a: string) => a)
					if(a && b)
						return (this.theme as any)(`a\\:fontScheme>a\\:${type[a]}Font>a\\:${b == "lt" ? "latin" : b}`).attr("typeface")
					return typeface
				},
				color: (k: string): string => {
					const $ = (this.theme as any)(`a\\:clrScheme>a\\:${k}`).children().eq(0)
					return doc.asColor($.attr("lastClr") || $.attr("val"))
				},

				fillRef: (idx: number | string, ph: any): any => {
					idx = parseInt(idx.toString())
					if(idx == 0 || idx == 1000)
						return {}
					if(idx > 1000)
						return (this.theme as any)('a\\:fmtScheme>a\\:bgFillStyleLst')
							.children()
							.eq(idx - 1001)
							.props(transform(ph))

					return (this.theme as any)('a\\:fmtScheme>a\\:fillStyleLst')
						.children()
						.eq(idx - 1)
						.props(transform(ph))
				},

				lnRef: (idx: number | string, ph: any): any => {
					return (this.theme as any)('a\\:fmtScheme>a\\:lnStyleLst')
						.children()
						.eq(parseInt(idx.toString()) - 1)
						.props(transform(ph))
				},

				effectRef: (idx: number | string, ph: any): any => {
					return (this.theme as any)('a\\:fmtScheme>a\\:effectStyleLst')
						.children()
						.eq(parseInt(idx.toString()) - 1)
						.children('a\\:effectLst')
						.props(transform(ph))
				},

				fontRef: (idx: string, ph: any): ThemeFont => {
					const $ = (this.theme as any)('a\\:fmtScheme>a\\:fontScheme>a\\:' + idx + 'Font')
					const latin = $.children('a\\:latin')
					const ea = $.children('a\\:ea')
					const cs = $.children('a\\:cs')
					return {latin: latin.attr("typeface"), ea: ea.attr('typeface'), cs: cs.attr("typeface"), ...ph}
				}
			})
		}
	}

	render(createElement: any, identify: any = (this.constructor as any).identify.bind(this.constructor)): any {

	}

	parse(domHandler: any, identify: any = (this.constructor as any).identify.bind(this.constructor)): any {
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

		return this.render(createElement, _identify)
	}

	static identify(wXml: any, officeDocument: any): any {
		const identities = this.identities
		const tag = wXml.name.split(":").pop()
		if(identities[tag])
			return identities[tag](...arguments)

		return tag
	}

	static identities: {[key: string]: Function} = {
		
	}
}
