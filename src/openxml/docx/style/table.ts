import Style from "./base"

export default class TableStyle extends Style {
	constructor(style: any, styles: any) {
		super(style, styles, "basedOn")
	}

	// Add table-specific methods here
	getTableProperties(): any {
		return this.get("tblPr")
	}

	getTableGrid(): any {
		return this.get("tblGrid")
	}

	getTableRowProperties(): any {
		return this.get("trPr")
	}

	getTableCellProperties(): any {
		return this.get("tcPr")
	}
}
