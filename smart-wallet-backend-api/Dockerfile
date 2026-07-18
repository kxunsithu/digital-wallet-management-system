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
# Create .env from environment variables for Laravel to read
printenv > .env
# If DATABASE_URL is provided by Render, map it to DB_URL for Laravel
if [ ! -z "$DATABASE_URL" ]; then
    echo "DB_URL=$DATABASE_URL" >> .env
fi
php artisan key:generate --force --no-interaction
php artisan migrate --force --no-interaction
php-fpm -D
nginx -g 'daemon off;'\n" > /usr/local/bin/start-app.sh \
    && chmod +x /usr/local/bin/start-app.sh

# Expose port 80
EXPOSE 80

# Use the start script as the entrypoint
ENTRYPOINT ["/usr/local/bin/start-app.sh"]
