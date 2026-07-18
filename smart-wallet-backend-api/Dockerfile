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
    sqlite-dev \
    bash

# Install PHP extensions
RUN docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
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


# Application directory
WORKDIR /var/www/html


# Copy project
COPY . .


# Install PHP dependencies
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction


# Create Laravel writable directories
RUN mkdir -p \
        storage/logs \
        bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache


# Configure Nginx
COPY docker/nginx.conf /etc/nginx/http.d/default.conf



# Create startup script
RUN printf '#!/bin/sh\n\
set -e\n\
\n\
echo "Starting Laravel application..."\n\
\n\
# Remove old env\n\
rm -f .env\n\
touch .env\n\
\n\
echo "Generating .env file..."\n\
\n\
# Copy only Laravel required environment variables\n\
for var in APP_NAME APP_ENV APP_KEY APP_DEBUG APP_URL AUTH_ADMIN_PHONE ADMIN_INITIAL_WALLET_BALANCE INFINIREACH_API_KEY INFINIREACH_BASE_URL INFINIREACH_SENDER_NUMBER AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_DEFAULT_REGION AWS_BUCKET AWS_USE_PATH_STYLE_ENDPOINT BCRYPT_ROUNDS BROADCAST_CONNECTION CACHE_STORE FILESYSTEM_DISK LOG_CHANNEL LOG_LEVEL MAIL_MAILER MAIL_HOST MAIL_PORT MAIL_USERNAME MAIL_PASSWORD MAIL_FROM_ADDRESS MAIL_FROM_NAME MEMCACHED_HOST QUEUE_CONNECTION REDIS_CLIENT REDIS_HOST REDIS_PASSWORD REDIS_PORT SESSION_DRIVER SESSION_LIFETIME SESSION_DOMAIN VITE_APP_NAME; do\n\
    eval value=\\$$var\n\
    if [ ! -z "$value" ]; then\n\
        echo "$var=$value" >> .env\n\
    fi\n\
done\n\
\n\
# Handle Render PostgreSQL DATABASE_URL\n\
if [ ! -z "$DATABASE_URL" ]; then\n\
    echo "Configuring PostgreSQL from DATABASE_URL..."\n\
\n\
    echo "DATABASE_URL=$DATABASE_URL" >> .env\n\
\n\
    DB_URL=$(echo $DATABASE_URL | sed "s/postgresql:\\/\\///")\n\
\n\
    DB_USERNAME=$(echo $DB_URL | cut -d":" -f1)\n\
    DB_PASSWORD=$(echo $DB_URL | cut -d":" -f2 | cut -d"@" -f1)\n\
    DB_HOST=$(echo $DB_URL | cut -d"@" -f2 | cut -d"/" -f1)\n\
    DB_DATABASE=$(echo $DB_URL | cut -d"/" -f2)\n\
\n\
    echo "DB_CONNECTION=pgsql" >> .env\n\
    echo "DB_HOST=$DB_HOST" >> .env\n\
    echo "DB_PORT=5432" >> .env\n\
    echo "DB_DATABASE=$DB_DATABASE" >> .env\n\
    echo "DB_USERNAME=$DB_USERNAME" >> .env\n\
    echo "DB_PASSWORD=$DB_PASSWORD" >> .env\n\
fi\n\
\n\
# Default API settings\n\
echo "SESSION_DRIVER=file" >> .env\n\
echo "CACHE_STORE=file" >> .env\n\
echo "QUEUE_CONNECTION=sync" >> .env\n\
echo "LOG_CHANNEL=stderr" >> .env\n\
\n\
# Fix permissions\n\
chmod -R 775 storage bootstrap/cache\n\
chown -R www-data:www-data storage bootstrap/cache\n\
\n\
echo "Clearing Laravel cache..."\n\
php artisan config:clear\n\
php artisan cache:clear || true\n\
\n\
echo "Creating Laravel cache..."\n\
php artisan config:cache\n\
php artisan route:cache || true\n\
php artisan view:cache || true\n\
\n\
echo "Running migrations..."\n\
php artisan migrate --force --no-interaction || exit 1\n\
\n\
echo "Starting PHP-FPM..."\n\
php-fpm -D\n\n\
echo "Starting Nginx..."\n\
nginx -g "daemon off;"\n\
' > /usr/local/bin/start-app.sh \
&& chmod +x /usr/local/bin/start-app.sh



# Expose Render port
EXPOSE 80


# Start application
ENTRYPOINT ["/usr/local/bin/start-app.sh"]