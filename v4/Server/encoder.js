import url from "url";
import fs from "fs";
import childProcess from "child_process";
import Stream from "stream";
import log from "./logger.js";

const FFmpegPath = ((new url.URL("./ffmpeg/bin/ffmpeg.exe", import.meta.url).pathname).slice(1)).replaceAll("/", "\\");

export default class Encoder {
	
	constructor(dirName, fileName) {
		try {
			if (!fs.existsSync(dirName)) {
				fs.mkdirSync(dirName);
			}
			this.fileName = fileName + ".mp4";
			this.dirName = dirName;
			this.finalName = (this.dirName + this.fileName).replaceAll("/", "\\");
			this.stream = new Stream.PassThrough();

			log.log(FFmpegPath);
			log.log(this.finalName);

			this.encoder = childProcess.spawn(FFmpegPath, [
				"-y",
				"-f",
				"image2pipe",
				"-s",
				"800x600",
				"-framerate",
				"1",
				"-pix_fmt",
				"yuv420p",
				"-i",
				"-",
				"-vcodec",
				"h264",
				"-shortest",
				this.finalName
			]);

			log.log("Encoding New Vídeo: " + this.fileName);

			var context = this;
			
			this.encoder.on("close", function(code) {
				try {
					if (code == 0) {
						log.log("Vídeo: " + context.fileName + " Success!");
					} else {
						log.log("Vídeo: " + context.fileName + " Fail!");
					}
					log.log("Returned Code: " + code);
				} catch (e) {
					log.error(e);
				}
			});

			this.stream.pipe(this.encoder.stdin);
		} catch (e) {
			log.error(e);
		}
	}

	write(buffer) {
		try {
			this.stream.write(buffer, "utf-8");
		} catch (e) {
			log.error(e);
		}
	}

	end() {
		try {
			this.stream.end();
		} catch (e) {
			log.error(e);
		}
	}
}