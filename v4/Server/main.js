import url from "url";
import Server from "./server.js";
import Handler from "./handler.js";
import colors from "./colors.js";
import fetch from "node-fetch";
import log from "./logger.js";
import loader from "./loader.js";
import Encoder from "./encoder.js";

const Port = 4020;

// const startTime = ;
// const stopTime = ;

var server = new Server();

server.post("/upload", function(req, res) {
	try {
		var dirName = (new url.URL("./videos/", import.meta.url).pathname).slice(1);
		var fileName = Buffer.from((new Date()).toLocaleString().replaceAll("/", "-"), "utf-8").toString("hex");

		var encoder = new Encoder(dirName, fileName);
		var handler = new Handler(req.socket, function(frame) {
			try {
				console.log("OnFrame: ", frame.length);
				encoder.write(frame);
			} catch (e) {
				log.error(e);
			}
		}, function() {
			encoder.end();
		}, 30);
		handler.start();
	} catch (e) {
		log.error(e);
	}
});

server.get("/", function(req, res) {
	try {
		res.send("OK");
	} catch (e) {
		log.error(e);
	}
});

server.get("*", function(req, res) {
	try {
		res.status(404);
	} catch (e) {
		log.error(e);
	}
});

server.post("*", function(req, res) {
	try {
		res.status(404);
	} catch (e) {
		log.error(e);
	}
});

server.start(Port, function() {
	try {
		log.write("Starting Server");
		loader.start("Starting Server");
		fetch("https://ifconfig.me/", {headers: {"User-Agent": ""}}).then(function(res) {
			res.text().then(function(ip) {
				loader.stop("Server Running on " + colors.make("http://" + ip + ":" + Port, colors.FgCyan));
			});
		});
	} catch {
		loader.stop("Server Running on " + colors.make("http://0.0.0.0:" + Port, colors.FgCyan));
	}
});