import Style from "./base"

interface NumberingData {
	[key: string]: any;
}

interface AbstractNumberingData {
	[key: string]: any;
}

export default class Numberings {
	private num: NumberingData = {};
	private abstractNum: AbstractNumberingData = {};
	private numPicBullet: any = {};
	public numberings: any;

	constructor(numbering: any, styles: any) {
		if(numbering){
			;(numbering.get('numbering.num', false) || []).forEach((num: any) => {
				let id = num.$.numId
				this.num[id] = new NumStyle(num, styles, this)
			})
			;(numbering.get("numbering.abstractNum", false) || []).forEach((def: any) => {
				let id = def.$.abstractNumId
				def.lvl.forEach((level: any) => {
					this.abstractNum[`${id}.${level.$.ilvl}`] = new LevelStyle(level, styles, null, this.numberings)
				})
			})
		}
	}

	get(path: string, numId: string, level: number): any {
		return this.num[numId].get(path, level)
	}
}

class NumStyle extends Style {
	private numberings: Numberings;
	private abstractNumId: string;
	[key: number]: NumLevelStyle;

	constructor(style: any, styles: any, numberings: Numberings) {
		super(style, styles, null)
		this.numberings = numberings
		this.abstractNumId = style.get("abstractNumId")

		;(style.get('lvlOverride') || []).forEach((a: any) => {
			let level = a.$.ilvl
			let lvl = a.get('lvl') || {$: {ilvl: level}}, startOverride = a.get('startOverride')
			if(startOverride)
				lvl.start = {$: {val: startOverride}}

			this[level] = new NumLevelStyle(lvl, (this as any).styles, null, this.numberings)
		})
	}

	get(path: string, level?: number): any {
		return this.level(level || 0).get(path)
	}

	level(level: number): NumLevelStyle {
		return this[level] || (this[level] = new NumLevelStyle({$: {ilvl: level}}, (this as any).styles, `${this.abstractNumId}.${level}`, this.numberings))
	}
}

class LevelStyle extends Style {
	protected numberings: any;

	constructor(style: any, styles: any, basedOn: any, numberings: any) {
		super(style, styles, basedOn)
		this.numberings = numberings
	}
}

class NumLevelStyle extends LevelStyle {
	private current: number = 0;

	getBasedOn(): any {
		return this.numberings.abstractNum[(this as any).basedOn]
	}

	get(path: string): any {
		if(path == "label")
			return this.getLabel()
		else
			return super.get(path)
	}

	getLabel(): string {
		let value: string | undefined = undefined
		let lvlPicBulletId = this.get("lvlPicBulletId")
		if(lvlPicBulletId != undefined){
			throw new Error("pic bullet not supported yet!")
		}else{
			let lvlText = this.get("lvlText")

			value = lvlText.replace(/%(\d+)/g, (a: string, level: string) => {
				level = (parseInt(level) - 1).toString()
				if(level == (this as any).raw.$.ilvl){
					let start = parseInt(this.get("start"))
					let numFmt = this.get("numFmt")
					return (NUMFMT[numFmt] || NUMFMT['decimal'])(start + this.current)
				}else
					return (this as any).basedOn.level(parseInt(level)).getLabel(this.current)
			})
		}

		this.current++
		return value!
	}
}

const NUMFMT: {[key: string]: Function} = {
	decimal(n: number): string {
		return n.toString()
	},
	lowerLetter(n: number): string {
		return String.fromCharCode(96 + n)
	},
	upperLetter(n: number): string {
		return String.fromCharCode(64 + n)
	},
	lowerRoman(n: number): string {
		// Add roman numeral conversion logic
		return n.toString()
	},
	upperRoman(n: number): string {
		// Add roman numeral conversion logic
		return n.toString()
	}
}
