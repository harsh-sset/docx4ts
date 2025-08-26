export interface XmlObject {
	get(path: string, defaultValue?: any): any;
	set(path: string, value: any): void;
	has(path: string): boolean;
}

export function getable(obj: any): XmlObject {
	if (obj && typeof obj.get === 'function') {
		return obj;
	}
	
	// Create a simple wrapper for objects that don't have get method
	return {
		get: (path: string, defaultValue?: any) => {
			const keys = path.split('.');
			let current = obj;
			
			for (const key of keys) {
				if (current && typeof current === 'object' && key in current) {
					current = current[key];
				} else {
					return defaultValue;
				}
			}
			
			return current;
		},
		set: (path: string, value: any) => {
			const keys = path.split('.');
			let current = obj;
			
			for (let i = 0; i < keys.length - 1; i++) {
				const key = keys[i];
				if (!(key in current) || typeof current[key] !== 'object') {
					current[key] = {};
				}
				current = current[key];
			}
			
			current[keys[keys.length - 1]] = value;
		},
		has: (path: string) => {
			const keys = path.split('.');
			let current = obj;
			
			for (const key of keys) {
				if (current && typeof current === 'object' && key in current) {
					current = current[key];
				} else {
					return false;
				}
			}
			
			return true;
		}
	};
}
