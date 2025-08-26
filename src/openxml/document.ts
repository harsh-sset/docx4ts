import Base from "../document"
import Part from './part'
import Color from "color"

interface ColorTransform {
	lumMod?: number;
	lumOff?: number;
	tint?: number;
	shade?: number;
}

export default class extends Base {
	protected main: Part;
	protected rels: Part;
	protected officeDocument: any;

	constructor(...args: any[]) {
		super(args[0], args[1], args[2])
		this.main = this.rels = new Part("", this)
		this.officeDocument = new (this.constructor as any).OfficeDocument(this.main.getRelTarget("officeDocument"), this)
	}

	get vender(): string { return "Microsoft" }

	get product(): string { return 'Office 2010' }

	get contentTypes(): any {
		const part = this.getObjectPart("[Content_Types].xml");
		return part ? part("Types") : null;
	}

	render(...args: any[]): any {
		return this.officeDocument.render(...args)
	}

	parse(...args: any[]): any {
		return this.officeDocument.parse(...args)
	}

	dxa2Px(a: number): number {
		return this.pt2Px(a / 20.0)
	}

	emu2Px(a: number): number {
		return this.pt2Px(a / 12700)
	}

	pt2Px(pt: number): number {
		return pt * 96 / 72
	}

	cm2Px(cm: number): number {
		return this.pt2Px(parseInt(cm.toString()) * 28.3464567)
	}

	asColor(v: string, transform?: ColorTransform): string {
		if(!v || v.length == 0 || v == 'auto')
			return '#000000'
		v = v.split(' ')[0]
		const rgb = v.charAt(0) == '#' ? v : (RGB.test(v) ? '#' + v : v)
		if(transform){
			const {lumMod, lumOff, tint, shade} = transform
			if(lumMod || lumOff || tint){
		        let color = Color(rgb)

		        if(tint != undefined){
		            color = color.lighten(1 - tint)
		        }

		        if(lumMod != undefined){
		            color = color.lighten(lumMod)
		        }

		        if(lumOff != undefined){
		            color = color.darken(lumOff)
		        }

				if(shade != undefined){
					color = color
						.red(color.red() * (1 + shade))
						.green(color.green() * (1 + shade))
						.blue(color.blue() * (1 + shade))
				}

		        return `${color.hex()}`.replace(/^0x/, "#")
		    }
		}
		return rgb
	}
	
	toPx(length: string | number): number {
		var value = parseFloat(length.toString()),
			units = String(length).match(RE_LENGTH_UNIT)?.[1];

		switch (units) {
			case 'cm' : return this.cm2Px(value);
			case 'mm' : return this.cm2Px(value / 10);
			case 'in' : return this.pt2Px(value * 72);
			case 'pt' : return this.pt2Px(value);
			case 'ft' : return this.pt2Px(value * 864)
			default   : return value;
		}
	}

	static OfficeDocument = Part
}

const RGB = /([a-fA-F0-9]{2}?){3}?/;
const RE_LENGTH_UNIT = /^([a-zA-Z]+)$/
