interface VMLOptions {
	shapetype: (xml: any) => any;
	path: () => any;
	shape: (xml: any) => any;
}

export default (officeDocument: any): VMLOptions => ({
	shapetype(xml: any): any {

	},

	path(): any {

	},

	shape(xml: any): any {

	}
})
