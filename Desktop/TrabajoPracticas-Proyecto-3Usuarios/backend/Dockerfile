FROM php:8.4-apache

# Instalar extensiones necesarias para MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Configurar Apache
RUN a2enmod rewrite
COPY . /var/www/html
WORKDIR /var/www/html

# Instalar Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Instalar dependencias sin ejecutar scripts (para evitar errores de DB en la nube durante la carga)
RUN composer install --no-scripts --no-interaction --optimize-autoloader

# Dar permisos a la carpeta de Symfony
RUN chown -R www-data:www-data /var/www/html/var

EXPOSE 80