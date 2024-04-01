# Inicio de proyecto, configuración
## Usando nodemon
### 1. Crear package.json 
1. Ejecutar comando 
``` bash
npm init
```

### 2. Inicializar TypeScript y demás paquetes
1. Instalar.

``` bash
npm i -D typescript @types/node ts-node nodemon rimraf
```

2. Inciailziar el archivo de configuracióin de TypeScript (tsconfig.json)

``` bash
npx tsc --init --outDir dist/ --rootDir src
```

3. Crear archivo nodemon.json

``` json
{
    "watch": ["src"],
    "ext": ".ts,.js",
    "ignore": [],
    "exec": "npx ts-node ./src/app.ts"
}
```

4. Excluir módulos de node e incluir la carpeta de src en tsconfig.json 

``` json
{
  "exclude": ["node_modules"],
"include": ["src/**/*"],
  "compilerOptions": {
```

5. Definir scripts en package.json

``` json
  "scripts": {
    "dev": "ts-node src/app.ts",
    "dev:nodemon": "nodemon",
    "build": "rimraf ./dist && tsc",
    "start": "npm run build && node dist/app.js"
  },
```

## Node con TypeScript - TS-Node-dev (preferido)
0. Iniciar package.json
1. Instalar TypeScript y demás dependencias
``` bash
npm i -D typescript @types/node ts-node-dev rimraf
```
2. Inicializar el archivo de configuración de TypeScript ( Se puede configurar al gusto)
``` bash
npx tsc --init --outDir dist/ --rootDir src
```

3. Crear scripts para dev, build y start ([Más sobre TS-Node-dev aquí](https://www.npmjs.com/package/ts-node-dev))
``` json
  "dev": "tsnd --respawn --clear src/app.ts",
  "build": "rimraf ./dist && tsc",
  "start": "npm run build && node dist/app.js"
```

4. Excluir folders en tsconfig e incluir solo src:
``` json
{
  "exclude": ["node_modules", "dist"],
  "include": ["src"],
```

# Variables de entorno
https://www.npmjs.com/package/dotenv

``` bash
npm i dotenv
```

## Validaciones en env
https://www.npmjs.com/package/env-var

``` bash
npm i env-var
```