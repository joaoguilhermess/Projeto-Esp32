import random
from time import sleep
import math
import socket
import os

foxPath = "fox.jpeg";

socket = socket.socket()

socket.connect(("localhost", 4000))

socket.send("POST /upload HTTP/1.1\n".encode("utf8"))
socket.send("Host: localhost\n".encode("utf8"))
socket.send("Cookie: token=841b144921baa15b3d808c7a68b7f9af7d4bf7552ef8d4e8\n".encode("utf8"))
socket.send("Connection: close\n".encode("utf8"))
socket.send("\n".encode("utf8"))

images = 0

sleep(1);

while True:
	img = apples[math.floor(random.random() * len(apples))]
	length = str(len(img))
	while len(length) < 10:
		length = "0" + length
	socket.send(length.encode("utf8"))
	socket.send(img)

	print("Sending new Image: " + str(len(img)))
	sleep(1 / 10)