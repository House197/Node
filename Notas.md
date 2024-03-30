# Notas
- Todo lo que se ejecuta en el archivo principal es síncrono.

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

## Typescript
- Se tiene la opción de VS CODE con CTRL + SHIFT + P de reload window para recargar de nuevo tsconfig.json, ya que a veces se coloca como incorrecto.
- Las dependencias @types siempre son de desarrollo no de producción.

## Sección 05. Testing.
- Se debe ir probando las piezas más pequeñas hasta las más grandes del código.
### Coverage
- Al correr npx jest --init hay una sección de coverage, el cual puede proveer de una gráfica qué tan cubiertp está el código con testing.

<img src='Imagenes\05-ConfigTestingConsola.png'></img>

### npm run test:watch
- Es diferente correr el comando en la terminal dada por VS CODE que presionar CTRL + SHIFT + P, buscar deug npm script y buscar el mismo comando.
    - La segunda opción permite correr el test directamente en VS CODE, lo que habilita poder colocar breakpoints.

### Evaluar objetos
- Ya que los objetos apuntan a diferentes espacios en memoria se puede recurrir a toEqual o toStrictEqual.

``` ts
    it('getUserById return John Doe if id is 2', () => {
        const id = 2;
        getUserById(id, (err, user) => {
            expect(err).toBeUndefined();
            expect(user).toStrictEqual(  {
                id: 2,
                name: 'Jane Doe',
              });
        })
    });
```

### Pruebas paquetes de terceros
- Las pruebas que importan en la librería son que funcionen en el código, no el paquete como tal ya que el paquete ya está probada por los desarrolladores.
    - En otras palabras, se debe probar cómo el código de terceros trabaja con el código propio.
- Para librerías como axios no se testea axios, se testea el resultado de funciones y métodos.

## Sección 06. Consola App
- La sola presencia de una bandera de tipo booleana ya la hace true.

### Casos de uso
- El software de capas de los casos de uso contiene las reglas de negocio específicas de la aplicación. Condensa e implementa todos los casos de uso del sistema. Estos casos de uso orquestan el flujo dentro y hacia las entidades.
- En TS es común trabajar con funciones, pero con JS se trabaja con Factory Functions comunmente.

<img src='Imagenes\06.CleanArq.png'></img>