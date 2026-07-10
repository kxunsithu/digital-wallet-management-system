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

# Create user
RUN useradd -G www-data,root -u ${uid} -m ${user}

# Set working directory
WORKDIR /var/www

# Copy application
COPY --chown=${user}:${user} . .

# Install dependencies
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction

# Create required directories
RUN mkdir -p storage/framework/{cache,sessions,views} \
    && mkdir -p bootstrap/cache

# Set permissions
RUN chown -R ${user}:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

USER ${user}

# Render provides PORT automatically
ENV PORT=10000

EXPOSE 10000

CMD php artisan serve --host=0.0.0.0 --port=${PORT}