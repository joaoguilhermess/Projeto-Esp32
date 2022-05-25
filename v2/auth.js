import Crypto from "./crypto.js";
import log from "./logger.js";
import fs from "fs";

const AuthFile = "./auth.json";

export default class Auth {

	static UploaderCrypto;
	static ClientCrypto;
	static AdminCrypto;

	static createKeys() {
		try {
			this.UploaderCrypto = new Crypto();
			this.ClientCrypto = new Crypto();
			this.AdminCrypto = new Crypto();
		} catch (e) {
			log.error(e);
		}
	}

	static getKeys() {
		try {
			return {
				Uploader: {key: this.UploaderCrypto.key, iv: this.UploaderCrypto.iv},
				Client: {key: this.ClientCrypto.key, iv: this.ClientCrypto.iv},
				Admin: {key: this.AdminCrypto.key, iv: this.AdminCrypto.iv}
			};
		} catch (e) {
			log.error(e);
		}
	}

	static verify(text) {
		try {
			if (this.UploaderCrypto.verify(text)) {
				return {type: "Uploader"};
			} else if (this.ClientCrypto.verify(text)) {
				return {type: "Client"};
			} else if (this.AdminCrypto.verify(text)) {
				return {type: "Admin"};
			}
			return {type: undefined};
		} catch (e) {
			log.error(e);
		}
	}

	static updateFromFile() {
		try {
			if (fs.existsSync(AuthFile)) {
				var json = JSON.parse(fs.readFileSync(AuthFile));
				this.UploaderCrypto = new Crypto(json.Uploader.key, json.Uploader.iv);
				this.ClientCrypto = new Crypto(json.Uploader.key, json.Uploader.iv);
				this.AdminCrypto = new Crypto(json.Uploader.key, json.Uploader.iv);
			} else {
				this.UploaderCrypto = new Crypto();
				this.ClientCrypto = new Crypto();
				this.AdminCrypto =  new Crypto();
			}
		} catch (e) {
			log.error(e);
		}
	}

	static updateFile() {
		try {
			fs.writeFileSync(AuthFile, JSON.stringify(this.getKeys(), null, "\t"));
		} catch (e) {
			log.error(e);
		} 
	}
}