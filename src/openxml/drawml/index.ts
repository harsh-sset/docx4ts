import Part from "../part"

interface DrawMLOptions {
	__filter?: string;
	id?: () => undefined;
	[key: string]: any;
	names?: { [key: string]: string };
	inherit?: (...additions: any[]) => any;
}

interface BlipNode {
	attribs: {
		"r:embed"?: string;
		"r:link"?: string;
	};
}

interface PathNode {
	children: Array<{
		name: string;
		attribs: { [key: string]: string };
		children?: Array<{ attribs: { [key: string]: string } }>;
	}>;
}

interface ExtentNode {
	attribs: {
		cx: string;
		cy: string;
	};
}

interface EffectExtentNode {
	attribs: {
		l: string;
		t: string;
		r: string;
		b: string;
	};
}

interface OffsetNode {
	attribs: {
		x: string;
		y: string;
	};
}

export default (od: any): DrawMLOptions => ({
	__filter: ":not(a\\:extLst)",
	id: () => undefined,
	...same("latin,ea,cs".split(","), ({attribs: {typeface = ""}}: any) => od.theme.font(typeface)),
	//sz:v=>od.doc.pt2Px(parseInt(v)/100),
	...same("lumMod,lumOff,tint,shade".split(","), ({attribs: {val}}: any) => parseInt(val) / 100000),
	tidy_schemeClr: ({val, ...effect}: any) => od.doc.asColor(od.theme.color(val), effect),
	tidy_srgbClr: ({val, ...effect}: any) => od.doc.asColor(val, effect),
	tidy_prstClr: ({val, ...effect}: any) => od.doc.asColor(val, effect),
	sysClr: ({attribs: {val}}: any) => val,
	tidy_solidFill: ({color}: any) => color,
	rot: (v: string) => parseInt(v) / 60000,

	blip: (n: BlipNode) => {
		const {attribs: {"r:embed": embed, "r:link": url}} = n
		if(url)
			return {url}
		if(!embed)
			return 
		const part = od.$(n).part()
		return new Part(part, od.doc).getRel(embed)
	},

	prstGeom(x: any): string {
		return x.attribs.prst
	},
	pathLst({children}: PathNode): string {
		const px = (x: string) => od.doc.emu2Px(x)
		return children.filter((a: any) => a.name == "a:path")
			.reduce((d: string[], path: any) => {
				path.children.filter((a: any) => a.name)
					.forEach((a: any) => {
						switch(a.name.split(":").pop()){
						case 'moveTo':
							d.push('M ' + px(a.children[0].attribs.x) + ' ' + px(a.children[0].attribs.y))
							break
						case 'lnTo':
							d.push('L ' + px(a.children[0].attribs.x) + ' ' + px(a.children[0].attribs.y))
							break
						case 'cubicBezTo':
							d.push('L ' + px(a.children[0].attribs.x) + ' ' + px(a.children[0].attribs.y))
							d.push('Q ' + px(a.children[1].attribs.x) + ' ' + px(a.children[1].attribs.y)
								+ ' ' + px(a.children[2].attribs.x) + ' ' + px(a.children[2].attribs.y))
							break
						case 'arcTo':
							d.push(`A`)
							break
						case 'close':
							d.push('Z')
							break
						}
					})
				return d
			}, []).join(" ")
	},
	tidy_custGeom: ({pathLst}: any) => pathLst,

	lvl: (v: string) => parseInt(v),
	spcPts: ({attribs: {val}}: any) => od.doc.pt2Px(parseInt(val) / 100),
	tidy_spcAft: ({spcPts: a}: any) => a,
	tidy_spcBef: ({spcPts: a}: any) => a,

	buFont: ({attribs: {typeface}}: any) => od.theme.font(typeface),
	buChar: ({attribs: {char}}: any) => char,
	buSzPts: ({attribs: {val}}: any) => od.doc.pt2Px(parseInt(val) / 100),
	buSzPct: ({attribs: {val}}: any) => parseInt(val) / 1000 / 100,
	buAutoNum: ({attribs}: any) => ({...attribs}),
	tidy_buClr: ({color}: any) => color,

	indent: (v: string) => od.doc.emu2Px(v),
	marL: (v: string) => od.doc.emu2Px(v),
	marR: (v: string) => od.doc.emu2Px(v),
	marT: (v: string) => od.doc.emu2Px(v),
	marB: (v: string) => od.doc.emu2Px(v),
	
	lIns: (v: string) => od.doc.emu2Px(v),
	rIns: (v: string) => od.doc.emu2Px(v),
	bIns: (v: string) => od.doc.emu2Px(v),
	tIns: (v: string) => od.doc.emu2Px(v),

	distL: (v: string) => od.doc.emu2Px(v),
	distR: (v: string) => od.doc.emu2Px(v),
	distT: (v: string) => od.doc.emu2Px(v),
	distB: (v: string) => od.doc.emu2Px(v),

	ext: ({attribs: {cx, cy}}: ExtentNode) => ({width: od.doc.emu2Px(cx), height: od.doc.emu2Px(cy)}),
	extent: ({attribs: {cx, cy}}: ExtentNode) => ({width: od.doc.emu2Px(cx), height: od.doc.emu2Px(cy)}),
	effectExtent: ({attribs: {l, t, r, b}}: EffectExtentNode) => ({left: od.doc.emu2Px(l), right: od.doc.emu2Px(r), top: od.doc.emu2Px(t), bottom: od.doc.emu2Px(b)}),
	off: ({attribs: {x, y}}: OffsetNode) => ({x: od.doc.emu2Px(x), y: od.doc.emu2Px(y)}),
	tidy_xfrm: ({ext = {}, off = {}, ...transform}: any) => ({...ext, ...off, ...transform}),

	...same("ln,lnB,lnR,lnL,lnT,lnTlToBr,lnBlToTr".split(",").map(a => 'tidy_' + a), ({w, ...props}: any) => ({...props, w: w ? od.doc.emu2Px(w) : undefined})),
	...same("left,right,top,bottom".split(",").map(a => 'tidy_' + a), ({ln}: any) => ln),
	tidy_tcTxStyle: ({color, ...props}: any) => ({...props, solidFill: color}),

	tidy_lnRef: ({idx, ...ph}: any) => od.theme.lnRef(idx, ph),
	tidy_fillRef: ({idx, ...ph}: any) => od.theme.fillRef(idx, ph),
	tidy_effectRef: ({idx, ...ph}: any) => od.theme.effectRef(idx, ph),
	tidy_fontRef: ({idx, ...ph}: any) => od.theme.fontRef(idx, ph),

	tidy_noAutoFit: () => undefined,
	tidy_normAutoFit: (props: any) => ({type: "font", ...props}),
	tidy_spAutoFit: (props: any) => ({type: "block", ...props}),

	names: {
		schemeClr: "color", srgbClr: "color", sysClr: "color", prstClr: "color",
		prstGeom: "geometry", custGeom: "geometry",
		lnB: "bottom", lnR: "right", lnL: "left", lnT: "top",
		rot: "rotate",
		spAutoFit: "autofit", normAutoFit: "autofit", noAutoFit: "autofit",
		gsLst: "[]"
	},

	inherit(...additions: any[]): any {
		return additions.reduce(({__filter = "", names = {}, ...others}: any, {__filter: _filter = "", names: _names = {}, ..._others}: any) => {
			return {
				...others,
				..._others,
				__filter: [__filter, _filter].filter(a => !!a).join(","),
				names: {...names, ..._names},
			}
		}, this)
	}
})

const same = (keys: string[], fx: Function): {[key: string]: Function} => keys.reduce((fs: {[key: string]: Function}, k: string) => (fs[k] = fx, fs), {})
