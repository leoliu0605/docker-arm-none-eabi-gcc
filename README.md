[![jafee201153/arm-none-eabi-gcc](https://github.com/leoli0605/docker-arm-none-eabi-gcc/actions/workflows/publish.yml/badge.svg)](https://github.com/leoli0605/docker-arm-none-eabi-gcc/actions/workflows/publish.yml)
[![Docker Pulls](https://img.shields.io/docker/pulls/jafee201153/arm-none-eabi-gcc.svg)](https://hub.docker.com/r/jafee201153/arm-none-eabi-gcc/)
[![Docker Stars](https://img.shields.io/docker/stars/jafee201153/arm-none-eabi-gcc.svg)](https://hub.docker.com/r/jafee201153/arm-none-eabi-gcc/)

# [arm-none-eabi-gcc (docker image)](https://hub.docker.com/r/jafee201153/arm-none-eabi-gcc)

Let's build your project with `arm-none-eabi-gcc` in a docker container.

## Usage

```bash
docker pull jafee201153/arm-none-eabi-gcc:latest
```

```bash
docker run --name arm-none-eabi-gcc-container --rm -v ${PWD}:/share -d -it jafee201153/arm-none-eabi-gcc:latest sh
```

```bash
docker exec arm-none-eabi-gcc-container sh -c "cd /share && make clean && make"
```

```bash
docker stop arm-none-eabi-gcc-container
```

## Support

If you encounter any issues or have suggestions, please [open an issue](https://github.com/leoli0605/docker-arm-none-eabi-gcc/issues) on our GitHub repository.

## Advanced Usage

This section describes how to use the Docker image to build a project that uses Git submodules and SSH keys. The example below assumes that the project is in a Git repository and that the Git submodules are also in Git repositories. The example also assumes that the Git repositories are hosted on GitHub and that the SSH keys are stored in the default location (`~/.ssh/id_rsa` and `~/.ssh/id_rsa.pub`).

It allows you to build your project with `arm-none-eabi-gcc` in a docker container.

### shell

Create a shell script named `docker-build.sh` in the root directory of your project with the following contents:

```bash
#!/bin/bash

# Set image and container names
IMAGE_NAME="jafee201153/arm-none-eabi-gcc:latest-ubuntu-20.04"
CONTAINER_NAME="arm-none-eabi-gcc-container"

# Define the SSH key paths
SSH_PRIVATE_KEY_PATH="$HOME/.ssh/id_rsa"
SSH_PUBLIC_KEY_PATH="$HOME/.ssh/id_rsa.pub"

# Ensure the SSH private key is secure
chmod 600 "$SSH_PRIVATE_KEY_PATH"
# Public keys can be less restrictive, but typically should not be world-writable
chmod 644 "$SSH_PUBLIC_KEY_PATH"

# Start the ssh-agent and add the private key
eval "$(ssh-agent -s)"
ssh-add "$SSH_PRIVATE_KEY_PATH"

# Pull the Docker image if it's not available locally
if [[ "$(docker images -q "$IMAGE_NAME" 2>/dev/null)" == "" ]]; then
    docker pull "$IMAGE_NAME"
fi

# Change the directory to the parent directory of the current directory
cd ..

# Run the Docker container with the current directory mounted to /share
docker run --name "$CONTAINER_NAME" --rm -v "$(pwd)":/share -v "$SSH_PRIVATE_KEY_PATH:/tmp/id_rsa" -v "$SSH_PUBLIC_KEY_PATH:/tmp/id_rsa.pub" -d -it "$IMAGE_NAME" sh

# Set up SSH within the container for subsequent Git operations
docker exec "$CONTAINER_NAME" sh -c "\
    mkdir -p ~/.ssh && \
    cp /tmp/id_rsa ~/.ssh/id_rsa && \
    cp /tmp/id_rsa.pub ~/.ssh/id_rsa.pub && \
    chmod 600 ~/.ssh/id_rsa && \
    chmod 600 ~/.ssh/id_rsa.pub && \
    echo 'Host *' > ~/.ssh/config && \
    echo '  StrictHostKeyChecking no' >> ~/.ssh/config"

# Perform Git submodule update and make operations
docker exec "$CONTAINER_NAME" sh -c "\
    cd /share && \
    git submodule update --init --recursive && \
    make clean && \
    make"

# Stop the container
docker stop "$CONTAINER_NAME"

# Kill the running ssh-agent
eval "$(ssh-agent -k)"
```

### Batch

Create a batch script named `docker-build.bat` in the root directory of your project with the following contents:

```bash
@echo off
SETLOCAL EnableDelayedExpansion

:: Set image and container names
SET "IMAGE_NAME=jafee201153/arm-none-eabi-gcc:latest-ubuntu-20.04"
SET "CONTAINER_NAME=arm-none-eabi-gcc-container"

:: Define the SSH key paths
SET "SSH_PRIVATE_KEY_PATH=%USERPROFILE%\.ssh\id_rsa"
SET "SSH_PUBLIC_KEY_PATH=%USERPROFILE%\.ssh\id_rsa.pub"

:: Ensure the SSH private key is secure
ICACLS "%SSH_PRIVATE_KEY_PATH%" /inheritance:r /grant:r "%USERNAME%:R"
ICACLS "%SSH_PUBLIC_KEY_PATH%" /inheritance:r /grant:r "%USERNAME%:R"

:: Check the status of the ssh-agent service and start if not running
sc query ssh-agent | find "RUNNING"
IF ERRORLEVEL 1 (
    echo The ssh-agent service is not running. Starting it now...
    :: Require to run as Administrator
    net session >nul 2>&1
    IF ERRORLEVEL 1 (
        echo This script must be run as an Administrator
        :: Exit if not admin
        GOTO :EOF
    )
    sc config ssh-agent start= demand
    net start ssh-agent
)

:: Start the ssh-agent and add the private key
CALL ssh-agent
ssh-add "%SSH_PRIVATE_KEY_PATH%"

:: Pull the Docker image if it's not available locally
FOR /F "tokens=*" %%i IN ('docker images -q "%IMAGE_NAME%" 2^>nul') DO SET "IMAGE_EXISTS=%%i"
IF "%IMAGE_EXISTS%"=="" (
    docker pull "%IMAGE_NAME%"
)

:: Change the directory to the parent directory of the current directory
cd ..

:: Run the Docker container with the current directory mounted to /share
docker run --name "%CONTAINER_NAME%" --rm -v "%CD%":/share -v "%SSH_PRIVATE_KEY_PATH%":/tmp/id_rsa -v "%SSH_PUBLIC_KEY_PATH%":/tmp/id_rsa.pub -d -it "%IMAGE_NAME%" sh

:: Set up SSH within the container for subsequent Git operations
docker exec "%CONTAINER_NAME%" sh -c "mkdir -p ~/.ssh && cp /tmp/id_rsa ~/.ssh/id_rsa && cp /tmp/id_rsa.pub ~/.ssh/id_rsa.pub && chmod 600 ~/.ssh/id_rsa && chmod 600 ~/.ssh/id_rsa.pub && echo 'Host *' > ~/.ssh/config && echo '  StrictHostKeyChecking no' >> ~/.ssh/config"

:: Perform Git submodule update and make operations
docker exec "%CONTAINER_NAME%" sh -c "cd /share && git submodule update --init --recursive && make clean && make"

:: Stop the container
docker stop "%CONTAINER_NAME%"

:: Kill the running ssh-agent
CALL ssh-agent -k

ENDLOCAL
```
