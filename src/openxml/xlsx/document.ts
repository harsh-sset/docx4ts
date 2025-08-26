import Base from "../document"
import OfficeDocument from "./officeDocument"

export default class extends Base {
	static ext: string = "xlsx"

	static mime: string = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

	static OfficeDocument = OfficeDocument
}
