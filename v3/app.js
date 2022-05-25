const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const ffmpeg = require("fluent-ffmpeg");
const childProcess = require("child_process");
const express = require("express");
const stream = require("stream");
const http = require("http");
const fs = require("fs");
var app = express();

app.use(bodyParser.json());

app.use(cookieParser());

const FFmpegPath = __dirname + "\\ffmpeg\\bin\\ffmpeg.exe";
const FFprobePath = __dirname + "/ffmpeg/bin/ffprobe.exe";
const Port = 4000;
const VideosPath = __dirname + "\\" + "Videos\\";
const ThumbsPath = "Thumbs/";
const BackListFile = "blacklist.json";
const AuthFile = "auth.json";
const CameraConfigFile = "camera.json";
const TimeOutValue = 30 * 1000;

var auth;
try {
	auth = JSON.parse(fs.readFileSync(AuthFile));
} catch {
	auth = {
		Uploader: Buffer.from(crypto.randomBytes(24), "utf8").toString("hex"),
		Client: Buffer.from(crypto.randomBytes(16), "utf8").toString("hex"),
		Admin: Buffer.from(crypto.randomBytes(24), "utf8").toString("hex")
	};
	fs.writeFileSync(AuthFile, JSON.stringify(auth, null, "\t"));
}

var blacklist;

var Logged = {};

var uploadSocket;

var liveStreams = [];

// ready, start, pause, record, stop, disconnect
var state = "disconnect";

var mjpeg;

var Frames = 0;

var cameraConfig;
try {
	cameraConfig = JSON.parse(fs.readFileSync(CameraConfigFile));
} catch {
	cameraConfig = {
		Brightness:			 {index: 0, max: 2, min: -2, value: 0},
		Contrast:			 {index: 1, max: 2, min: -2, value: 0},
		Saturation:			 {index: 2, max: 2, min: -2, value: 0},
		Special_Effect:		 {index: 3, max: 6, min: 0, value: 0},
		Whitebal:			 {index: 4, max: 1, min: 0, value: 0},
		Awb_Gain:			 {index: 5, max: 1, min: 0, value: 0},
		Wb_Mode:			 {index: 6, max: 4, min: 0, value: 0},
		Exposure_Control:	 {index: 7, max: 1, min: 0, value: 0},
		Aec2:				 {index: 8, max: 1, min: 0, value: 0},
		Ae_Level:			 {index: 9, max: 2, min: -2, value: 0},
		Aec_Value:			 {index: 10, max: 1200, min: 0, value: 0},
		Gain_Control:		 {index: 11, max: 1, min: 0, value: 0},
		Agc_Gain:			 {index: 12, max: 30, min: 0, value: 0},
		Gainceiling:		 {index: 13, max: 6, min: 0, value: 0},
		Bpc:				 {index: 14, max: 1, min: 0, value: 0},
		Wpc:				 {index: 15, max: 1, min: 0, value: 0},
		Raw_gma:			 {index: 16, max: 1, min: 0, value: 0},
		Lenc:				 {index: 17, max: 1, min: 0, value: 0},
		XMirror:			 {index: 18, max: 1, min: 0, value: 0},
		YMirror:			 {index: 19, max: 1, min: 0, value: 0},
		Dcw:				 {index: 20, max: 1, min: 0, value: 0},
		Color_bar:			 {index: 21, max: 1, min: 0, value: 0}
	};
	fs.writeFileSync(CameraConfigFile, JSON.stringify(cameraConfig, null, "\t"));
}

ffmpeg.setFfprobePath(FFprobePath);

app.get("/", function(req, res) {
	console.log("GET: " + req.url, " IP: " + req.socket.remoteAddress.toString());

	// if (Logged[req.cookies.session]) {
	// 	res.sendFile(__dirname + "\\index.html");
	// }
	res.sendFile(__dirname + "\\index.html");
});

