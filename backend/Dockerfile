FROM php:8.4-apache

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    libicu-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    && docker-php-ext-install intl opcache pdo pdo_mysql zip

# Configurar Apache para que apunte a la carpeta public de tu backend
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/conf-available/*.conf
RUN a2enmod rewrite

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# COPIA SELECTIVA: Solo lo que está en backend/
WORKDIR /var/www/html
COPY backend/ .

# Crear carpeta var
RUN mkdir -p /var/www/html/var

# Instalar dependencias Symfony
RUN composer install --no-interaction --optimize-autoloader --no-scripts

# Compilar variables de entorno
RUN touch .env && composer dump-env prod

# Permisos
RUN chown -R www-data:www-data /var/www/html
USER www-data