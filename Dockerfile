# Use an explicit version for reproducibility
FROM ubuntu:20.04

# Set timezone, default is Asia/Taipei
RUN apt-get update && apt-get install -y tzdata && \
    ln -snf /usr/share/zoneinfo/Asia/Taipei /etc/localtime && echo Asia/Taipei > /etc/timezone

# Install required packages
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y sudo wget make cpio libncurses5 xz-utils git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install gosu
RUN wget -O /usr/local/bin/gosu https://github.com/tianon/gosu/releases/download/1.14/gosu-amd64 && \
    chmod +x /usr/local/bin/gosu

# Define the platform as an argument
ARG TARGETPLATFORM
ARG TOOLCHAIN_URL_AMD64
ARG TOOLCHAIN_URL_ARM64

# Install toolchain based on platform
RUN case "${TARGETPLATFORM}" in \
    "linux/amd64") \
    TOOLCHAIN_URL=${TOOLCHAIN_URL_AMD64} \
    ;; \
    "linux/arm64") \
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

# Copy entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Set default command
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["bash"]
