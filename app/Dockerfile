FROM nginx:latest
MAINTAINER Keith Moss <keithamoss@gmail.com>

RUN rm -rf /etc/nginx
COPY nginx /etc/nginx

#EXPOSE 80 443
EXPOSE 80

RUN apt-get update
RUN apt-get install --assume-yes curl gnupg
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install --assume-yes nodejs

# RUN ["chmod", "+x", "/app/docker-entrypoint.sh"]
ENTRYPOINT ["/app/docker-entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]
