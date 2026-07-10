FROM php:8.3-cli

# Arguments
ARG user=www
ARG uid=1000

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    zip \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    libzip-dev \
    && docker-php-ext-install \
        pdo_pgsql \
        pgsql \
        mbstring \
        bcmath \
        exif \
        pcntl \
        gd \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*


# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer


# Create application user
RUN useradd -G www-data,root -u ${uid} -m ${user}


# Working directory
WORKDIR /var/www


# Copy project files
COPY --chown=${user}:${user} . .


# Install PHP dependencies
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction


# Create Laravel directories
RUN mkdir -p storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    bootstrap/cache


# Permission
RUN chown -R ${user}:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache


USER ${user}


ENV PORT=10000
ENV AUTH_SEEDED_ADMIN_PHONE=+959944074981

EXPOSE 10000


# Run migrations before starting server
CMD php artisan storage:link || true && \
    php artisan migrate --force && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache && \
    php artisan serve --host=0.0.0.0 --port=${PORT}