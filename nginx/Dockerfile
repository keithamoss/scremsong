FROM nginx:1.15.0-alpine
MAINTAINER Keith Moss <keithamoss@gmail.com>

RUN cp /etc/nginx/uwsgi_params /var/tmp/uwsgi_params
RUN rm -rf /etc/nginx
COPY nginx /etc/nginx
RUN cp /var/tmp/uwsgi_params /etc/nginx/uwsgi_params

CMD ["nginx", "-g", "daemon off;"]
