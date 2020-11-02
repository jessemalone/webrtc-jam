PYTHON = python3
PIP = pip3

.PHONY = test install run

test:
	${PYTHON} -m unittest discover tests/ -v

install:
	${PIP} install -r requirements.txt

run:
	${PYTHON} app.py
