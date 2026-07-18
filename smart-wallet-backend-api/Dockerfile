FROM php:8.3-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    git \
    curl \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    icu-dev \
    libzip-dev \
    postgresql-dev \
    sqlite-dev

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd pdo_mysql pdo_pgsql pdo_sqlite zip bcmath exif pcntl opcache

# Install Composer
COPY --from=composer/composer:latest-bin /composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application code
COPY . .

# Install Composer dependencies
RUN composer install --no-dev --optimize-autoloader

# Ensure storage and bootstrap/cache are writable
RUN chmod -R 775 storage bootstrap/cache && chown -R www-data:www-data storage bootstrap/cache

# Configure Nginx
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Create start script
RUN printf "#!/bin/sh\n\
touch .env\n\
php artisan key:generate --force --no-interaction\n\
php artisan migrate --force --no-interaction\n\
php-fpm -D\n\
nginx -g 'daemon off;'\n" > /usr/local/bin/start-app.sh \
    && chmod +x /usr/local/bin/start-app.sh

# Expose port 80
EXPOSE 80

# Use the start script as the entrypoint
ENTRYPOINT ["/usr/local/bin/start-app.sh"]
