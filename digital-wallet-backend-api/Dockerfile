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

# Configure PHP upload limits for profile pictures
COPY docker/php.ini $PHP_INI_DIR/conf.d/zz-uploads.ini

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
echo "==> Starting Digital Wallet API..."\n\
\n\
# ── 1. Build .env from environment variables ────────────────────────────\n\
rm -f .env\n\
touch .env\n\
\n\
echo "==> Generating .env from environment..."\n\
for var in APP_NAME APP_ENV APP_KEY APP_DEBUG APP_URL AUTH_ADMIN_PHONE ADMIN_INITIAL_WALLET_BALANCE INFINIREACH_API_KEY INFINIREACH_BASE_URL INFINIREACH_SENDER_NUMBER AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_DEFAULT_REGION AWS_BUCKET AWS_USE_PATH_STYLE_ENDPOINT BCRYPT_ROUNDS BROADCAST_CONNECTION CACHE_STORE FILESYSTEM_DISK LOG_CHANNEL LOG_LEVEL MAIL_MAILER MAIL_HOST MAIL_PORT MAIL_USERNAME MAIL_PASSWORD MAIL_FROM_ADDRESS MAIL_FROM_NAME MEMCACHED_HOST QUEUE_CONNECTION REDIS_CLIENT REDIS_HOST REDIS_PASSWORD REDIS_PORT SESSION_DRIVER SESSION_LIFETIME SESSION_DOMAIN VITE_APP_NAME; do\n\
    eval value=\\$$var\n\
    if [ ! -z "$value" ]; then\n\
        echo "$var=$value" >> .env\n\
    fi\n\
done\n\
\n\
# ── 2. Parse DATABASE_URL (Render PostgreSQL) ────────────────────────────\n\
if [ ! -z "$DATABASE_URL" ]; then\n\
    echo "==> Configuring PostgreSQL from DATABASE_URL..."\n\
    echo "DATABASE_URL=$DATABASE_URL" >> .env\n\
\n\
    DB_URL=$(echo $DATABASE_URL | sed "s/postgresql:\\/\\///")\n\
    DB_USERNAME=$(echo $DB_URL | cut -d":" -f1)\n\
    DB_PASSWORD=$(echo $DB_URL | cut -d":" -f2 | cut -d"@" -f1)\n\
    DB_HOST=$(echo $DB_URL | cut -d"@" -f2 | cut -d"/" -f1 | cut -d":" -f1)\n\
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
# ── 3. Defaults ─────────────────────────────────────────────────────────\n\
echo "SESSION_DRIVER=file" >> .env\n\
echo "CACHE_STORE=file" >> .env\n\
echo "QUEUE_CONNECTION=sync" >> .env\n\
echo "LOG_CHANNEL=stderr" >> .env\n\
\n\
# ── 4. Storage permissions ───────────────────────────────────────────────\n\
chmod -R 775 storage bootstrap/cache\n\
chown -R www-data:www-data storage bootstrap/cache\n\
\n\
# ── 5. Storage symlink ───────────────────────────────────────────────────\n\
rm -rf public/storage\n\
php artisan storage:link\n\
\n\
# ── 6. Clear stale bootstrap caches (safe on redeploy) ──────────────────\n\
# We clear only compiled/cached files, NOT app data or DB.\n\
echo "==> Clearing stale bootstrap caches..."\n\
php artisan config:clear\n\
php artisan view:clear || true\n\
php artisan route:clear || true\n\
\n\
# ── 7. Wait for database to be reachable ────────────────────────────────\n\
echo "==> Waiting for database..."\n\
MAX_TRIES=30\n\
COUNT=0\n\
until php artisan db:show --no-interaction > /dev/null 2>&1 || [ $COUNT -eq $MAX_TRIES ]; do\n\
    COUNT=$((COUNT+1))\n\
    echo "    Attempt $COUNT/$MAX_TRIES - DB not ready, retrying in 2s..."\n\
    sleep 2\n\
done\n\
if [ $COUNT -eq $MAX_TRIES ]; then\n\
    echo "ERROR: Database not reachable after $MAX_TRIES attempts. Aborting."\n\
    exit 1\n\
fi\n\
echo "==> Database is ready."\n\
\n\
# ── 8. Run ONLY new migrations (never wipes data) ───────────────────────\n\
# migrate --force applies only pending migrations. Existing tables and\n\
# data are never touched. Safe to run on every redeploy.\n\
echo "==> Running pending migrations..."\n\
php artisan migrate --force --no-interaction\n\
\n\
# ── 9. Cache config/routes AFTER migrations succeed ─────────────────────\n\
echo "==> Caching config and routes..."\n\
php artisan config:cache\n\
php artisan route:cache || true\n\
php artisan view:cache || true\n\
\n\
# ── 10. Start services ───────────────────────────────────────────────────\n\
echo "==> Starting PHP-FPM..."\n\
php-fpm -D\n\
\n\
echo "==> Starting Nginx..."\n\
exec nginx -g "daemon off;"\n\
' > /usr/local/bin/start-app.sh \
&& chmod +x /usr/local/bin/start-app.sh



# Expose Render port
EXPOSE 80


# Start application
ENTRYPOINT ["/usr/local/bin/start-app.sh"]