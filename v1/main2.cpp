// #include <time.h>
#include <Arduino.h>
#include <WiFi.h>
#include "esp_camera.h"
// #include <EEPROM.h>

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

const char* SSID = "";
const char* Password = "";
const char* HostName = "";
const int HostPort = 4000;

const int FPS = 10;

WiFiClient Socket;

// time_t LastLoop = now();

long FramesSent = 0;

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

  // QVGA|CIF|VGA|SVGA|XGA|SXGA|UXGA

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


}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.print("Trying to connect on SSID: ");
    Serial.print(SSID);
    Serial.print(" with Password: ");
    Serial.println(Password);

    WiFi.begin(SSID, Password);
    while (WiFi.status() != WL_CONNECTED) {
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
  if (Socket.connected()) {
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
      Serial.println(FrameStringLength);

      Socket.println(FrameStringLength);

      for (size_t i = 0; i < FrameLength; i += 1024) {
        if (i + 1024 < FrameLength) {
         Socket.write(FrameBuffer, 1024);
         FrameBuffer += 1024;
       } else if (FrameLength % 1024 > 0) {
         size_t Rest = FrameLength % 1024;
         Socket.write(FrameBuffer, Rest);
       }
      }

      FramesSent += 1;
      Serial.print("FramesSent: ");
      Serial.println(FramesSent);

      esp_camera_fb_return(Frame);

      if (Socket.available()) {
        char c = Socket.read();
        Serial.print("Received: ");
        Serial.println(c);
      }

      Serial.println();
    }
  }
  // float await = (1000 / FPS) - (now() - LastLoop); 
  float await = (1000 / FPS); 
  Serial.print("Await: ");
  Serial.println(await);
  if (await > 0) {
    delay(await);
  }
  // LastLoop = now();
}