app.post("/login", function(req, res) {
	console.log("POST: " + req.url, " IP: " + req.socket.remoteAddress.toString());

	var ip = req.socket.remoteAddress.toString();

	if(!fs.existsSync(BackListFile)) {
		blacklist =	{
			"Warning": {},
			"Banned": {}
		};
	} else {
		try {
			blacklist = JSON.parse(fs.readFileSync(BackListFile));
		} catch {
			blacklist =	{
				"Warning": {},
				"Banned": {}
			};
		}
	}

	if (req.cookies != {}) {
		if (blacklist.Banned[ip]) {
			res.send({"message": "Your IP address has banned", "success": false, "admin": false});
		} else if (req.cookies.token != auth.Client && req.cookies.token != auth.Admin) {
			res.clearCookie("token");
			
			if (!blacklist.Warning[ip]) {
				blacklist.Warning[ip] = 0;
			}
			blacklist.Warning[ip] += 1;
			if (blacklist.Warning[ip] >= 5) {
				res.send({"message": "Your IP address has been banned", "success": false, "admin": false});
				blacklist.Banned[ip] = true;
				delete blacklist.Warning[ip];
			} else {
				res.send({"message": "You have " + (5 - blacklist.Warning[ip]) + " more chances to login", "success": false})
			}
		} else if (req.cookies.token == auth.Client) {
			if (Logged[req.cookies.session]) {
				res.send({"message": "You were already Logged", "success": true, "admin": false});
			} else {
				var session = crypto.randomUUID();
				res.cookie("session", session, {maxAge: 120 * 60 * 1000});
				Logged[session] = "client";
				res.send({"message": "You has been Logged", "success": true, "admin": false});
				if (blacklist.Warning[ip]) {
					delete blacklist.Warning[ip];
				}
			}
		} else if (req.cookies.token == auth.Admin) {
			if (Logged[req.cookies.session]) {
				res.send({"message": "You were already Logged as Admin", "success": true, "admin": true});
			} else {
				var session = crypto.randomUUID();
				res.cookie("session", session, {maxAge: 120 * 60 * 1000});
				Logged[session] = "admin";
				res.send({"message": "You has been Logged as Admin", "success": true, "admin": true});
				if (blacklist.Warning[ip]) {
					delete blacklist.Warning[ip];
				}
			}
		}
	}
	fs.writeFileSync(BackListFile, JSON.stringify(blacklist, null, "\t"));
});

app.get("/whitneymedium", function(req, res) {
	console.log("GET: " + req.url, " IP: " + req.socket.remoteAddress.toString());
	res.sendFile(__dirname + "\\whitneymedium.woff");
});

app.get("/videos", async function(req, res) {
	console.log("GET: " + req.url, " IP: " + req.socket.remoteAddress.toString());

	if (Logged[req.cookies.session]) {
		if (!fs.existsSync(VideosPath)) {
			fs.mkdirSync(VideosPath);
		}
		var files = fs.readdirSync(VideosPath);
		var list = [];
		for (var i = 0; i < files.length; i++) {
			var name = (VideosPath + files[i]).split("\\").join("/");
			var ffdata = await new Promise(function(resolve, reject) {
				ffmpeg.ffprobe((VideosPath + files[i]).split("\\").join("/"), function(err, data) {
					resolve(data);
				});
			});
			var fsdata = fs.statSync(VideosPath + files[i]);
			// console.log(name);
			if (ffdata && fsdata) {
				// console.log(ffdata);
				// console.log(fsdata);
				var args = ffdata.format.filename.split("/");
				list.push({
					"thumb": "/thumb/" + args[args.length - 1] + ".jpeg",
					"link": "/view/" + args[args.length - 1],
					"filename": args[args.length - 1],
					"creation": new Date(fsdata.birthtimeMs).toLocaleString(),
					"duration": new Date(0, 0, 0, 0, 0, ffdata.format.duration).toLocaleTimeString()
				});
			}
		}
		res.send(list);
	} else {
		res.redirect("/");
	}
});

app.get("/thumb/*", function(req, res) {
	console.log("GET: " + req.url, " IP: " + req.socket.remoteAddress.toString());

	if (Logged[req.cookies.session]) {
		var name = req.url.split("/")[2];
		if (!fs.existsSync(ThumbsPath)) {
			fs.mkdirSync(ThumbsPath);
		}
		if (fs.existsSync(ThumbsPath + name)) {
			res.sendFile(__dirname + "\\" + ThumbsPath + name);
		} else {
			res.sendFile(__dirname + "\\default.svg");
		}
	} else {
		res.redirect("/");
	}
});

app.get("/live", function(req, res) {
	console.log("GET: " + req.url, " IP: " + req.socket.remoteAddress.toString());

	if (Logged[req.cookies.session]) {
		if (state == "record") {
			res.writeHead(200, {
				"Cache-Control": "no-store, no-cache, must-revalidate, pre-check=0, post-check=0, max-age=0",
				Pragma: "no-cache",
				Connection: "close",
				"Content-Type": "multipart/x-mixed-replace; boundary=--Bruhdary"
			});

			liveStreams.push(res);

			req.on("end", function() {
				liveStreams.splice(liveStreams.indexOf(res), 1);
			});
		} else {
			res.sendFile(__dirname + "\\default.svg", {headers: {
				"Cache-Control": "no-store, no-cache, must-revalidate, pre-check=0, post-check=0, max-age=0",
				Pragma: "no-cache",
				Connection: "close"
			}});
		}
	} else {
		res.redirect("/");
	}
});

