import Crypto from "./crypto.js";

var c = new Crypto("edc182d2de2f977d", "2af828e5f6f4d71b");

console.log(c.encrypt("banana"));