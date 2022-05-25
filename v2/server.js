import bodyParser from "body-parser";
import express from "express";
import log from "./logger.js";

export default class Server {
	
	constructor() {
		try {
			this.app = express();
			this.app.use(bodyParser.json());
		} catch (e) {
			log.error(e);
		}
	}

	Start(port, fun) {
		try {
			this.onStartingFun();
			this.server = this.app.listen(this.port, fun);
		} catch (e) {
			log.error(e);
		}
	}
	
	Stop(fun) {
		try {
			this.server.close(fun);
		} catch (e) {
			log.error(e);
		}
	}

	get(url, fun) {
		try {
			this.app.get(url, fun);
		} catch (e) {
			log.error(e);
		}
	}

	post() {
		try {
			this.app.post(url, fun);
		} catch (e) {
			log.error(e);
		}
	}
}