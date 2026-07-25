#!/bin/sh

# Create .env from environment variables for Laravel to read
# Filter out problematic environment variables that can corrupt the .env file
printenv | grep -E "^(APP_|DB_|INFINIREACH_|AUTH_|ADMIN_|SESSION_|CACHE_|QUEUE_)" > .env

# If DATABASE_URL is provided by Render, map it to DB_URL for Laravel
if [ ! -z "$DATABASE_URL" ]; then
    echo "DB_URL=$DATABASE_URL" >> .env
fi

# Generate application key
php artisan key:generate --force --no-interaction

# Run database migrations (fresh)
php artisan migrate:fresh --force --no-interaction

# Cache configuration, routes, and views
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start PHP-FPM
php-fpm -D

# Start Nginx
nginx -g 'daemon off;'
