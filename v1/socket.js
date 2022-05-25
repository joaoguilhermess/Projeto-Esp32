const childProcess = require("child_process");
const stream = require("stream");
const fs = require("fs");
const net = require("net");

var JpegReceived = 0;
const JpegPath = "images\\";

var Server = net.createServer();

var JpegStream = new stream.PassThrough();

var run = false;

Server.on("connection", async function(Socket) {
	console.log("New Socket connected");

	Socket.JpegOrLength = true;

	Socket.on("readable", async function() {
		console.log("Readable");
		if (Socket.JpegOrLength) {
			var len = "";
			var read = Socket.read(10 - len.length);
			if (read) {
				len += read.toString();
			}
			Socket.len = parseInt(len);
			console.log("new Image: " + len);
		} else {
			var image = await Socket.read(Socket.len);
			if (image) {
				// fs.writeFileSync(JpegPath + JpegReceived + ".jpeg", image);

				JpegStream.write(image, "utf8");

				if (!run) {
					ffmpegRun(JpegStream);
					run = true;
				}
			}
			JpegReceived += 1;
			if (JpegReceived > 30) {
				console.log("Ending");
				JpegStream.end();
				Socket.end();
				Socket.destroy();
			}
		}
		Socket.JpegOrLength = !Socket.JpegOrLength;
	});

	Socket.on("error", function(err) {
		console.log("Error:", err);
	});

	Socket.on("end", function(data) {
		console.log("End:", data);
	});

	Socket.on("close", function(err) {
		console.log("Close:", err);
	});
});

Server.on("listening", function() {
	console.log("Listening on: " + 4001);
});

Server.maxConnections = 2;

Server.listen(4001);

function ffmpegRun(stream) {
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

	stream.pipe(banana.stdin);
}