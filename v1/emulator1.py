import random
from time import sleep
import math
import socket
import os

applesPath = "apples/"

list = os.listdir(applesPath)
apples = []

for i in range(len(list)):
	apples.append(open(applesPath + list[i], "rb").read())

socket = socket.socket()

socket.connect(("localhost", 4001))

# socket.send("a".encode("utf8"));

while True:
	img = apples[math.floor(random.random() * len(apples))]
	length = str(len(img))
	while len(length) < 10:
		length = "0" + length
	a = socket.send(length.encode("utf8"))
	# print("a: " + str(a))

	print("Sent Image: " + str(len(img)))
	b = socket.send(img)
	# print(img[slice(200)]);
	# print("b: " + str(b))

	sleep(1 / 10)
	# break