const fs = require("fs");
const express = require("express");
var app = express();

var applesPath = "apples/";
var apples = fs.readdirSync(applesPath);
for (var i = 0; i < apples.length; i++) {
	apples[i] = fs.readFileSync(applesPath + apples[i]);
}
console.log(apples);

app.get("/", function(req, res) {
	console.log("GET /");

	res.sendFile(__dirname + "\\index.html");
});

app.get("/mjpeg", function(req, res) {
	console.log("GET /mjpeg");

	res.writeHead(200, {
		'Cache-Control': 'no-store, no-cache, must-revalidate, pre-check=0, post-check=0, max-age=0',
		Pragma: 'no-cache',
		Connection: 'close',
		'Content-Type': 'multipart/x-mixed-replace; boundary=--myboundary'
	});

	setInterval(function(res, apples) {
		var img = apples[Math.floor(Math.random() * apples.length)];
		res.write("--myboundary\nContent-Type: image/jpg\nContent-length: " + img.byteLength + "\n\n");
		res.write(img);
	}, 150, res, apples);
});

app.listen(4000, function() {
	console.log("Ready");
});