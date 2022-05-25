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

	start(port, fun) {
		try {
			this.server = this.app.listen(port, fun);
		} catch (e) {
			log.error(e);
		}
	}
	
	stop(fun) {
		try {
			this.server.close(fun);
		} catch (e) {
			log.error(e);
		}
	}

	get(url, fun) {
		try {
			this.app.get(url, function(req, res) {
				try {
					log.log("GET: " + req.url + " Address: " + req.socket.remoteAddress.toString());
					fun(req, res);
				} catch (e) {
					log.error(e);
				}
			});
		} catch (e) {
			console.log(e);
			log.error(e);
		}
	}

	post(url, fun) {
		try {
			this.app.post(url, function(req, res) {
				try {
					log.log("POST: " + req.url + " Address: " + req.socket.remoteAddress.toString());
					fun(req, res);
				} catch (e) {
					log.error(e);
				}
			});
		} catch (e) {
			log.error(e);
		}
	}
}