# 1. Base image
FROM node:18-slim

# 2. Install system deps + Java + venv support
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ffmpeg \
      imagemagick \
      libreoffice \
      texlive-latex-base \
      default-jre-headless \
      python3-pip \
      python3-venv \
    && rm -rf /var/lib/apt/lists/*

# 3. Create & bootstrap a Python venv with all PyPI deps
RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install \
      pdf2docx \
      pandas \
      xmltodict \
      tabula-py \
      pyxlsb

# 4. Make venv’s python & pip first in PATH
ENV PATH="/opt/venv/bin:${PATH}"

# 5. Copy only the Python wrappers and JS plugins
RUN mkdir -p /app/lib/converters/plugins
COPY lib/converters/plugins/*.py /app/lib/converters/plugins/
COPY lib/converters/plugins/*.js /app/lib/converters/plugins/

# 6. Copy PluginManager.js to converters folder
RUN mkdir -p /app/lib/converters
COPY lib/converters/PluginManager.js /app/lib/converters/

# 7. Install Node.js dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 8. Copy CLI entrypoint
COPY cli.js ./
RUN chmod +x ./cli.js

# 9. Entrypoint
ENTRYPOINT ["node", "--enable-source-maps", "cli.js"]
CMD ["--help"]