app.get("/view/*", function(req, res) {
	console.log("GET: " + req.url, " IP: " + req.socket.remoteAddress.toString());

	if (Logged[req.cookies.session]) {
		var name = req.url.split("/")[2].split("%20").join(" ");
		if (!fs.existsSync(VideosPath)) {
			fs.mkdirSync(VideosPath);
		}
		if (fs.existsSync(VideosPath + name)) {
			// console.log("exists", VideosPath + name);
			var stream = fs.createReadStream(VideosPath + name);
			stream.pipe(res);
			// req.on("end", function() {
				// stream.unpipe(res);
				// stream.end();
			// });
		} else {
			console.log("no exists: " + VideosPath + name);
		}
	} else {
		res.redirect("/");
	}
});

app.get("/camera", function(req, res) {
	// console.log("GET: " + req.url, " IP: " + req.socket.remoteAddress.toString());

	if (Logged[req.cookies.session]) {
		res.send(cameraConfig);
	} else {
		res.redirect("/");
	}
});

app.post("/camera", function(req, res) {
	console.log("POST: " + req.url, " IP: " + req.socket.remoteAddress.toString());
	// if (Logged[req.cookies.session] == "admin") {
	if (Logged[req.cookies.session]) {
		var name = req.body.name.split(" ").join("_");
		var value = req.body.value;
		if (cameraConfig[name] && value <= cameraConfig[name].max && value >= cameraConfig[name].min) {
			cameraConfig[name].value = value;
			if (state == "record") {
				var n = cameraConfig[name].index.toString(); 
				while (n.length < 2) {
					n = "0" + n;
				}
				var v = value.toString();
				while (v.length < 4) {
					v = "0" + v;
				}
				console.log(n, v);
				uploadSocket.write(Buffer.from(n + v, "utf8"));
				res.send({"message": req.body.name + " Config Saved!", "success": true});
			}
		} else {
			res.send({"message": "Settings Wrong!", "success": false});
		}
	} else {
		res.send({"message": "You not are Admin", "success": false});
	}
	fs.writeFileSync(CameraConfigFile, JSON.stringify(cameraConfig, null, "\t"));
});

app.get("/state", function(req, res) {
	// console.log("GET: " + req.url, " IP: " + req.socket.remoteAddress.toString());
	if (Logged[req.cookies.session]) {
		res.send(state);
	} else {
		res.redirect("/");
	}
});

app.post("/state", function(req, res) {
	console.log("POST: " + req.url, " IP: " + req.socket.remoteAddress.toString());
	if (Logged[req.cookies.session] == "admin") {
		if (["start", "pause", "stop"].includes(req.body.state)) {
			n = "22"
			var v = (["start", "pause", "stop"].indexOf(req.body.state)).toString();
			while (v.length < 4) {
				v = "0" + v;
			}
			console.log(n, v);
			// ready, start, pause, record, stop, disconnect
			if (state == "ready" && req.body.state == "start") {
				uploadSocket.write(Buffer.from(n + v, "utf8"));
				state = req.body.state;
				res.send({"message": "Upload Stream " + req.body.state, "success": true});
			} else if (state == "record" && req.body.state == "pause") {
				uploadSocket.write(Buffer.from(n + v, "utf8"));
				state = req.body.state;
				res.send({"message": "Upload Stream " + req.body.state, "success": true});
			} else if (state == "record" && req.body.state == "stop") {
				uploadSocket.write(Buffer.from(n + v, "utf8"));
				state = req.body.state;
				res.send({"message": "Upload Stream " + req.body.state, "success": true});
			} else if (state == "pause" && req.body.state == "start") {
				uploadSocket.write(Buffer.from(n + v, "utf8"));
				state = req.body.state;
				res.send({"message": "Upload Stream " + req.body.state, "success": true});
			} else if (state == "pause" && req.body.state == "stop") {
				uploadSocket.write(Buffer.from(n + v, "utf8"));
				state = req.body.state;
				res.send({"message": "Upload Stream " + req.body.state, "success": true});
			} else {
				res.send({"message": "The Uploader State is wrong", "success": false});
			}
		} else if (state == "disconnect") {
			res.send({"message": "The Uploader is Current Disconnected", "success": false});
		}
		
	} else {
		res.send({"message": "You not are Admin", "success": false});
	}
});

