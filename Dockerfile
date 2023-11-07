# Use an explicit version for reproducibility
FROM ubuntu:20.04

# Define the platform as an argument
ARG TARGETPLATFORM
ARG TOOLCHAIN_URL_AMD64
ARG TOOLCHAIN_URL_ARM64

# Install dependencies, upgrade packages and install git
RUN apt-get update && \
    apt-get install -y wget make cpio libncurses5 xz-utils git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Choose the toolchain based on the platform
RUN case "${TARGETPLATFORM}" in \
    "linux/amd64") \
    echo "Platform: ${TARGETPLATFORM}"; \
    TOOLCHAIN_URL=${TOOLCHAIN_URL_AMD64} \
    ;; \
    "linux/arm64") \
    echo "Platform: ${TARGETPLATFORM}"; \
    TOOLCHAIN_URL=${TOOLCHAIN_URL_ARM64} \
    ;; \
    *) \
    echo "Unsupported platform: ${TARGETPLATFORM}"; \
    exit 1 \
    ;; \
    esac && \
    wget "${TOOLCHAIN_URL}" -O arm-gnu-toolchain.tar.xz && \
    mkdir arm-none-eabi-gcc && \
    tar xf arm-gnu-toolchain.tar.xz -C arm-none-eabi-gcc --strip-components=1 && \
    rm arm-gnu-toolchain.tar.xz

# Add the tools to the path
ENV PATH="/arm-none-eabi-gcc/bin:${PATH}"
