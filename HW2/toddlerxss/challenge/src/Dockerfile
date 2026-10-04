FROM node:18 as chroot

RUN /usr/sbin/useradd --no-create-home -u 1337 user

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
# Fix chromium crashpad issue
ENV XDG_CONFIG_HOME=/tmp/.chromium  
ENV XDG_CACHE_HOME=/tmp/.chromium

# Install dependencies for Puppeteer and Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    libxss1 \
    libxtst6 \
    libxkbcommon0 \
    libgbm1 \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libdrm2 \
    libgdk-pixbuf2.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY ./ /home/user/
COPY start.sh /home/user/

RUN chown -R 1337 /home/user/*
WORKDIR /home/user/
RUN npm install

CMD ["sh", "start.sh"]