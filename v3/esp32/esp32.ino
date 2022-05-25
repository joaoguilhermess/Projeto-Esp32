#include <Arduino.h>
#include <WiFi.h>
#include "esp_camera.h"
// #include <EEPROM.h>

#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

const char* SSID = "Camsky";
const char* Password = "dangui64";
const char* HostName = "177.18.152.29";
const int HostPort = 4000;

const int FPS = 10;

WiFiClient Socket;

long LastLoop = millis();

long FramesSent = 0;

bool upload = false;

sensor_t* Sensor;

void setup() {
	Serial.begin(115200);

	camera_config_t Config;
	Config.ledc_channel = LEDC_CHANNEL_0;
	Config.ledc_timer = LEDC_TIMER_0;
	Config.pin_d0 = Y2_GPIO_NUM;
	Config.pin_d1 = Y3_GPIO_NUM;
	Config.pin_d2 = Y4_GPIO_NUM;
	Config.pin_d3 = Y5_GPIO_NUM;
	Config.pin_d4 = Y6_GPIO_NUM;
	Config.pin_d5 = Y7_GPIO_NUM;
	Config.pin_d6 = Y8_GPIO_NUM;
	Config.pin_d7 = Y9_GPIO_NUM;
	Config.pin_xclk = XCLK_GPIO_NUM;
	Config.pin_pclk = PCLK_GPIO_NUM;
	Config.pin_vsync = VSYNC_GPIO_NUM;
	Config.pin_href = HREF_GPIO_NUM;
	Config.pin_sscb_sda = SIOD_GPIO_NUM;
	Config.pin_sscb_scl = SIOC_GPIO_NUM;
	Config.pin_pwdn = PWDN_GPIO_NUM;
	Config.pin_reset = RESET_GPIO_NUM;
	Config.xclk_freq_hz = 20000000;
	Config.pixel_format = PIXFORMAT_JPEG;

	if (psramFound()) {
		Config.frame_size = FRAMESIZE_SVGA;
		Config.jpeg_quality = 10;
		Config.fb_count = 2;
	} else {
		Config.frame_size = FRAMESIZE_CIF;
		Config.jpeg_quality = 12;
		Config.fb_count = 1;
	}

	esp_err_t err = esp_camera_init(&Config);
	if (err != ESP_OK) {
		Serial.print("Camera initialized with error 0x");
		Serial.println(err);
		Serial.println("Restarting Esp32");
		delay(1000);
		ESP.restart();
	}

	Sensor = esp_camera_sensor_get();
	Serial.print("Trying to connect on SSID: ");
	Serial.print(SSID);
	Serial.print(" with Password: ");
	Serial.println(Password);

	WiFi.begin(SSID, Password);
	while (WiFi.status() != WL_CONNECTED) {
		Serial.println(WiFi.status());
		Serial.println(WiFi.localIP().toString());
		Serial.print(".");
		delay(500);
	}
}

