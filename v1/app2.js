const childProcess = require("child_process");
const stream = require("stream");
const express = require("express");
var app = express();

var JpegReceived = 0;

var run = false;

app.post("/upload", function(req, res) {

	// req.socket.setTimeout(10000000);

	console.log("/upload");
	// console.log(req);

	Socket = req.socket;

	Socket.on("readable", async function() {
		if (!run) {
			ffmpegRun(Socket);
			run = true;
		}

	});

	Socket.on("error", function(err) {
		console.log("Error:", err);
	});

	Socket.on("end", function(data) {
		console.log("End:", data);
	});

	Socket.on("close", function(data) {
		console.log("Close:", data);
	});

	// mmjpegStream.pipe(req);
	// console.log(req.socket);
	// req.pipe(mjpegStream);
	// ffmpegRun(mjpegStream);
});

app.post("*", function(req, res) {
	// console.log("all", req);
});

app.listen(4000, function() {
	console.log("Ready");
});

async function ffmpegRun(Socket) {
	var mjpegStream = new stream.PassThrough();

	var banana = childProcess.spawn("C:/Users/User/Desktop/Server/new/ffmpeg/bin/ffmpeg.exe", [
		"-y",
		"-f",
		"image2pipe",
		"-s",
		"800x480",
		"-framerate",
		"10",
		"-pix_fmt",
		"yuv420p",
		"-i",
		"-",
		"-vcodec",
		"mpeg4",
		"-shortest",
		"C:/Users/User/Desktop/video.mp4"
	]);

	// banana.stdout.on("data", function(data) {
	// 	console.log(data.toString());
	// });
	// banana.stderr.on("data", function(data) {
	// 	console.log(data.toString());
	// });
	banana.on("close", function(code) {
		console.log("Done code:", code);
	});

	mjpegStream.pipe(banana.stdin);
			
	async function tick() {
	// while (true) {
		try {
			var len = await new Promise(function(resolve, reject) {
				var interval = setInterval(function() {
					// if (!len || len.length != 10) {
					// 	len += Socket.read(10 - len.length).toString();
					// }
					// if (len.length == 10) {
					// 	clearInterval(interval);
					// 	resolve(len);
					// 	return len;
					// 	console.log(len);
					// }
					var len = Socket.read(10);
					if (len) {
						clearInterval(interval);
						return resolve(len.toString());
					}
				}, 1000 / 30);
			});
			console.log("Read:", len);
			len = parseInt(len);
			// console.log("read:", read.length, "need-len:", 10);
			console.log("new Image: " + len);

			var image = await new Promise(function(resolve, reject) {
				var interval = setInterval(function() {
					// if (!img || img.length != Socket.len) {
					// 	img += Socket.read(Socket.len - img.length);
					// }
					// if (img.length == Socket.len) {
					// 	clearInterval(interval);
					// 	resolve(img);
					// }
					var img = Socket.read(len);
					if (img) {
						clearInterval(interval);
						return resolve(img);
					}
				}, 1000 / 30);
			});
			console.log("Image:", image);
			// console.log("image:", image.length, "need-len:", Socket.len);
			mjpegStream.write(image, "utf8");

			console.log("JpegReceived:", JpegReceived);
			JpegReceived += 1;
			if (JpegReceived > 5) {
				console.log("Ending..");
				mjpegStream.end();
				Socket.end();
				Socket.destroy();
				return;
				// break;
				// resolve();
			}
		} catch {}
		setTimeout(tick, 1000 / 30);
	}

	tick();
}