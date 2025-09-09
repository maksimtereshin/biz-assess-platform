#!/bin/sh

# Substitute environment variables in nginx config
if [ -z "$BACKEND_URL" ]; then
    echo "Warning: BACKEND_URL not set, using default"
    export BACKEND_URL="http://localhost:3001"
else
    # Ensure BACKEND_URL has protocol
    if [[ $BACKEND_URL != http* ]]; then
        export BACKEND_URL="https://$BACKEND_URL"
    fi
fi

echo "Configuring nginx to proxy API requests to: $BACKEND_URL"

# Replace template variables and create final nginx config
envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Test nginx configuration
nginx -t

# Start nginx
echo "Starting nginx..."
exec nginx -g 'daemon off;'