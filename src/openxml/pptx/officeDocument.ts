import Base from "../officeDocument"

export default class extends Base {
	_init(): void {
		super._init()
		// Add pptx-specific initialization logic here
	}

	render(createElement: any, identify: any = (this.constructor as any).identify.bind(this.constructor)): any {
		// Add pptx-specific rendering logic here
		return this.renderNode(this.content("p:presentation").get(0), createElement, identify)
	}

	parse(domHandler: any, identify: any = (this.constructor as any).identify.bind(this.constructor)): any {
		const createElement = domHandler.createElement.bind(domHandler)
		function _identify(...args: any[]): any {
			let model = identify(...args)
			if(model && typeof(model) == "object"){
				domHandler.emit("*", model, ...args)
				domHandler.emit(model.type, model, ...args)
				if(domHandler[`on${model.type}`])
					domHandler[`on${model.type}`](model, ...args)
			}
			return model
		}

		return this.renderNode(this.content("p:presentation").get(0), createElement, _identify)
	}

	static identities: {[key: string]: Function} = {
		// Add pptx-specific identities here
	}
}
