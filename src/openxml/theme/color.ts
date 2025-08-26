export default class color {
	private map: { [key: string]: string };
	private scheme: any;

	constructor(scheme: any, xMapping: { [key: string]: string }) {
		this.map = xMapping
		this.scheme = scheme
	}

	get(name: string): string {
		if(name == 'phClr') //placeholder color, witch will be replaced with direct style
			return name
		name = this.map[name] || name
		return '#' + (this.scheme.get(`${name}.srgbClr`) || this.scheme.get(`${name}.sysClr.$.lastClr`) || '000000')
	}
}