app.get("/auth", function(req, res) {
	console.log("GET: " + req.url, " IP: " + req.socket.remoteAddress.toString());
	if (Logged[req.cookies.session] == "admin") {
		res.send([{"name": "Uploader", "key": auth.Uploader}, {"name": "Client", "key": auth.Client}, {"name": "Admin", "key": auth.Admin}]);
	} else {
		res.redirect("/");
	}
});

app.post("/auth", function(req, res) {
	console.log("POST: " + req.url, " IP: " + req.socket.remoteAddress.toString());
	if (Logged[req.cookies.session] == "admin") {
		auth = {
			Uploader: Buffer.from(crypto.randomBytes(24), "utf8").toString("hex"),
			Client: Buffer.from(crypto.randomBytes(16), "utf8").toString("hex"),
			Admin: Buffer.from(crypto.randomBytes(24), "utf8").toString("hex")
		};
		fs.writeFileSync(AuthFile, JSON.stringify(auth, null, "\t"));
		res.send({"message": "Admin token copied to Clipboard!", token: auth.Admin, "success": true});
	} else {
		res.send({"message": "You not are Admin", "success": false});
	}
});
app.get("/blacklist", function(req, res) {
	console.log("GET: " + req.url, " IP: " + req.socket.remoteAddress.toString());
	if (Logged[req.cookies.session] == "admin") {
		var Flist = {Warning: [], Banned: []};
		var Wlist = Object.keys(blacklist.Warning);
		for (var i = 0; i < Wlist.length; i++) {
			Flist.Warning.push({"ip": Wlist[i], "value": blacklist.Warning[Wlist[i]]});
		}
		var Blist = Object.keys(blacklist.Banned);
		for (var i = 0; i < Blist.length; i++) {
			Flist.Banned.push(Blist[i]);
		}
		res.send(Flist);
	} else {
		res.redirect("/");
	}
});


app.post("/blacklist", function(req, res) {
	console.log("POST: " + req.url, " IP: " + req.socket.remoteAddress.toString());
	if (Logged[req.cookies.session] == "admin") {
		if (blacklist.Warning[req.body.Unwarn]) {
			res.send({"message": "ip: " + req.body.Unwarn + " Unwarnned!", "success": true});
		} else if (blacklist.Banned[req.body.Unban]) {
			res.send({"message": "ip: " + req.body.Unwarn + " Unbanned!", "success": true});
		}
	} else {
		res.send({"message": "You not are Admin", "success": false});
	}
});

