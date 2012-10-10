SHELL = /bin/sh
COMPILER = ./bin/compile.js
STYLUS = ./node_modules/stylus/bin/stylus
YUI_COMPRESSOR = java -jar ./bin/yuicompressor-2.4.6.jar

JS_SOURCES = $(addprefix src/js/, \
  core.js \
  locale.js \
  utils.js \
  validators.js \
  plan.js \
  account.js \
  billing_info.js \
  subscription.js \
  transaction.js \
  ui.js\
  states.js\
)

THEME = default

THEMES := ${notdir ${wildcard ./themes/*}}

DOM_SOURCES = \
	contact_info_fields.jade \
	billing_info_fields.jade \
	subscribe_form.jade \
	update_billing_info_form.jade \
	one_time_transaction_form.jade \
	terms_of_service.jade \

THEME_JS_TARGETS := $(addprefix build/themes/, $(addsuffix /theme.js, $(THEMES)))

THEME_CSS_TARGETS := $(addprefix build/themes/, $(addsuffix /recurly.css, $(THEMES)))

# debug:
# 	@echo $(THEME_JS_TARGETS)
# 	@echo $(THEME_CSS_TARGETS)

all: node_modules build build/recurly.min.js $(THEME_JS_TARGETS) $(THEME_CSS_TARGETS)

build:
	mkdir -p build

build/recurly.js: $(JS_SOURCES) $(addprefix themes/$(THEME)/dom/, $(DOM_SOURCES))
	$(COMPILER) recurly $(THEME) $^ > $@

build/recurly.min.js: build/recurly.js
	rm -f build/recurly.min.js
	$(YUI_COMPRESSOR) build/recurly.js -o build/recurly.min.js

build/themes/%/theme.js: $(addprefix themes/$(THEME)/dom/, $(DOM_SOURCES))
	mkdir -p $(@D)
	$(COMPILER) theme $* $(addprefix themes/$*/dom/, $(DOM_SOURCES)) > build/themes/$*/dom.js

build/themes/%/recurly.css: themes/%/style/recurly.styl
	mkdir -p $(@D)
	# $(STYLUS) $^ -o $(abspath $(@D))
	$(STYLUS) $^
	cp -R $(dir $^) build/themes/$*/style

clean:
	rm -rf build

node_modules: package.json
	npm install
	touch node_modules

.PHONY: all clean
