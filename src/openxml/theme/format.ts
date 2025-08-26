interface FormatCache {
	[key: number]: any;
}

export default class format {
	private wXml: any;
	private wDoc: any;
	private _converter: any;
	private _line: FormatCache = {};
	private _fill: FormatCache = {0: {}, 1000: {}};
	private _bgFill: FormatCache = {};
	private _effect: FormatCache = {};
	private _font: FormatCache = {};

	constructor(wXml: any, wDoc: any) {
		this.wXml = wXml
		this.wDoc = wDoc
		// this._converter = new Shape.Properties(null, wDoc, null) // Commented out for now
		this._line = {}
		this._fill = {0: {}, 1000: {}}
		this._bgFill = {}
		this._effect = {}
		this._font = {}
	}

	line(idx: number | string, t?: any): any {
		if(t = this._line[idx as number])
			return t
		// return (t = this.wXml.$1('ln:nth-child(' + (parseInt(idx.toString()) + 1) + ')')) && (this._line[idx as number] = this._converter.ln(t))
		return undefined;
	}

	fill(idx: number | string, t?: any): any {
		idx = parseInt(idx.toString())
		if(idx > 1000)
			return this.bgFill(idx - 1000)

		if(t = this._fill[idx])
			return t
		// return (t = this.wXml.$1('bgFillStyleLst>:nth-child(' + (parseInt(idx.toString()) + 1) + ')')) && (this._fill[idx] = this._converter[t.localName](t))
		return undefined;
	}

	bgFill(idx: number | string, t?: any): any {
		if(t = this._bgFill[idx as number])
			return t
		// return (t = this.wXml.$1('bgFillStyleLst>:nth-child(' + (parseInt(idx.toString()) + 1) + ')')) && (this._bgFill[idx as number] = this._converter[t.localName](t))
		return undefined;
	}

	effect(idx: number | string, t?: any): any {
		if(t = this._effect[idx as number])
			return t
		// return (t = this.wXml.$1('effectStyle:nth-child(' + (parseInt(idx.toString()) + 1) + ')>effectLst')) && (this._effect[idx as number] = this._converter.effectLst(t))
		return undefined;
	}

	font(idx: number | string, t?: any): any {
		if(t = this._font[idx as number])
			return t
		// return (t = this.wXml.$1('fontScheme>' + idx + 'Font>latin')) && (this._effect[idx as number] = t.attr('typeface'))
		return undefined;
	}
}
