echo "Running startup.sh"
cp /home/site/wwwroot/nginx-default /etc/nginx/sites-available/default && service nginx reload && service supervisor restart

# Copy .user.ini to public directory
cp /home/site/wwwroot/user.ini /home/site/wwwroot/public/.user.ini

php /home/site/wwwroot/artisan migrate --force
echo "Migrated database"

# Create cache folders
cd /home/site/wwwroot/storage/
mkdir -p framework/{sessions,views,cache}
chmod -R 775 framework

# Optimize application for production
cd /home/site/wwwroot
php artisan optimize
echo "Optimized application (config, routes, views, events cached)"