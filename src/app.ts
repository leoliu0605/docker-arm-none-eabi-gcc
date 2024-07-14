import axios from 'axios';
import { spawn } from "child_process";
import * as gcc from "./gcc"; // curl -o src\gcc.ts https://raw.githubusercontent.com/carlosperate/arm-none-eabi-gcc-action/main/src/gcc.ts

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
        let buildArgs = "--build-arg TARGETPLATFORM";
        const tag = `${version}-ubuntu-20.04`
        if (tags.includes(tag)) {
            console.log(`Skipping ${tag}`);
            continue;
        }
        try {
            amd64URL = gcc.distributionUrl(version, "linux", "linux_x86_64").url;
            console.log(`amd64: ${amd64URL}`);
            buildArgs += ` --build-arg TOOLCHAIN_URL_AMD64="${amd64URL}"`;
        } catch (e) {
            // console.log(e);
        }
        try {
            arm64URL = gcc.distributionUrl(version, "linux", "arm64").url;
            console.log(`arm64: ${arm64URL}`);
            if (arm64URL) {
                platforms += ",linux/arm64";
                buildArgs += ` --build-arg TOOLCHAIN_URL_ARM64="${arm64URL}"`;
            }
        } catch (e) {
            // console.log(e);
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
                -t $username/arm-none-eabi-gcc:${tag} \\
                -t $username/arm-none-eabi-gcc:latest . --push`;
        console.log(script);
        await cmd('bash', ['-c', script]);
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
