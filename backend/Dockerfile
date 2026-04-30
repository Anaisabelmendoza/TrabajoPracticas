FROM php:8.4-apache

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    libicu-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    && docker-php-ext-install intl opcache pdo pdo_mysql zip

# Configurar Apache
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/conf-available/*.conf

RUN a2enmod rewrite

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copiar archivos
COPY . /var/www/html

# Crear carpeta var ANTES de usarla
RUN mkdir -p /var/www/html/var

# Instalar dependencias Symfony
RUN composer install --no-interaction --optimize-autoloader --no-scripts

# Permisos (importante hacerlo al final)
RUN chown -R www-data:www-data /var/www/html

# Cambiar usuario (mejor práctica)
USER www-data


# cambio para forzar build