#include <Arduino.h>;
#include <WiFi.h>;
#include "restart.cpp";
#include "constants.cpp";

class Wifi {
public:
	static void Connect() {
		try {
			if (WiFi.status() != WL_CONNECTED) {
				Serial.print("Trying to Connect on Ssid: ");
				Serial.print(Ssid);
				Serial.print(" With Password: ");
				Serial.println(Password);

				WiFi.begin(Ssid, Password);
				while (WiFi.status() != WL_CONNECTED) {
					Serial.print(".");
					delay(DelayTime);
				}

				Serial.println("");
				Serial.println("WiFi Connected");
			}
		} catch (const String &e) {
			Serial.print("Error: ");
			Serial.println(e);
		}
	}
	static bool Verify() {
		try {
			return WiFi.status() == WL_CONNECTED;
		} catch (const String &e) {
			Serial.print("Error: ");
			Serial.println(e);
		}
	}
};