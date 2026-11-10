
FROM php:8.2-apache

RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /var/www/html

COPY . /var/www/html/

EXPOSE 80

CMD ["bash", "-lc", "a2dismod mpm_event mpm_worker || true; rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.*; a2enmod mpm_prefork; apache2ctl -t; exec apache2-foreground"]
