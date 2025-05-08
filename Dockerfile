# 1. Base image: slim Node.js LTS
FROM node:18-slim

# 2. Install system dependencies in one layer
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ffmpeg \
      imagemagick \
      libreoffice \
      texlive-latex-base \
      python3-pip \
    && rm -rf /var/lib/apt/lists/*

# 3. (Optional) Install any Python-based converters you need
#    Copy your Python wrapper(s) into the image, then pip-install their deps
COPY api/converters/plugins/pdf2docx_wrapper.py /app/api/converters/plugins/
RUN pip3 install pdf2docx

# 4. Set working directory & install Node.js dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 5. Copy your entire source tree
COPY . .

# 6. Default command: run your PluginManager (adjust path as needed)
CMD ["node", "api/converters/PluginManager.js"]
