# Sección 03.
### Package.json Scripts
1. **Start** es especial, ya que solo se debe correr **npm start**. Para otros scripts se debe usar **npm run nameScript**.
    - Start siempre debe ser el que levanta la app en producción.

### Importacione y exportaciones.
1. Se recomienda exportar como objetos.

``` js
const emailTemplate = `
<div>
    <h1>Hi, {{name}}</h1>
    <p>Thank you for your order</p>
</div>`;

module.exports = {
    emailTemplate
}
```

2. Require ya realiza la ejecución del archivo que se importa.
3. Se debe intentar tener la dependencia de terceros al mínimo.

## Patrón adaptador
- Al usar dependencia de paquete de terceros se debe adaptar con código propio.

## Sección 04.
### Correr proyecto clonado
1. Correr npm i para instalar las dependencias.