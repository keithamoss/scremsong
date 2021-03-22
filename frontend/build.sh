cd frontend/

if [[ "$(pwd)" == */frontend ]]; then
    yarn

    rm -rf build
    mkdir -p build

    cp ../secrets/scremsong-frontend.prod.env .env.production
    yarn run build
    rm .env.production

    cd build && tar czvf ../../build/frontend.tgz .
fi