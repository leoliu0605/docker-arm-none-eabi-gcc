#!/bin/bash

# Set timezone if TZ is provided
if [ -n "$TZ" ]; then
    echo "Setting timezone to $TZ"
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime
    echo $TZ > /etc/timezone
fi

# Check if USER_NAME is set, if not use root
if [ -z "${USER_NAME}" ]; then
    echo "Running as root"
    exec "$@"
else
    echo "Creating and switching to user: ${USER_NAME}"

    # Set default values if not provided
    USER_UID=${USER_UID:-1000}
    USER_GID=${USER_GID:-1000}

    # Create group if it does not exist
    if ! getent group ${USER_NAME} > /dev/null 2>&1; then
        groupadd -g ${USER_GID} ${USER_NAME}
    fi

    # Create user if it does not exist
    if ! id -u ${USER_NAME} > /dev/null 2>&1; then
        useradd -u ${USER_UID} -g ${USER_GID} -s /bin/bash ${USER_NAME}
        echo "${USER_NAME}:123456" | chpasswd
        echo "${USER_NAME} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
    fi

    # Ensure the home directory exists and has correct permissions
    if [ ! -d "/home/${USER_NAME}" ]; then
        mkdir -p /home/${USER_NAME}
    fi
    chown ${USER_UID}:${USER_GID} /home/${USER_NAME}

    # Switch to the new user and execute the command
    exec gosu ${USER_NAME} "$@"
fi
