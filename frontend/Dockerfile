# =====================================================
# KING ICE GOLD - Frontend Dockerfile (Nginx)
# =====================================================
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static files
COPY . /usr/share/nginx/html

# Remove non-web files from the served directory
RUN rm -f /usr/share/nginx/html/Dockerfile \
          /usr/share/nginx/html/nginx.conf \
          /usr/share/nginx/html/.dockerignore

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
