#include <Arduino.h>;
#include <hwcrypto/aes.h>;

class Crypto {
private:
	unsigned char* key;
	unsigned char* iv;

public:
	Crypto(unsigned char* key, unsigned char* iv) {
		try {
			this->key = key;
			this->iv = iv;

		} catch (const String &e) {
			Serial.print("Error: ");
			Serial.println(e);
		}
	}

	unsigned char* Encrypt(unsigned char* ninput) {
		try {
			char* binput = (char* )"banana69";
			Serial.print("Ainput: ");
			Serial.println((char* ) binput);
			Serial.print("Asize: ");
			Serial.println(sizeof(binput));

			unsigned char* input = (unsigned char* )binput;

			Serial.print("Binput: ");
			Serial.println((char* ) input);
			Serial.print("Bsize: ");
			Serial.println(sizeof(input));

			size_t size = sizeof(input);
			// size_t size = (size_t) 8;
			Serial.print("Encrypt size: ");
			Serial.println(size);
			// unsigned char* output = (unsigned char*) ps_malloc(size);
			// unsigned char* output;
			unsigned char output[size];
			// memset(output, 0, size);
			size_t offset;

			esp_aes_context ctx;
			
			esp_aes_init(&ctx);
			
			Serial.print("a: ");
			Serial.println(esp_aes_setkey(&ctx, this->key, 128));

			Serial.print("b: ");
			Serial.println(esp_aes_crypt_cfb128(&ctx, ESP_AES_ENCRYPT, size, &offset, this->iv, input, output));
		
			// esp_aes_free(&ctx);

			return output;
		} catch (const String &e) {
			Serial.print("Error: ");
			Serial.println(e);
		}
	}

	unsigned char* Decrypt(unsigned char* input) {
		try {
			size_t size = sizeof(input);
			Serial.print("Decrypt size: ");
			Serial.println(size);
			// unsigned char* output = (unsigned char*) ps_malloc(size);
			unsigned char output[size];
			memset(output, 0, size);
			size_t offset = 0;

			esp_aes_context ctx;
			// esp_aes_init(&ctx);
			esp_aes_setkey(&ctx, this->key, 128);

			esp_aes_crypt_cfb128(&ctx,
				ESP_AES_DECRYPT,
				size,
				&offset,
				this->iv,
				(const unsigned char* )input,
				output);

			esp_aes_free(&ctx);

			return output;
		} catch (const String &e) {
			Serial.print("Error: ");
			Serial.println(e);
		}
	}
};