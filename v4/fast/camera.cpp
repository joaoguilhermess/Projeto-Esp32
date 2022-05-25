#include <Arduino.h>;
#include "esp_camera.h"
#include "restart.cpp";

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

class Camera {
private:
	static sensor_t* sensor;
	static camera_config_t config;

public:
	static void Begin() {
		try {
			config.ledc_channel = LEDC_CHANNEL_0;
			config.ledc_timer = LEDC_TIMER_0;
			config.pin_d0 = Y2_GPIO_NUM;
			config.pin_d1 = Y3_GPIO_NUM;
			config.pin_d2 = Y4_GPIO_NUM;
			config.pin_d3 = Y5_GPIO_NUM;
			config.pin_d4 = Y6_GPIO_NUM;
			config.pin_d5 = Y7_GPIO_NUM;
			config.pin_d6 = Y8_GPIO_NUM;
			config.pin_d7 = Y9_GPIO_NUM;
			config.pin_xclk = XCLK_GPIO_NUM;
			config.pin_pclk = PCLK_GPIO_NUM;
			config.pin_vsync = VSYNC_GPIO_NUM;
			config.pin_href = HREF_GPIO_NUM;
			config.pin_sscb_sda = SIOD_GPIO_NUM;
			config.pin_sscb_scl = SIOC_GPIO_NUM;
			config.pin_pwdn = PWDN_GPIO_NUM;
			config.pin_reset = RESET_GPIO_NUM;
			config.xclk_freq_hz = 20000000;
			config.pixel_format = PIXFORMAT_JPEG;

			config.frame_size = FRAMESIZE_CIF;
			config.jpeg_quality = 12;
			config.fb_count = 1;

			sensor = esp_camera_sensor_get();

			esp_err_t err = esp_camera_init(&config);
			if (err != ESP_OK) {
				Serial.print("Camera initialized with error 0x");
				Serial.println(err);
				RestartEsp32();
			}
		} catch (const String &e) {
			Serial.print("Error: ");
			Serial.println(e);
		}
	}

	static camera_fb_t* GetFrame() {
		try {
			camera_fb_t* Frame = NULL; 
			Frame = esp_camera_fb_get();
			if (Frame) {
				return Frame;
			} else {
				Serial.println("getFrame failed");
				RestartEsp32();
			}
		} catch (const String &e) {
			Serial.print("Error: ");
			Serial.println(e);
		}
	}

	static void ReturnFrame(camera_fb_t* Frame) {
		try {
			esp_camera_fb_return(Frame);
		} catch (const String &e) {
			Serial.print("Error: ");
			Serial.println(e);
		}
	}
};