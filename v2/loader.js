import log from "./logger.js";
import colors from "./colors.js";

const steps = [".", "..", "...", ".."];

function padding(len) {
	var pad = "";
	for (var i = 0; i < len; i++){
		pad += " ";
	}
	return pad;
}

export default class loader {
	
	static interval = null;
	static index = 0;

	static text;

	static start(text, delay = 250) {
		this.text = text;
		try {
			var self = this; 
			this.interval = setInterval(function() {
				process.stdout.clearLine();
				process.stdout.write("\r" + colors.make(text, colors.FgBlack, colors.Bright) + steps[self.index]);
				self.index += 1;
				self.index &= steps.length - 1;
			}, delay);
		} catch (e) {
			log.error(e);
		}
	}

	static stop(text) {
		try {
			process.stdout.clearLine();
			process.stdout.write("\r" + text + ";\n");
			clearInterval(this.interval);
		} catch (e) {
			log.error(e);
		}
	}
}