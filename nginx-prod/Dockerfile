FROM nginx:1.15.7-alpine
LABEL maintainer="<keithamoss@gmail.com>"

# Copy our local nginx config in
RUN rm -rf /etc/nginx
COPY nginx /etc/nginx

EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]

# ADD automatically uncompresses the tgz files for us
ADD build/frontend.tgz /frontend/scremsong/
ADD build/django.tgz /frontend/scremsong-api/
