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

# Create start script with robust .env generation
RUN printf "#!/bin/sh\n\
# Filter and export relevant environment variables to .env\n\
# This avoids system variables that cause parsing errors (e.g., those with spaces or special characters)\n\
printenv | grep -E '^(APP_|DB_|DATABASE_|AUTH_|ADMIN_|INFINIREACH_|AWS_|BCRYPT_|BROADCAST_|CACHE_|FILESYSTEM_|LOG_|MAIL_|MEMCACHED_|QUEUE_|REDIS_|SESSION_|VITE_)' > .env\n\
\n\
# Specifically handle DATABASE_URL from Render if present\n\
if [ ! -z \"\$DATABASE_URL\" ]; then\n\
    # Ensure DB_URL is set for Laravel database config compatibility\n\
    if ! grep -q '^DB_URL=' .env; then\n\
        echo \"DB_URL=\$DATABASE_URL\" >> .env\n\
    fi\n\
fi\n\
\n\
# Run Laravel optimization and database commands\n\
php artisan key:generate --force --no-interaction\n\
php artisan config:cache\n\
php artisan route:cache\n\
php artisan view:cache\n\
php artisan migrate --force --no-interaction\n\
\n\
# Start services\n\
php-fpm -D\n\
nginx -g 'daemon off;'\n" > /usr/local/bin/start-app.sh \
    && chmod +x /usr/local/bin/start-app.sh

# Expose port 80
EXPOSE 80

# Use the start script as the entrypoint
ENTRYPOINT ["/usr/local/bin/start-app.sh"]
