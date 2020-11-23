PYTHON = python3
PIP = pip3

.PHONY = test install run

help:
	@echo "---------------HELP-----------------"
	@echo "Install dependencies with:    make install"
	@echo "           Run tests with:    make test"
	@echo "      Run the server with:    make run"
	@echo "------------------------------------"

test:
	${PYTHON} -m unittest discover tests/ -v

install:
	${PIP} install -r requirements.txt

run:
	${PYTHON} app.py
