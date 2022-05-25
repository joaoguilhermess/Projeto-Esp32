name = "fast/" + str(input("file: "))

print(name)

file = open(name, "r")
file = file.read()
text = file.split("Serial.begin", 2)[1].split("\n")

print(text)

new = file.split("Serial.begin", 2)[0] + "Serial.begin"
for i in range(0, len(text)):
	new += text[i] + "\nSerial.println(" + str(i) + ");\n"

file2 = open(name, "w")
file2.write(new)
file2.close()