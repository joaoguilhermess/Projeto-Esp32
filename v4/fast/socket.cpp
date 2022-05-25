#include <Arduino.h>;
#include <WiFi.h>;
#include "restart.cpp";
#include "constants.cpp";

class Socket {
private:
	char* host;
	int port;

	WiFiClient socket;
public:
	Socket(char* host, int port) {
		try {
			this->host = host;
			this->port = port;
		} catch (const String &e) {
			Serial.print("Error: ");
			Serial.println(e);
		}
	}

	void Connect() {
		try {
			if (!this->socket.connected()) {
				Serial.print("Trying to Connect on Server: ");
				Serial.print(this->host);
				Serial.print(":");
				Serial.println(this->port);

				while (!this->socket.connected()) {
					this->socket.connect(this->host, this->port);
					Serial.print(".");
					delay(DelayTime);
				}

				Serial.println("");
				Serial.println("Socket Connected");

				this->Println("POST /upload HTTP/1.1");
				this->Print("Host: ");
				this->Println(this->host);
				this->Println("Connection: close");
				this->Println("");
			}
		} catch (const String &e) {
			Serial.print("Error: ");
			Serial.println(e);
		}
	}

	void Disconnect() {
		try {
			if (this->socket.connected()) {
				socket.stop();
				Serial.println("Disconnecting to Socket");
			}
		} catch (const String &e) {
			Serial.print("Error: ");
			Serial.println(e);
		}
	}

	bool Verify() {
		try {
			return this->socket.connected();
		} catch (const String &e) {
			Serial.print("Error: ");
			Serial.println(e);
		}
	}

	void Print(String text) {
		try {
			if (this->Verify()) {
				this->socket.print(text);
			}
		} catch (const String &e) {
			Serial.print("Error: ");
			Serial.println(e);
		}
	}

	void Println(String text) {
		try {
			if (this->Verify()) {
				this->socket.println(text);
			}
		} catch (const String &e) {
			Serial.print("Error: ");
			Serial.println(e);
		}
	}

	void WriteBuffer(unsigned char* input, int len) {
		try {
			if (this->Verify()) {
				this->socket.write(input, len);
			}
		} catch (const String &e) {
			Serial.print("Error: ");
			Serial.println(e);
		}
	}

	unsigned char* ReadBuffer() {
		try {
			if (this->Verify()) {
				while (!this->socket.available()) {
					if (this->Verify()) {
						delay(DelayTime);
					} else {
						return (unsigned char* ) NULL;
					}
				}
				int length = this->socket.available();
				int index = 0;
				if (length > 0) {
					uint8_t* output;
					return (unsigned char* )this->socket.read(output, length);
				}
			} else {
				return (unsigned char* ) NULL;
			}
		} catch (const String &e) {
			Serial.print("Error: ");
			Serial.println(e);
		}
	}

	String Read() {
		try {
			if (this->Verify()) {
				return this->socket.readStringUntil('\r');
			} else {
				return String("");
			}
		} catch (const String &e) {
			Serial.print("Error: ");
			Serial.println(e);
		}
	}
};