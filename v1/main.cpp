#include "esp_camera.h"
#include <WiFi.h>
#include "esp_timer.h"
#include "img_converters.h"
#include "Arduino.h"
#include "fb_gfx.h"
#include "esp_http_server.h"

const char* SSID = "";
const char* PassWord = "";

#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 6
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

#define Boundary "boundary"

static const char* StreamContentType = "multipart/x-mixed-replace; boundary=" Boundary;
static const char* StreamBoundary = "\r\n--" Boundary "\r\n";
static const char* StreamPart = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

httpd_handle_t StreamHttpd = NULL;

static esp_err_t StreamHandler(httpd_req_t* Request) {
	camera_fb_t* Frame = NULL;
	esp_err_t Respost = ESP_OK;
	size_t JpgBufferLen = 0;
	uint8_t* JpgBuffer = NULL;
	char* PartBuffer[64];

	Respost = httpd_resp_set_type(Request, StreamContentType);
	if (Respost != ESP_OK) {
		return Respost;
	}

	while (true) {
		Frame = esp_camera_fb_get();
		if (!Frame) {
			Serial.println("Frame capture failed");
			Respost = ESP_FAIL;
		} else {
			if (Frame -> width > 400) {
				if (Frame -> format != PIXFORMAT_JPEG) {
					bool JpegConverted = Frame2jpg(Frame2jpg, 80, &JpgBuffer, &JpgBufferLen);
					esp_camera_fb_return(Frame);
					Frame = NULL;
					if (!JpegConverted) {
						Serial.println("Jpeg compression failed");
						Respost = ESP_FAIL;
					}
				} else {
					JpgBufferLen = Frame -> len;
					JpgBuffer = Frame -> buf;
				}
			}
		}
		if (Respost == ESP_OK) {
			size_t HeaderLen = snprintf((char*)PartBuffer, 64, StreamPart, JpgBufferLen);
			Respost = httpd_resp_send_chunk(Request, (const char*) PartBuffer, HeaderLen);
		}
		if (Respost == ESP_OK) {
			Respost = httpd_resp_send_chunk(Request, (const char*)JpgBuffer, JpgBufferLen);
		}
		if (Respost == ESP_OK) {
			Respost = httpd_resp_send_chunk(Request, StreamBoundary, strlen(StreamBoundary));
		}
		if (Frame) {
			esp_camera_fb_return(Frame);
			Frame = NULL;
			JpgBuffer = NULL;
		} else if (JpgBuffer) {
			free(JpgBuffer);
			JpgBuffer = NULL;
		}
		if (Respost != ESP_OK) {
			break;
		}
		Serial.printf("Mjpeg: %uB\n", (unit32_t)(JpgBufferLen));
	}
	return Respost;
}

void StartCameraServer() {
	httpd_config_t Config = HHTDP_DEFAULT_CONFIG();
	Config.server_port = 80;

	httpd_uri_t Uri = {
		.uri = "/",
		.method = HTTP_GET,
		.handler = StreamHandler,
		.user_ctx = NULL
	};

	Serial.printf("Listening on '%d'\n", Config.server_port);
	if (httpd_start(&StreamHttpd, &Config) == ESP_OK) {
		httpd_register_uri_handler(StreamHandler, &Uri);
	}
}

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
		Config.frame_size = FRAMESIZE_UXGA;
		Config.jpeg_quality = 10;
		Config.fb_count = 2;
	} else {
		Config.framse_size = FRAMESIZE_SVGA;
		Config.jpeg_quality = 12;
		Config.fb_count = 1;
	}

	esp_err_t Error = esp_camera_init(&Config);
	if (Error != ESP_OK) {
		Serial.printf("Camera start failed Error Code: 0x%x", Error);
		return;
	}

	Serial.println("Trying to Connect on SSID: %c", SSID);
	WiFi.begin(SSID, PassWord);
	while (WiFi.status() != WL_CONNECTED) {
		delay(500);
		Serial.print(".");
	}
	Serial.println();
	Serial.println("Wifi Connected");

	Serial.print("Camera Stream Ready http://");
	Serial.print(WiFi.localIP());

	StartCameraServer();
}

void loop() {
	delay(1);
}