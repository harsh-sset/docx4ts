declare module 'jszip' {
	class JSZip {
		constructor(data?: any);
		file(name: string, data?: any, options?: any): any;
		filter(callback: (path: string, file: any) => boolean): any;
		generate(options: any): any;
		remove(name: string): void;
	}
	export = JSZip;
}

declare module 'cfb' {
	export default class CFB {
		static parse(data: any): any;
	}
}
