'use strict';

const Minio = require('minio');

module.exports = {
    init: (providerOptions) => {
        const {
            endPoint,
            bucket,
            port,
            accessKey,
            secretKey,
            useSSL,
            folder,
            isDocker,
            host,
            overridePath,
        } = providerOptions;

        const MINIO = new Minio.Client({
            port: Number(port),
            useSSL,
            endPoint,
            accessKey,
            secretKey,
        });

        const getPath = (file) => {
            const pathChunk = file.path ? `${file.path}/` : '';
            const path = `${folder}/${pathChunk}`;

            return `${path}${file.hash}${file.ext}`;
        };

        return {
            upload: (file) => {
                return new Promise((resolve, reject) => {
                    const path = getPath(file);

                    MINIO.putObject(
                        bucket,
                        path,
                        Buffer.from(file.buffer, 'binary'),
                        {
                            'Content-Type': file.mime,
                        },
                        (err) => {
                            if (err) {
                                return reject(err);
                            }

                            const filePath = `${bucket}/${path}`;
                            let hostPart = `${MINIO.protocol}//${MINIO.host}:${MINIO.port}`;

                            if (isDocker) {
                                const protocol = useSSL ? 'https' : 'http';
                                hostPart = `${protocol}://${host}`;
                            }

                            file.url = `${hostPart}/${filePath}`;

                            if (overridePath) {
                                file.url = `${overridePath}/${file.hash}${file.ext}`;
                            }

                            resolve();
                        }
                    );
                });
            },
            delete: (file) => {
                return new Promise((resolve, reject) => {
                    const path = getPath(file);

                    MINIO.removeObject(bucket, path, (err) => {
                        if (err) {
                            return reject(err);
                        }

                        resolve();
                    });
                });
            },
        };
    },
};
