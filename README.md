[![jafee201153/arm-none-eabi-gcc](https://github.com/leoli0605/docker-arm-none-eabi-gcc/actions/workflows/publish.yml/badge.svg)](https://github.com/leoli0605/docker-arm-none-eabi-gcc/actions/workflows/publish.yml)
[![Docker Pulls](https://img.shields.io/docker/pulls/jafee201153/arm-none-eabi-gcc.svg)](https://hub.docker.com/r/jafee201153/arm-none-eabi-gcc/)
[![Docker Stars](https://img.shields.io/docker/stars/jafee201153/arm-none-eabi-gcc.svg)](https://hub.docker.com/r/jafee201153/arm-none-eabi-gcc/)

# [arm-none-eabi-gcc (docker image)](https://hub.docker.com/r/jafee201153/arm-none-eabi-gcc)

Let's build your project with `arm-none-eabi-gcc` in a docker container.

## Features

- Based on `ubuntu:20.04`
- `git` and `make` are pre-installed
- Environment variables
  - `TZ`: Timezone, default is `Asia/Taipei`
  - `USER_NAME`: User name
  - `USER_UID`: User ID
  - `USER_GID`: Group ID

## Usage

```bash
# Running as root user
GCC_VERSION=latest \
HOST_TZ=$(cat /etc/timezone) \
docker run -it --rm \
    -e TZ=$HOST_TZ \
    -v "$(pwd)":/share \
    -w /share \
    jafee201153/arm-none-eabi-gcc:$GCC_VERSION /bin/bash
```

```bash
# Running as non-root user
GCC_VERSION=latest \
HOST_TZ=$(cat /etc/timezone) \
USER_NAME=$(whoami) \
USER_UID=$(id -u $USER_NAME) \
USER_GID=$(id -g $USER_NAME) \
docker run -it --rm \
    -e TZ=$HOST_TZ \
    -e USER_NAME=$USER_NAME \
    -e USER_UID=$USER_UID \
    -e USER_GID=$USER_GID \
    -v "$(pwd)":/home/$USER_NAME/share \
    -w /home/$USER_NAME/share \
    jafee201153/arm-none-eabi-gcc:$GCC_VERSION /bin/bash
```

## Example

```bash
# Build the project
GCC_VERSION=latest \
HOST_TZ=$(cat /etc/timezone) \
USER_NAME=$(whoami) \
USER_UID=$(id -u $USER_NAME) \
USER_GID=$(id -g $USER_NAME) \
docker run -it --rm \
    -e TZ=$HOST_TZ \
    -e USER_NAME=$USER_NAME \
    -e USER_UID=$USER_UID \
    -e USER_GID=$USER_GID \
    -v "$(pwd)":/home/$USER_NAME/share \
    -w /home/$USER_NAME/share \
    jafee201153/arm-none-eabi-gcc:$GCC_VERSION /bin/bash \
    -c "make clean && make all"
```

## Support

If you encounter any issues or have suggestions, please [open an issue](https://github.com/leoli0605/docker-arm-none-eabi-gcc/issues) on our GitHub repository.
