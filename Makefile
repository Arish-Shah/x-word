SRC := ./src/x-word.ts
OUT := ./docs

dev:
	bun build $(SRC) --outdir $(OUT) --watch &
	python3 -m http.server --directory $(OUT)

build:
	bun build $(SRC) --outdir $(OUT) --minify

.PHONY: dev build
