import log from "./logger.js";

export default class Clients {
	
	static Logged = [];

	static getLogged() {
		try {
			return this.Logged;
		} catch (e) {
			log.error(e);
		}
	}

	static verifyLogin(id) {
		try {
			if (this.Logged.includes(id)) {
				return true;
			} else {
				return false;
			}
		} catch (e) {
			log.error(e);
		}
	}

	static login(id) {
		try {
			if (!this.Logged.includes(id)) {
				this.Logged.push(id);
			}
		} catch (e) {
			log.error(e);
		}
	}

	static logout(id) {
		try {
			if (this.Logged.includes(id)) {
				this.Logged.splice(this.Logged.indexOf(id), 1);
			}
		} catch (e) {
			log.error(e);
		}
	}
}