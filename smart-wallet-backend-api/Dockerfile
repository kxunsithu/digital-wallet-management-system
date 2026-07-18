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
    && docker-php-ext-install -j$(nproc) \
    gd \
    pdo_mysql \
    pdo_pgsql \
    pdo_sqlite \
    zip \
    bcmath \
    exif \
    pcntl \
    opcache

# Install Composer
COPY --from=composer/composer:latest-bin /composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

# Install dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Create required directories
RUN mkdir -p storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

# Configure nginx
COPY docker/nginx.conf /etc/nginx/http.d/default.conf


# Start script
RUN printf '#!/bin/sh\n\
set -e\n\
\n\
echo "Generating Laravel environment file..."\n\
\n\
# Create empty env file\n\
touch .env\n\
\n\
# Only copy Laravel required variables\n\
for var in APP_NAME APP_ENV APP_KEY APP_DEBUG APP_URL DB_CONNECTION DB_HOST DB_PORT DB_DATABASE DB_USERNAME DB_PASSWORD DATABASE_URL SESSION_DRIVER CACHE_STORE QUEUE_CONNECTION LOG_CHANNEL LOG_LEVEL FILESYSTEM_DISK MAIL_MAILER MAIL_HOST MAIL_PORT MAIL_USERNAME MAIL_PASSWORD MAIL_FROM_ADDRESS MAIL_FROM_NAME AUTH_ADMIN_PHONE ADMIN_INITIAL_WALLET_BALANCE INFINIREACH_API_KEY INFINIREACH_BASE_URL INFINIREACH_SENDER_NUMBER; do\n\
    eval value=\\$$var\n\
    if [ ! -z "$value" ]; then\n\
        echo "$var=$value" >> .env\n\
    fi\n\
done\n\
\n\
echo "APP_KEY=$APP_KEY" >> .env\n\
\n\
# Laravel permissions\n\
chmod -R 775 storage bootstrap/cache\n\
chown -R www-data:www-data storage bootstrap/cache\n\
\n\
php artisan config:clear\n\
php artisan cache:clear\n\
php artisan config:cache\n\
\n\
# Run migrations safely\n\
php artisan migrate --force --no-interaction\n\
\n\
php-fpm -D\n\
nginx -g "daemon off;"\n\
' > /usr/local/bin/start-app.sh \
&& chmod +x /usr/local/bin/start-app.sh


EXPOSE 80

ENTRYPOINT ["/usr/local/bin/start-app.sh"]