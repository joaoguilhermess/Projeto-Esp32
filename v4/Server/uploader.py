from time import sleep
from socket import socket

socket = socket()

# socket.connect(("179.96.188.58", 4020))
# socket.connect(("192.168.0.107", 4020))
socket.connect(("191.32.42.135", 4020))

file = open("fox.jpeg", "rb").read()
# file = open("a.jpeg", "rb").read()
chunk = 1024

socket.send("POST /upload HTTP/1.1\n".encode("utf8"))
socket.send("Host: 179.96.188.58\n".encode("utf8"))
socket.send("Connection: close\n".encode("utf8"))
socket.send("\n".encode("utf8"))

f = 0

lfile = len(file)
length = str(lfile)
while len(length) < 10:
	length = "0" + length

while True:
	s = socket.recv(5).decode("utf8")
	while len(s) < 5:
		s += socket.recv(1).decode("utf8")
	
	if s == "frame":
		socket.send(length.encode("utf8"))
		socket.send(file)
		f += 1

		print(f"Frame: {f} : length: {int(length)}")
		# sleep(0.1)