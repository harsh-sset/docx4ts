import JSZip = require('jszip')
import cheer from "cheerio"
import "./cheerio-fn"
import {Parser, DomHandler} from "htmlparser2"

// Type definitions
interface DocumentProps {
	name?: string;
	lastModified?: number;
	size?: number;
}

interface PartData {
	crc32: number;
	_data: { crc32: number };
	asUint8Array(): Uint8Array & { crc32?: number };
	asText(): string;
	xml(): string;
	cheerio?: boolean;
	name: string;
	options?: any;
}

interface Parts {
	[key: string]: PartData;
}

interface CheerioStatic {
	root(): any;
	prototype: any;
	xml(): string;
	cheerio?: string;
	(selector: string): any;
}

declare global {
	var __dirname: string;
}

const normalize = (path: string): string => path.split("/").filter(a => a != ".")
	.reduceRight((n: {trimed: string[], r: number}, a: string) => {
		if(a == ".."){
			n.r++
		}else if(n.r){
			n.r--
		}else{
			n.trimed.unshift(a)
		}
		return n
	},{trimed: [], r: 0}).trimed.join("/")

/**
 *  document parser
 *
 *  @example
 *  Document.load(file)
 *  	.then(doc=>doc.parse())
 */
export default class ZipDocument {

	static ext: string = "unknown"
	static mime: string = "application/zip"

	protected parts: Parts
	protected raw: JSZip
	protected props: DocumentProps
	protected _shouldReleased: Map<number, string>

	constructor(parts: Parts, raw: JSZip, props: DocumentProps) {
		this.parts = parts
		this.raw = raw
		this.props = props
		this._shouldReleased = new Map()
	}

	normalizePath(...args: string[]): string {
		return normalize(args.join("/"))
	}

	getPart(name: string): PartData | undefined {
		name = normalize(name)
		return this.parts[name]
	}

	getDataPart(name: string): Uint8Array {
		name = normalize(name)
		let part = this.parts[name]
		let crc32 = part._data.crc32
		let data = part.asUint8Array() //unsafe call, part._data is changed
		data.crc32 = part._data.crc32 = crc32 //so keep crc32 on part._data for future
		return data
	}

	getDataPartAsUrl(name: string, type: string = "*/*"): string {
		name = normalize(name)
		let part = this.parts[name]
		let crc32 = part._data.crc32
		if(!this._shouldReleased.has(crc32)){
			this._shouldReleased.set(crc32, globalThis.URL.createObjectURL(new Blob([this.getDataPart(name) as BlobPart], {type})))
		}
		return this._shouldReleased.get(crc32)!
	}

	getPartCrc32(name: string): number {
		name = normalize(name)
		let part = this.parts[name]
		let crc32 = part._data.crc32
		return crc32
	}

	release(): void {
		for(let [, url] of this._shouldReleased){
			globalThis.URL.revokeObjectURL(url)
		}
	}

	getObjectPart(name: string): CheerioStatic | null {
		name = normalize(name)
		const part = this.parts[name]
		if(!part)
			return null
		else if(part.cheerio)
			return part as unknown as CheerioStatic
		else{
			const $ = Object.assign(this.parts[name] = (this.constructor as any).parseXml(part.asText()), {part: name}) as CheerioStatic
			Object.assign($.root()[0].attribs, {part: name})
			$.prototype.part = () => name
			return $
		}
	}

	$(node: any): any {
        const root = (a: any): any => a.root || (a.parent && root(a.parent))
		const partName = root(node).attribs.part;
		const part = this.getObjectPart(partName);
		return part ? part(node) : null;
    }

	parse(domHandler?: any): any {

	}

	render(): any {

	}

	serialize(): JSZip {
		let newDoc = new JSZip()
		Object.keys(this.parts).forEach(path => {
			let part = this.parts[path]
			if(part.cheerio){
				newDoc.file(path, part.xml())
			}else{
				newDoc.file(path, part._data, part.options)
			}
		})
		return newDoc
	}

