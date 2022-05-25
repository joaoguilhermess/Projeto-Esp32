// import auth from "./auth.js";
import crypto from "./crypto.js";
import {randomBytes} from "crypto";

var a = new crypto();

var text = "Aporrajamsoft";
console.log(text);

var Aenc = a.encrypt(text);

var b = new crypto();

console.log(b.key, b.iv);

var text = "Bporrajamsoft";
console.log(text);

var Benc = b.encrypt(text);

console.log(Benc);

// var denc = b.decrypt(Aenc);

// console.log(denc);

// auth.createKeys();

// console.log(auth.verify(Benc));