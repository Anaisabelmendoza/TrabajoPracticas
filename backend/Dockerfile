FROM php:8.4-apache

# Instalar dependencias del sistema y extensiones de PHP para MySQL
RUN apt-get update && apt-get install -y \
    libicu-dev \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-install intl opcache pdo pdo_mysql zip

# Configurar Apache para que apunte a la carpeta pública de Symfony
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/conf-available/*.conf

# Habilitar el módulo de reescritura de Apache para Symfony
RUN a2enmod rewrite

# Copiar los archivos del proyecto al contenedor
COPY . /var/www/html

# Instalar Composer para gestionar las dependencias de Symfony
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --no-interaction --optimize-autoloader --no-scripts

# Dar permisos a las carpetas de caché y logs
RUN chown -R www-data:www-data /var/www/html/var