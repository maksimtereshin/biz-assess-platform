#!/bin/sh

# Substitute environment variables in nginx config
if [ -z "$BACKEND_URL" ]; then
    echo "Warning: BACKEND_URL not set, using default"
    export BACKEND_URL="http://localhost:3001"
else
    # Ensure BACKEND_URL has protocol
    case "$BACKEND_URL" in
        http*)
            # Already has protocol, use as-is
            ;;
        *)
            # No protocol, add https://
            export BACKEND_URL="https://$BACKEND_URL"
            ;;
    esac
fi

echo "Configuring nginx to proxy API requests to: $BACKEND_URL"

# Test backend connectivity before starting nginx
echo "Testing backend connectivity..."
if wget --spider --timeout=10 "$BACKEND_URL/api/health" 2>/dev/null; then
    echo "✅ Backend is reachable at $BACKEND_URL"
else
    echo "❌ Backend is not reachable at $BACKEND_URL"
    echo "This may cause 502 errors. Check backend service status."
fi

# Replace template variables and create final nginx config
envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Test nginx configuration with retries for backend service availability
echo "Testing nginx configuration..."
retry_count=0
max_retries=30
while [ $retry_count -lt $max_retries ]; do
    if nginx -t; then
        echo "Nginx configuration test passed"
        break
    else
        retry_count=$((retry_count + 1))
        echo "Nginx configuration test failed (attempt $retry_count/$max_retries). Backend service may not be available yet..."
        if [ $retry_count -lt $max_retries ]; then
            echo "Retrying in 10 seconds..."
            sleep 10
        else
            echo "Max retries reached. Starting nginx anyway..."
            break
        fi
    fi
done

# Start nginx
echo "Starting nginx..."
exec nginx -g 'daemon off;'