import axios from 'axios';
import { spawn } from "child_process";
import * as gcc from "./gcc"; // curl -o src\gcc.ts https://raw.githubusercontent.com/carlosperate/arm-none-eabi-gcc-action/main/src/gcc.ts

const UBUNTU_VERSIONS = ["20.04", "22.04", "24.04"];
const LATEST_UBUNTU_VERSION = "24.04";

async function main() {
    const username = process.env.USERNAME;
    console.log(username);
    if (!username) {
        console.error("Missing username");
        return;
    }

    const versions = gcc.availableVersions().reverse();
    console.log(versions);
    if (!versions) {
        console.error("Missing versions");
        return;
    }

    const tags = await getDockerTags(`${username}/arm-none-eabi-gcc`);
    console.log(tags);

    for (const version of versions) {
        let amd64URL = "";
        let arm64URL = "";
        let platforms = "linux/amd64";
        let toolchainBuildArgs = "--build-arg TARGETPLATFORM";
        try {
            amd64URL = (await gcc.distributionUrl(version, "linux", "linux_x86_64")).url;
            console.log(`amd64: ${amd64URL}`);
            toolchainBuildArgs += ` --build-arg TOOLCHAIN_URL_AMD64="${amd64URL}"`;
        } catch (e) {
            // console.log(e);
        }
        try {
            arm64URL = (await gcc.distributionUrl(version, "linux", "arm64")).url;
            console.log(`arm64: ${arm64URL}`);
            if (arm64URL) {
                platforms += ",linux/arm64";
                toolchainBuildArgs += ` --build-arg TOOLCHAIN_URL_ARM64="${arm64URL}"`;
            }
        } catch (e) {
            // console.log(e);
        }

        for (const ubuntuVersion of UBUNTU_VERSIONS) {
            const tag = `${version}-ubuntu-${ubuntuVersion}`;
            if (tags.includes(tag)) {
                console.log(`Skipping ${tag}`);
                continue;
            }

            const buildArgs = `${toolchainBuildArgs} --build-arg UBUNTU_VERSION=${ubuntuVersion}`;
            let tagArgs = `-t ${username}/arm-none-eabi-gcc:${tag}`;
            if (ubuntuVersion === LATEST_UBUNTU_VERSION) {
                tagArgs += ` -t ${username}/arm-none-eabi-gcc:${version}`;
                if (version === versions[versions.length - 1]) {
                    tagArgs += ` -t ${username}/arm-none-eabi-gcc:latest`;
                }
            }

            const script = `
                #!/bin/bash

                username=${username}
                builder=builder
                if ! docker buildx ls | grep -q $builder; then
                    docker buildx create --name $builder
                fi
                docker buildx use $builder
                docker buildx inspect --bootstrap
                docker buildx build \\
                --platform=${platforms} \\
                ${buildArgs} \\
                ${tagArgs} . --push`;
            console.log(script);
            await cmd('bash', ['-c', script]);
        }
    }
}

function cmd(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const process = spawn(command, args, { shell: true });

        process.stdout.on('data', (data) => {
            console.log(data.toString());
        });

        process.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Process exited with code ${code}`));
            }
        });
    });
}

async function getDockerTags(repo: string): Promise<string[]> {
    let url = `https://hub.docker.com/v2/repositories/${repo}/tags`;
    let tags: string[] = [];

    try {
        while (url) {
            const response = await axios.get(url);
            if (response.status === 200 && response.data.results) {
                tags = tags.concat(response.data.results.map((tag: any) => tag.name));
                url = response.data.next || '';
            } else {
                console.error(response);
                return [];
            }
        }
        return tags;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

main();