app.post("/upload", function(req, res) {
	console.log("POST: " + req.url, " IP: " + req.socket.remoteAddress.toString());

	if(!fs.existsSync(BackListFile)) {
		blacklist =	{
			"Warning": {},
			"Banned": {}
		};
	} else {
		try {
			blacklist = JSON.parse(fs.readFileSync(BackListFile));
		} catch {
			blacklist =	{
				"Warning": {},
				"Banned": {}
			};
		}
	}

	uploadSocket = req.socket;

	state = "ready";

	if (req.cookies != {}  || req.cookies.token) {
		if (req.cookies.token == auth.Uploader) {
			
			// uploadSocket.on("error", function(err) {
			// 	console.log("Error:", err);
			// });

			// uploadSocket.on("end", function(data) {
			// 	console.log("End:", data);
			// });

			uploadSocket.on("close", function(err) {
				console.log("Uploader Socket Closed");
				state = "disconnect";
			});

			var savedThumb = false;

			function tick0() {
				// console.log("tick0", state);
				if (state == "start") {
					state = "record";
					var name = Buffer.from((new Date()).toLocaleString().split("/").join("-"), "utf-8").toString("hex");
					
				 	mjpeg = new stream.PassThrough();

					if (!fs.existsSync(VideosPath)) {
						fs.mkdirSync(VideosPath);
					}

					var Encoder = childProcess.spawn(FFmpegPath, [
						"-y",
						"-f",
						"image2pipe",
						"-s",
						"800x600",
						"-framerate",
						"15",
						"-pix_fmt",
						"yuv420p",
						"-i",
						"-",
						"-vcodec",
						"h264",
						"-shortest",
						VideosPath.split("\\").join("/") + name + ".mp4"
					]);
					
					console.log(VideosPath + name + ".mp4");

					console.log("Receiving New Video: " + name + ".mp4");

					Encoder.on("close", function(code) {
						state = "ready";
						if (code == 0) {
							console.log("Video: " + name + " Saved!");
						} else {
							console.log("Video: " + name + " Save Failed!");
							console.log("Encoder Returned Code: " + code);
						}
					});

					mjpeg.pipe(Encoder.stdin);

					var ticked = false;

					async function tick() {

						if (state == "pause") {
							return setTimeout(tick, 1000 / 10);
						} else {
							// console.log("tick");
							var len = parseInt(await new Promise(function(resolve, reject) {
								var startTime = Date.now();
								function tick1() {
									if (Date.now() - startTime > TimeOutValue) {
										state = "pause";
										console.log("tick1 Timeout");
										return resolve(false);
									}
									// console.log("tick1");
									var read = uploadSocket.read(10);
									if (read) {
										return resolve(read.toString("utf8"));
									}
									// console.log(read, "tick1", state);
									if (state == "record") {
										return setTimeout(tick1, 1000 / 30);
									} else {
										// console.log("tick1", state);
										return resolve(false);
									}
								}
								setTimeout(tick1, 0);
							}));

							// console.log("LEN :", len);

							if (len) {
								var image = await new Promise(function(resolve, reject) {
									var startTime = Date.now();
									function tick2() {
										if (Date.now() - startTime > TimeOutValue) {
											state = "pause";
											console.log("tick2 Timeout");
											return resolve(false);
										}
										// console.log("tick2");
										var read = uploadSocket.read(len);
										if (read) {
											return resolve(read);
										}
										// console.log(read, "tick2", state);
										if (state == "record") {
											return setTimeout(tick2, 1000 / 30);
										} else {
											// console.log("tick2", state);
											return resolve(false);
										}
									}
									setTimeout(tick2, 0);
								});
							}

							// console.log("IMAGE :", image.length);

							if (image) {
								mjpeg.write(image, "utf8");
								if (!savedThumb) {
									savedThumb = true;
									fs.writeFileSync(ThumbsPath + name + ".mp4" + ".jpeg", image);
								}
								Frames += 1;

								for (var i = 0; i < liveStreams.length; i++) {
									liveStreams[i].write("--Bruhdary\nContent-Type: image/jpg\nContent-length: " + len + "\n\n");
									liveStreams[i].write(image, "utf8");
								}
							}

							// ticked = false;
							// console.log("IMAGE:", len, "State:", state);
							if (["stop", "disconnect"].includes(state)) {
								Frames = 0;
								mjpeg.end();
								uploadSocket.end();
								uploadSocket.destroy();
								for (var i = 0; i < liveStreams.length; i++) {
									liveStreams[i].end();
								}
								return state = "disconnect";
							} else if (state == "start") {
								state = "record";
								setTimeout(tick, 0);
							} else {
								setTimeout(tick, 0);
							}
							// if (state == "pause") {
							// 	return tick0();
							// }
						}
					}

					// tick();

					uploadSocket.on("readable", async function() {
						if (!ticked && state == "record") {
							ticked = true;
							setTimeout(tick, 0);
						}
					});
				} else {
					setTimeout(tick0, 1000);
				}
			}
			tick0();
		} else {
			var ip = req.socket.remoteAddress.toString();
			res.send({"message": "Your IP address has been banned", "success": false});
			blacklist.Banned[ip] = true;
			delete blacklist.Warning[ip];
		}
	} else {
		if (!blacklist.Warning[ip]) {
			blacklist.Warning[ip] = 0;
		}
		blacklist.Warning[ip] += 1;
		if (blacklist.Warning[ip] >= 5) {
			res.send({"message": "Your IP address has been banned", "success": false});
			blacklist.Banned[ip] = true;
			delete blacklist.Warning[ip];
		}
	}
	fs.writeFileSync(BackListFile, JSON.stringify(blacklist, null, "\t"));
});

app.get("*", function(req, res) {
	console.log("BAD GET: " + req.url, " IP: " + req.socket.remoteAddress.toString());
});

app.post("*", function(req, res) {
	console.log("BAD POST: " + req.url, " IP: " + req.socket.remoteAddress.toString());
});

app.listen(Port, function() {
	try {
		var request = http.get("http://ifconfig.me/", function(response) {
			response.on("data", function(res) {
				console.log("Listening on " + res.toString() + ":" + Port);
				console.log("Esp32 Authorization: " + auth.Uploader);
				console.log("Client Authorization: " + auth.Client);
				console.log("Admin Authorization: " + auth.Admin);
			});
		});
	} catch {
		console.log("Listening on 0.0.0.0:" + Port);
	}
});