import Base from "../document"
import OfficeDocument from "./officeDocument"

export default class extends Base {
	static ext: string = "pptx"

	static mime: string = "application/vnd.openxmlformats-officedocument.presentationml.presentation"

	static OfficeDocument = OfficeDocument
}
