import log from "./logger.js";

async function wait(time) {
	await new Promise(function(resolve, reject) {
		setTimeout(resolve, time);
	});
}

export default class Handler {
	constructor(socket, onframe, onend, fps = 30) {
		try {
			var context = this;
			
			this.socket = socket;
			this.socket.on("close", function() {
				context.stop();
			});

			this.onframe = onframe;
			this.onend = onend;

			this.fps = fps;

			// this.crypto = new Crypto("edc182d2de2f977d", "2af828e5f6f4d71b");

			// this.socket.write(this.crypto.encrypt("frame"));
			

			var length; 
			var frame = Buffer.alloc(0);
			var last = 0;

			this.socket.on("data", async function(buffer) {
				try {
					if (!length) {
						length = Number(buffer.slice(0, 10).toString());
						buffer = buffer.slice(10);
					}
					if (frame.length < length) {
						frame = Buffer.concat([frame, buffer.slice(0, length - buffer.length)]);
					}
					if (frame.length == length) {

						try {
							context.onframe(frame);
						} catch (e) {
							log.error(e);
						}

						frame = Buffer.alloc(0);
						length = null;

						var w = Date.now() - last + (1000/context.fps);
						console.log(w);
						await wait(w);
						last = Date.now();

						socket.write("frame");
					}
				} catch (e) {
					log.error(e);
				}
			});
		} catch (e) {
			log.error(e);
		}
	}

	start() {
		try {
			if (this.socket) {
				this.socket.write("frame");
			}
		} catch (e) {
			log.error(e);
		}
	}

	stop() {
		try {
			log.log("Handler Stoped");
			this.onend();
			if (this.socket) {
				this.socket.destroy();
			}
		} catch (e) {
			log.error(e);
		}
	}
}