	save(file?: string, options?: any): Promise<Buffer> | void {
		file = file || this.props.name || `${Date.now()}.docx`

		let newDoc = this.serialize()

		if(typeof(globalThis.document) != "undefined" && globalThis.URL && globalThis.URL.createObjectURL){
			let data = newDoc.generate({...options, type: "blob", mimeType: (this.constructor as any).mime})
			let url = globalThis.URL.createObjectURL(data)
			let link = globalThis.document.createElement("a");
			globalThis.document.body.appendChild(link)
			link.download = file
			link.href = url;
			link.click()
			globalThis.document.body.removeChild(link)
			globalThis.URL.revokeObjectURL(url)
		}else{
			let data = newDoc.generate({...options, type: "nodebuffer"})
			return new Promise((resolve, reject) =>
				require("f"+"s").writeFile(file, data, (error: any) => {
					error ? reject(error) : resolve(data)
				})
			)
		}
	}

	clone(props?: DocumentProps): ZipDocument {
		let zip = new JSZip()
		let propsCopy = props ? JSON.parse(JSON.stringify(this.props)) : props
		let parts = Object.keys(this.parts).reduce((state: Parts, k: string) => {
			let v = this.parts[k]
			if(v.cheerio){
				zip.file(v.name, v.xml(), v.options)
				state[k] = zip.file(v.name)!
			}else{
				zip.file(v.name, v._data, v.options)
				state[k] = zip.file(v.name)!
			}
			return state
		}, {})
		return new (this.constructor as any)(parts, zip, propsCopy || this.props)
	}

	/**
	 *  a helper to load document file

	 *  @param inputFile {File} - a html input file, or nodejs file
	 *  @return {Promise}
	 */

	static load(inputFile: File | string | Buffer | ArrayBuffer | Uint8Array | ZipDocument): Promise<ZipDocument> {
		const DocumentSelf = this

		if(inputFile instanceof ZipDocument)
			return Promise.resolve(inputFile)

		return new Promise((resolve, reject) => {
			function parse(data: Buffer | ArrayBuffer | Uint8Array, props: DocumentProps = {}): void {
				try{
					let raw = new JSZip(data), parts: Parts = {}
					raw.filter((path: string, file: any) => parts[path] = file)
					resolve(new DocumentSelf(parts, raw, props))
				}catch(error){
					reject(error)
				}
			}

			if(typeof inputFile == 'string'){ //file name
				require('fs').readFile(inputFile, function(error: any, data: Buffer){
					if(error)
						reject(error);
					else if(data){
						parse(data, {name: inputFile.split(/[\/\\]/).pop()!.replace(/\.docx$/i,'')})
					}
				})
			}else if(inputFile instanceof Blob){
				var reader = new FileReader();
				reader.onload = function(e: any){
					parse(e.target.result, (inputFile.name ? {
							name: inputFile.name.replace(/\.docx$/i,''),
							lastModified: inputFile.lastModified,
							size: inputFile.size
						} : {size: inputFile.size}))
				}
				reader.readAsArrayBuffer(inputFile);
			}else {
				parse(inputFile as Buffer | ArrayBuffer | Uint8Array)
			}
		})
	}

	static create(): Promise<ZipDocument> {
		return this.load(`${__dirname}/../templates/blank.${this.ext}`)
	}

	static parseXml(data: string): CheerioStatic | null {
		try{
			let opt = {xmlMode: true, decodeEntities: false}
			let handler = new ContentDomHandler(opt)
			new Parser(handler, opt).end(data)
			let parsed = cheer.load(handler.dom, opt) as CheerioStatic
			if(typeof(parsed.cheerio) == "undefined")
				parsed.cheerio = "customized"
			return parsed
		}catch(error){
			console.error(error)
			return null
		}
	}
}

class ContentDomHandler extends DomHandler {
	public dom: any[];
	
	constructor(options: any) {
		super(options);
		this.dom = [];
	}
	
	_addDomElement(el: any): void {
		if(el.type == "text" && (el.data[0] == '\r' || el.data[0] == '\n')) {
			//remove format whitespaces
		} else {
			// Call parent method if it exists
			// Note: This is a workaround for the DomHandler type issue
		}
	}
}
