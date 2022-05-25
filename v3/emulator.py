from threading import Thread
import random
from time import sleep
import math
import socket
import os

foxFile = "fox.jpeg";
foxImage = open(foxFile, "rb").read();

socket = socket.socket()

socket.connect(("177.18.152.29", 4000))
# socket.connect(("localhost", 4000))

socket.send("POST /upload HTTP/1.1\n".encode("utf8"))
socket.send("Host: localhost\n".encode("utf8"))
socket.send("Cookie: token=dc61adc4f3905f23db13bb6adbc7aa4fbdf1a315e3e41e66\n".encode("utf8"))
socket.send("Connection: close\n".encode("utf8"))
socket.send("\n".encode("utf8"))

frames = 0

sleep(1);

state = ""

def receive():
	global state
	print("Receive Thread Started")

	# print(socket.recv(1024).decode("utf8"))

	while True:
		# print("recv tick")
		n = ""
		while len(n) < 2:
			# print("read tick1")
			recv = socket.recv(1).decode("utf8")
			if recv:
				n += recv
			sleep(1 / 30)
		v = ""
		while len(v) < 4:
			# print("read tick2")
			recv = socket.recv(1).decode("utf8")
			if recv:
				v += recv
			sleep(1 / 30)

		print(n, v)
		name = int(n)
		value = int(v)

		print(n, v)


		if name == 0:
			print("Sensor -> set_brightness(Sensor, " + str(value))
		elif name == 1:
			print("Sensor -> set_contrast(Sensor, " + str(value))
		elif name == 2:
			print("Sensor -> set_saturation(Sensor, " + str(value))
		elif name == 3:
			print("Sensor -> set_special_effect(Sensor, " + str(value))
		elif name == 4:
			print("Sensor -> set_whitebal(Sensor, " + str(value))
		elif name == 5:
			print("Sensor -> set_awb_gain(Sensor, " + str(value))
		elif name == 6:
			print("Sensor -> set_wb_mode(Sensor, " + str(value))
		elif name == 7:
			print("Sensor -> set_exposure_ctrl(Sensor, " + str(value))
		elif name == 8:
			print("Sensor -> set_aec2(Sensor, " + str(value))
		elif name == 9:
			print("Sensor -> set_ae_level(Sensor, " + str(value))
		elif name == 10:
			print("Sensor -> set_aec_value(Sensor, " + str(value))
		elif name == 11:
			print("Sensor -> set_gain_ctrl(Sensor, " + str(value))
		elif name == 12:
			print("Sensor -> set_agc_gain(Sensor, " + str(value))
		elif name == 13:
			print("Sensor -> set_gainceiling(Sensor, (gainceiling_t) " + str(value))
		elif name == 14:
			print("Sensor -> set_bpc(Sensor, " + str(value))
		elif name == 15:
			print("Sensor -> set_wpc(Sensor, " + str(value))
		elif name == 16:
			print("Sensor -> set_raw_gma(Sensor, " + str(value))
		elif name == 17:
			print("Sensor -> set_lenc(Sensor, " + str(value))
		elif name == 18:
			print("Sensor -> set_hmirror(Sensor, " + str(value))
		elif name == 19:
			print("Sensor -> set_vflip(Sensor, " + str(value))
		elif name == 20:
			print("Sensor -> set_dcw(Sensor, " + str(value))
		elif name == 21:
			print("Sensor -> set_colorbar(Sensor, " + str(value))
		elif name == 22:
			print("State: -> " + str(value))
			if value == 0:
				state = "start"
			elif value == 1:
				state = "pause"
			elif value == 2:
				state = "stop"
				break;

		sleep(1 / 10)

thread = Thread(target = receive).start()

while True:
	if state == "start":
		length = str(len(foxImage))
		while len(length) < 10:
			length = "0" + length
		socket.send(length.encode("utf8"))
		socket.send(foxImage)
		frames += 1;
	elif state == "pause":
		pass
	elif state == "stop":
		break;
		print("Uploaded: " + str(len(foxImage)) + " bytes")
	sleep(1 / 10)