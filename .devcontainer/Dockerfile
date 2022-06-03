FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:12

COPY ["zscaler.crt", "."]

RUN cat zscaler.crt >> /etc/ssl/certs/ca-certificates.crt && \
    update-ca-certificates

RUN apt-get update && apt-get install -y \
    git \
    openssl \
    openssh-server

RUN npm install -g rollup
