import Server from "./server.js";
import colors from "./colors.js";
import fetch from "node-fetch";
import log from "./logger.js";
import loader from "./loader.js";

const Port = 4000;

var server = new Server();

server.get("/", function(req, res) {
	try {
		
	} catch {
		log.error();
	}
});

server.Start(function() {
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