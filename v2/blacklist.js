import log from "./logger.js";
import fs from "fs";

const BlacklistFile = "./blacklist.json";

const maxWarning = 5;

export default class Blacklist {

	static Warning = [];

	static Banned = [];

	static getWarn() {
		try {
			return this.Warning;
		} catch (e) {
			log.error(e);
		}
	}

	static getBan() {
		try {
			return this.Banned;
		} catch (e) {
			log.error(e);
		}
	}

	static warn(id) {
		try {
			if (!this.Banned.includes(id)) {
				if (!this.Warning[id]) {
					this.Warning[id] = 0;
				}
				this.Warning[id] += 1;
				if (this.Warning[id] >= maxWarning) {
					this.unWarn(id);
					this.ban(id);
				}
			}
		} catch (e) {
			log.error(e);
		}
	}

	static unWarn(id) {
		try {
			if (this.Warning[id]) {
				delete this.Warning[id];
			}
		} catch (e) {
			log.error(e);
		}
	}

	static ban(id) {
		try {
			if (!this.Banned.includes(id)) {
				this.Banned.push(id);
			}
		} catch (e) {
			log.error(e);
		}
	}

	static unBan(id) {
		try {
			if (this.Banned.includes(id)) {
				this.Banned.splice(this.Banned.indexOf(id), 1);
			}
		} catch (e) {
			log.error(e);
		}
	}

	static verifyWarn(id) {
		try {
			if (this.Warning[id]) {
				return this.Warning[id];
			} else {
				return false;
			}
		} catch (e) {
			log.error(e);
		}
	}

	static verifyBan(id) {
		try {
			if (this.Banned.includes(id)) {
				return true;
			} else {
				return false;
			}
		} catch (e) {
			log.error(e);
		}
	}

	static updateFromFile() {
		try {
			if (fs.existsSync(BlacklistFile)) {
				var json = JSON.parse(fs.readFileSync(BlacklistFile));
				this.Warning = json.Warning;
				this.Banned = json.Banned;
			} else {
				this.Warning = {};
				this.Banned = [];
			}
		} catch (e) {
			log.error(e);
		}
	}

	static updateFile() {
		try {
			fs.writeFileSync(BlacklistFile, JSON.stringify({
				Warning: this.Warning,
				Banned: this.Banned
			}, null, "\t"));
		} catch (e) {
			log.error(e);
		}
	}
}