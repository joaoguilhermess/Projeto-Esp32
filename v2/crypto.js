import crypto from "crypto";
import log from "./logger.js";

const type = "aes-128-cfb";
// const type = "aes-256-cbc";
const textEncoding = "utf-8";
const encryptedEncoding = "base64";

export default class Crypto {

	constructor(key, iv) {
		try {
			if (key && iv) {
				this.key = key;
				this.iv = iv;
			} else {
				this.generate();
			}
		} catch (e) {
			log.error(e);
		}
	}

	generate() {
		try {
			// this.key = crypto.randomBytes(16).toString("hex");
			this.key = crypto.randomBytes(8).toString("hex");
			this.iv = crypto.randomBytes(8).toString("hex");
		} catch	(e) {
			log.error(e);
		}
	}

	encrypt(plainText) {
		try {
			var cipher = crypto.createCipheriv(type, this.key, this.iv);
			var encrypted = cipher.update(plainText, textEncoding, encryptedEncoding);

			return encrypted + cipher.final(encryptedEncoding);
		} catch (e) {
			log.error(e);
		}
	}

	decrypt(encryptedString) {
		try {
			var decipher = crypto.createDecipheriv(type, this.key, this.iv);
			var decrypted = decipher.update(encryptedString, encryptedEncoding, textEncoding);

			return decrypted + decipher.final(textEncoding);
		} catch (e) {
			log.error(e);
		}
	}

	verify(encryptedString) {
		try {
			var decipher = crypto.createDecipheriv(type, this.key, this.iv);
			var decrypted = decipher.update(encryptedString, encryptedEncoding, textEncoding);

			return decrypted + decipher.final(textEncoding);
		} catch (e) {
			return false;
		}
	}
}