import fs from "fs";

const logDir = "./logs/";

export default class logger {
	static file;

	static createDir() {
		try {
			if (!fs.existsSync(logDir)) {
				fs.mkdirSync(logDir);
				return true;
			} else {
				return false;
			}
		} catch (e) {
			console.error("Error on logger.createDir() ", e.stack.replaceAll("\n", "\t\n"));
		}
	}

 	static createFile() {
 		try {
 			if (!this.file) {
				this.file = new Date().toLocaleString().replaceAll("/", "-").replaceAll(":", "-") + ".txt";
				fs.writeFileSync(logDir + this.file, this.formatText("Logger Started;"));
			}
 		} catch (e) {
			console.error("Error on logger.createFile() ", e.stack.replaceAll("\n", "\t\n"));
		}
	}

	static formatText(text) {
		try {
			return new Date().toLocaleString() + " || " + text + "\n";
		} catch (e) {
			console.error("Error on logger.formatText() ", e.stack.replaceAll("\n", "\t\n"));
		}
	}

	static log(text) {
		try {
			this.createDir();
			this.createFile();
			
			var t = this.formatText(text);
			console.log(t);
			fs.appendFileSync(logDir + this.file, t);
		} catch (e) {
			console.error("Error on logger.log() ", e.stack.replaceAll("\n", "\t\n"));
		}
	}

	static write(text) {
		try {
			this.createDir();
			this.createFile();

			var t = this.formatText(text);
			fs.appendFileSync(logDir + this.file, t);
		} catch (e) {
			console.error("Error on logger.write() ", e.stack.replaceAll("\n", "\t\n"));
		}
	}

	static error(e) {
		try {
			this.createDir();
			this.createFile();

			var t = this.formatText("Error At: " + e.stack.split("file")[0].split(" ").reverse()[1] + "() " + e.stack);
			console.error(t);
			fs.appendFileSync(logDir + this.file, t);
		} catch (e) {
			console.error("Error on logger.error() ", e.stack.replaceAll("\n", "\t\n"));
		}
	}
}