void loop() {
	if (WiFi.status() != WL_CONNECTED) {
		Serial.print("Trying to connect on SSID: ");
		Serial.print(SSID);
		Serial.print(" with Password: ");
		Serial.println(Password);

		WiFi.begin(SSID, Password);
		while (WiFi.status() != WL_CONNECTED) {
			Serial.println(WiFi.status());
			Serial.println(WiFi.localIP().toString());
			Serial.print(".");
			delay(500);
		}
	}
	if (!Socket.connected()) {
		Serial.print("Trying to connect on Server: ");
		Serial.print(HostName);
		Serial.print(":");
		Serial.println(HostPort);

		Socket.connect(HostName, HostPort);
	}
	Socket.write((const char *)"POST /upload HTTP/1.1\n");
	Socket.write((const char *)"Host: ");
	Socket.write((const char *)HostName);
	Socket.write((const char *)"\n");
	Socket.write((const char *)"Cookie: token=dc61adc4f3905f23db13bb6adbc7aa4fbdf1a315e3e41e66\n");
	Socket.write((const char *)"Connection: close\n");
	Socket.write((const char *)"\n");
	if (Socket.connected()) {
		if (upload) {
			camera_fb_t* Frame = NULL;
			Frame = esp_camera_fb_get();
			if (!Frame) {
				Serial.println("Camera frame capture failed");
				Serial.println("Restarting Esp32...");
				delay(1000);
				ESP.restart();
			} else {
				size_t FrameLength = Frame -> len;
				uint8_t* FrameBuffer = Frame -> buf;
				String FrameStringLength = String(FrameLength);
				while (FrameStringLength.length() < 10) {
					FrameStringLength = "0" + FrameStringLength;
				}
				Serial.print("FrameStringLength: ");
				Serial.print(FrameStringLength);

				Socket.print(FrameStringLength);

				for (size_t i = 0; i < FrameLength; i += 1024) {
					if (i + 1024 < FrameLength) {
					 Socket.write(FrameBuffer, 1024);
					 FrameBuffer += 1024;
				} else if (FrameLength % 1024 > 0) {
					 size_t Rest = FrameLength % 1024;
					 Socket.write(FrameBuffer, Rest);
				}
				FramesSent += 1;
				Serial.print("FramesSent: ");
				Serial.println(FramesSent);

				esp_camera_fb_return(Frame);

				Serial.println();
			}
		}
		if (Socket.available()) {
			char n[2];
			for (int i = 0; i < sizeof(n); i++) {
				char read = Socket.read();
				if (!read) {
					i -= 1;
				} else {
					n[i] = read;
				}
			}

			char v[4];
			for (int i = 0; i < sizeof(v); i++) {
				char read = Socket.read();
				if (!read) {
					i -= 1;
				} else {
					v[i] = read;
				}
			}

			int name = (String(name)).toInt();
			int value = (String(value)).toInt();

			switch (name) {
				case 0:
					Sensor -> set_brightness(Sensor, value);
					break;
				case 1:
					Sensor -> set_contrast(Sensor, value);
					break;
				case 2:
					Sensor -> set_saturation(Sensor, value);
					break;
				case 3:
					Sensor -> set_special_effect(Sensor, value);
					break;
				case 4:
					Sensor -> set_whitebal(Sensor, value);
					break;
				case 5:
					Sensor -> set_awb_gain(Sensor, value);
					break;
				case 6:
					Sensor -> set_wb_mode(Sensor, value);
					break;
				case 7:
					Sensor -> set_exposure_ctrl(Sensor, value);
					break;
				case 8:
					Sensor -> set_aec2(Sensor, value);
					break;
				case 9:
					Sensor -> set_ae_level(Sensor, value);
					break;
				case 10:
					Sensor -> set_aec_value(Sensor, value);
					break;
				case 11:
					Sensor -> set_gain_ctrl(Sensor, value);
					break;
				case 12:
					Sensor -> set_agc_gain(Sensor, value);
					break;
				case 13:
					Sensor -> set_gainceiling(Sensor, (gainceiling_t) value);
					break;
				case 14:
					Sensor -> set_bpc(Sensor, value);
					break;
				case 15:
					Sensor -> set_wpc(Sensor, value);
					break;
				case 16:
					Sensor -> set_raw_gma(Sensor, value);
					break;
				case 17:
					Sensor -> set_lenc(Sensor, value);
					break;
				case 18:
					Sensor -> set_hmirror(Sensor, value);
					break;
				case 19:
					Sensor -> set_vflip(Sensor, value);
					break;
				case 20:
					Sensor -> set_dcw(Sensor, value);
					break;
				case 21:
					Sensor -> set_colorbar(Sensor, value);
					break;
				case 22:
					if (value == 0) {
						upload = true;
					}
					else if (value == 1) {
						upload = false;
					}
					else if (value == 2) {
						
					}
					break;
			}

			Serial.print("Received ");
			Serial.print(name);
			Serial.print(" = ");
			Serial.println(value);
		}
	}
	float await = (1000 / FPS) - (millis() - LastLoop); 
	Serial.print("Await: ");
	Serial.println(await);
	if (await > 0) {
		delay(await);
	}
	LastLoop = millis();
}