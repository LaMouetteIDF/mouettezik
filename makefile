current_dir = $(shell pwd)
args="$(filter-out $@,$(MAKECMDGOALS))"

dev_name="KSPlayer-dev"
pre_prod_name="KSPlayer-pre-prod"
prod_name="KSPlayer"
repo_name="ks-player"

install:
	docker build -f docker/Dockerfile -t $(repo_name) --no-cache .

start:
	docker  run --name $(prod_name) -d --env-file ./.env --restart=always $(repo_name)

stop:
	docker stop -t 10 $(prod_name)
	docker rm -f $(prod_name)

log:
	docker logs -f $(prod_name)

dev:
	docker rm -f $(dev_name)
	docker build -f docker/Dockerfile.dev -t ds-player-dev .
	docker  run --name $(dev_name) -it --rm -p="3000:3000" -v="$(current_dir):/app" -v="$(current_dir)/data:/data" ds-player-dev scripts/start_dev.sh

pre-prod:
	docker build -f docker/Dockerfile.pre-prod -t ks-player-pre-prod .
	docker  run --name $(pre_prod_name) --rm -p="3000:3000" --env-file ./.env ks-player-pre-prod

clean_repo:
	rm -rf ./dist ./node_modules

sh:
	docker exec $(dev_name) $(call args)

%:
	@:
