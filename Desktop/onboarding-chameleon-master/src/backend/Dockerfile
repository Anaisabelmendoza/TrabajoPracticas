FROM php:8.4-cli

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl unzip bash && \
    rm -rf /var/lib/apt/lists/*

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Instalar Symfony CLI
RUN curl -sS https://get.symfony.com/cli/installer | bash && \
    mv /root/.symfony*/bin/symfony /usr/local/bin/symfony

RUN git config --global --add safe.directory /app/backend
RUN git config --global user.email "onboarding@codeartssolutions.com"
RUN git config --global user.name "Onboarding"

# Configurar directorio de trabajo
WORKDIR /app

# Comando por defecto
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]