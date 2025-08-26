import Base from "../document"
import OfficeDocument from "./officeDocument"

export default class extends Base {
	static ext: string = "docx"
	
	static mime: string = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

	static OfficeDocument = OfficeDocument
}
