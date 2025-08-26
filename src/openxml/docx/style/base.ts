import {getable} from "../../../xmlObject"

export default class Style {
	private raw: any;
	private styles: any;
	private basedOn: string | any;

	constructor(style: any, styles: any, basedOn: string | any = "basedOn") {
		this.raw = style.get ? style : getable(style)
		this.styles = styles
		this.basedOn = basedOn
	}

	get(path: string): any {
		let value = this.raw.get(path)
		if(value == undefined)
			value = this.getFromBasedOn(path)
		return value
	}

	getBasedOn(): any {
		if(!this.basedOn)
			return undefined
		if(typeof(this.basedOn) !== 'string')
		 	return this.basedOn
		if(this.styles)
			return this.styles[this.raw.get(this.basedOn)]
		return undefined
	}

	getFromBasedOn(path: string): any {
		let basedOn = this.getBasedOn()
		if(basedOn)
			return basedOn.get(...arguments)
		return undefined
	}
}
