const fs = require('fs');
const https = require('https');
const path = require('path');

const MAX_RETRIES = 50;
const RETRY_DELAY = 3000;

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        let retries = 0;

        const attemptDownload = () => {
            let startByte = 0;
            if (fs.existsSync(dest)) {
                startByte = fs.statSync(dest).size;
            }

            console.log(`[Attempt ${retries + 1}] Downloading ${path.basename(dest)}... (Starting at byte: ${startByte})`);

            const options = {
                headers: {
                    'Range': `bytes=${startByte}-`,
                    'User-Agent': 'Mozilla/5.0'
                }
            };

            https.get(url, options, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
                    console.log(`Redirecting to ${res.headers.location}`);
                    url = res.headers.location;
                    return attemptDownload();
                }

                if (res.statusCode === 416) {
                    console.log(`Download already complete for ${dest} (416 Range Not Satisfiable).`);
                    return resolve();
                }

                if (res.statusCode !== 200 && res.statusCode !== 206) {
                    console.error(`Unexpected status code: ${res.statusCode}`);
                    return retry();
                }

                const file = fs.createWriteStream(dest, { flags: 'a' });
                res.pipe(file);

                file.on('finish', () => {
                    file.close();
                    console.log(`Download finished for ${dest}!`);
                    resolve();
                });

                res.on('error', (err) => {
                    console.error(`Response error: ${err.message}`);
                    file.close();
                    retry();
                });

            }).on('error', (err) => {
                console.error(`Request error: ${err.message}`);
                retry();
            });
        };

        const retry = () => {
            retries++;
            if (retries > MAX_RETRIES) {
                return reject(new Error(`Failed to download after ${MAX_RETRIES} attempts.`));
            }
            console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
            setTimeout(attemptDownload, RETRY_DELAY);
        };

        attemptDownload();
    });
}

async function main() {
    try {
        await downloadFile(
            'https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse',
            'D:\\jdk-17.zip'
        );
        await downloadFile(
            'https://dl.google.com/android/repository/platform-tools-latest-windows.zip',
            'D:\\platform-tools.zip'
        );
        console.log('All downloads completed successfully!');
    } catch (err) {
        console.error('Fatal error:', err);
        process.exit(1);
    }
}

main();
