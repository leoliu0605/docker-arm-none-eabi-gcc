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

# Define Docker image and container names
IMAGE_NAME="jafee201153/arm-none-eabi-gcc:13.2.Rel1-ubuntu-20.04"
CONTAINER_NAME="arm-none-eabi-gcc-container"

# Set the paths for the SSH private and public keys
SSH_PRIVATE_KEY_PATH="$HOME/.ssh/id_rsa"
SSH_PUBLIC_KEY_PATH="$HOME/.ssh/id_rsa.pub"

# Set the permissions for the SSH private key to be read/write for the owner only
chmod 600 "$SSH_PRIVATE_KEY_PATH"
# Set the permissions for the SSH public key to be read/write for the owner, and readable for others
chmod 644 "$SSH_PUBLIC_KEY_PATH"

# Initialize the ssh-agent and add the private key to it
eval "$(ssh-agent -s)"
ssh-add "$SSH_PRIVATE_KEY_PATH"

# If the Docker image is not already available locally, pull it from the Docker repository
if [[ "$(docker images -q "$IMAGE_NAME" 2>/dev/null)" == "" ]]; then
    docker pull "$IMAGE_NAME"
fi

# Start a Docker container with the current directory mounted to /share in the container, and the SSH keys mounted to /tmp
docker run --name "$CONTAINER_NAME" --rm -v "$(pwd)":/share -v "$SSH_PRIVATE_KEY_PATH:/tmp/id_rsa" -v "$SSH_PUBLIC_KEY_PATH:/tmp/id_rsa.pub" -d -it "$IMAGE_NAME" sh

# Inside the container, set up SSH for future Git operations by copying the keys, setting their permissions, and disabling strict host key checking
docker exec "$CONTAINER_NAME" sh -c "\
    mkdir -p ~/.ssh && \
    cp /tmp/id_rsa ~/.ssh/id_rsa && \
    cp /tmp/id_rsa.pub ~/.ssh/id_rsa.pub && \
    chmod 600 ~/.ssh/id_rsa && \
    chmod 600 ~/.ssh/id_rsa.pub && \
    echo 'Host *' > ~/.ssh/config && \
    echo '  StrictHostKeyChecking no' >> ~/.ssh/config"

# Inside the container, navigate to the /share directory, update Git submodules, copy a configuration file, and execute make commands
docker exec "$CONTAINER_NAME" sh -c "\
    cd /share && \
    git submodule update --init --recursive && \
    make clean && \
    make"

# Stop the Docker container
docker stop "$CONTAINER_NAME"

# Terminate the ssh-agent process
eval "$(ssh-agent -k)"
```

### PowerShell

Create a PowerShell script named `docker-build.ps1` in the root directory of your project with the following contents:

```powershell
Set-StrictMode -Version Latest

# Function to run the script as an administrator
function Invoke-Administrator([String] $FilePath, [String[]] $ArgumentList = '') {
    # Get the current user's security principle
    $Current = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
    # Define the administrator role
    $Administrator = [Security.Principal.WindowsBuiltInRole]::Administrator

    # If the current user is not an administrator, run the script as an administrator
    if (-not $Current.IsInRole($Administrator)) {
        $PowerShellPath = (Get-Process -Id $PID).Path
        $Command = "" + $FilePath + "$ArgumentList" + ""
        Start-Process $PowerShellPath "-NoProfile -ExecutionPolicy Bypass -File $Command" -Verb RunAs
        exit
    }
    # If the current user is an administrator, bypass the execution policy
    else {
        Set-ExecutionPolicy -Scope Process -ExecutionPolicy ByPass
    }

    # Set the working directory to the directory of the script
    $ParentFolder = [System.IO.Path]::GetDirectoryName($FilePath)
    Set-Location $ParentFolder
    Write-Host "Current working directory: $($PWD.Path)"
}

# Run the script as an administrator
Invoke-Administrator $PSCommandPath

# Define Docker image and container names
$IMAGE_NAME = "jafee201153/arm-none-eabi-gcc:13.2.Rel1-ubuntu-20.04"
$CONTAINER_NAME = "arm-none-eabi-gcc-container"

# Set the paths for the SSH private and public keys
$SSH_PRIVATE_KEY_PATH = "$env:USERPROFILE\.ssh\id_rsa"
$SSH_PUBLIC_KEY_PATH = "$env:USERPROFILE\.ssh\id_rsa.pub"

# Set the permissions for the SSH private and public keys to read-only for the current user
icacls $SSH_PRIVATE_KEY_PATH /inheritance:r /grant:r "$env:USERNAME:R"
icacls $SSH_PUBLIC_KEY_PATH /inheritance:r /grant:r "$env:USERNAME:R"

# If the ssh-agent service is not running, start it
if ((Get-Service ssh-agent).Status -ne 'Running') {
    Write-Output "The ssh-agent service is not running. Starting it now..."
    Set-Service ssh-agent -StartupType Manual
    Start-Service ssh-agent
}

# Add the private key to the ssh-agent
ssh-add $SSH_PRIVATE_KEY_PATH

# If the Docker image is not available locally, pull it from the Docker repository
if (-not (docker images -q $IMAGE_NAME)) {
    docker pull $IMAGE_NAME
}

# Start a Docker container with the current directory mounted to /share in the container, and the SSH keys mounted to /tmp
docker run --name $CONTAINER_NAME --rm -v "${PWD}:/share" -v "${SSH_PRIVATE_KEY_PATH}:/tmp/id_rsa" -v "${SSH_PUBLIC_KEY_PATH}:/tmp/id_rsa.pub" -d -it $IMAGE_NAME sh

# Inside the container, set up SSH for future Git operations by copying the keys, setting their permissions, and disabling strict host key checking
docker exec $CONTAINER_NAME sh -c "mkdir -p ~/.ssh && cp /tmp/id_rsa ~/.ssh/id_rsa && cp /tmp/id_rsa.pub ~/.ssh/id_rsa.pub && chmod 600 ~/.ssh/id_rsa && chmod 600 ~/.ssh/id_rsa.pub && echo 'Host *' > ~/.ssh/config && echo '  StrictHostKeyChecking no' >> ~/.ssh/config"

# Inside the container, navigate to the /share directory, update Git submodules, copy a configuration file, and execute make commands
docker exec $CONTAINER_NAME sh -c "cd /share && git submodule update --init --recursive && make clean && make"

# Stop the Docker container
docker stop $CONTAINER_NAME

# Terminate the ssh-agent process
ssh-agent -k

# Reset the permissions of the SSH private key to their inherited permissions
icacls $SSH_PRIVATE_KEY_PATH /reset

# Reset the permissions of the SSH public key to their inherited permissions
icacls $SSH_PUBLIC_KEY_PATH /reset
```
