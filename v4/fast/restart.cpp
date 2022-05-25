#pragma once
#include <Arduino.h>;
#include "constants.cpp";

static void RestartEsp32() {
	try {
		Serial.println("Restarting Esp32...");
		delay(RestartDelayTime);
		ESP.restart();
	} catch (const String &e) {
		Serial.print("Error: ");
		Serial.println(e);
	}
}