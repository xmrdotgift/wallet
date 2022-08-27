.PHONY: all
all:

.PHONY: build
build:
	npm run build

.PHONY: run
run:
	npm run serve

.PHONY: docker/build
docker/build:
	DOCKER_BUILDKIT=1 docker build -t wallet:latest .

.PHONY: docker/run
docker/run: docker/build
	DOCKER_BUILDKIT=1 docker run -it --network host --rm wallet:latest
