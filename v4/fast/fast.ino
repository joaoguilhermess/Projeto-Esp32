#include <Arduino.h>;
#include "constants.cpp";
#include "socket.cpp";
#include "camera.cpp";
#include "wifi.cpp";
// #include "crypto.cpp";

Socket* socket;
// Crypto* crypto;

int Frames = 0;

void setup() {
	try {
		Serial.begin(115200);
		
		if (!Wifi::Verify()) {
			Wifi::Connect();
		}

		socket = new Socket(HostName, HostPort);
		socket->Connect();

		// crypto = new Crypto((unsigned char* )Key, (unsigned char* )Iv);

		// Serial.print("encrypt: ");
		// Serial.println((char* )crypto->Encrypt((unsigned char* ) "banana"));
	} catch (const String &e) {
		Serial.print("Error: ");
		Serial.println(e);
	}
}

void loop() {
	// return delay(2000);
	try {
		if (!Wifi::Verify()) {
			Wifi::Connect();
		}
		if (!socket->Verify()) {
			socket->Connect();
		}

		// unsigned char* A = socket->ReadBuffer();
		String A = socket->Read();
		// unsigned char* B = crypto->Decrypt(A);
		// String str = String((char* )B);
		if (A == NULL) {
			return;
		}

		// String str = String((char* )A);
		if (A != "frame") {
			return;
		}

		// camera_fb_t* frame = Camera::GetFrame();

		camera_fb_t* frame = NULL; 
		frame = esp_camera_fb_get();
		if (!frame) {
			Serial.println("getFrame failed");
			RestartEsp32();
		}

		// unsigned char* encryptedFrame = crypto->Encrypt((unsigned char* )frame->buf);
		// int encryptedLength = sizeof(encryptedFrame);

		// String length = String(encryptedLength);
		// while (length.length() < 10) {
		// 	length = "0" + length;
		// }
		// Serial.print("EncryptedFrame length: ");
		// Serial.println(length);

		// socket->Print(length);

		// for (size_t i = 0; i < encryptedLength; i += chunk) {
		// 	if (i + chunk < encryptedLength) {
		// 		socket->WriteBuffer(encryptedFrame, chunk);
		// 		encryptedFrame += 1024;
		// 	} else if (encryptedLength % 1024 > 0) {
		// 		socket->WriteBuffer(encryptedFrame, encryptedLength & 1024);
		// 	}
		// }

		int FrameLength = sizeof(frame);

		String length = String(Frames);
		while (length.length() < 10) {
			length = "0" + length;
		}
		Serial.print("Frame length: ");
		Serial.println(length);

		socket->Print(length);

		for (size_t i = 0; i < FrameLength; i += chunk) {
			if (i + chunk < FrameLength) {
				socket->WriteBuffer((unsigned char* )frame->buf, chunk);
				frame += 1024;
			} else if (FrameLength % 1024 > 0) {
				socket->WriteBuffer((unsigned char* )frame->buf, FrameLength & 1024);
			}
		}
		Frames += 1;
		
		// Camera::ReturnFrame(frame);

		esp_camera_fb_return(frame);

		Serial.print("Frame index: ");
		Serial.println(Frames);

		Serial.println("");
	} catch (const String &e) {
		Serial.print("Error: ");
		Serial.println(e);
	}
}