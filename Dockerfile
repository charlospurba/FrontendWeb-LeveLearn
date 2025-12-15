FROM ubuntu:latest
LABEL authors="Levelearn"

# Install dependencies
RUN apt update && apt upgrade -y
RUN apt install -y nodejs npm openssl

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
COPY . .

RUN npm install
RUN npm install -g serve
RUN npm run build


EXPOSE 7700

CMD ["serve", "-s", "dist", "-l", "7700"]