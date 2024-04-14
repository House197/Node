# Sección 18. Autenticación y Autorización
## Temas
1. Preparar la base de datos
2. Encriptar mediante un hash de unas sola vía las contraseñas
3. Generar los tokens de acceso
4. Preparar todo el backend

- En este proyecto se usa una arquitectura de inyección por dependencias.

## 1. Modulo Auth Rutas y controladores.
1. Node\18-Autentication\src\presentation\auth\routes.ts

``` ts
import { Router } from 'express';

export class AuthRoutes {


  static get routes(): Router {

    const router = Router();
    
    // Definir las rutas
    router.post('/login', /*TodoRoutes.routes */ );
    router.post('/register', /*TodoRoutes.routes */ );
    router.get('/validate-email/:token', /*TodoRoutes.routes */ );

    return router;
  }
}
```

2. Definir rutas de auth en archivo principal de routes en root.

``` ts
import { Router } from 'express';
import { AuthRoutes } from './auth/routes';

export class AppRoutes {

  static get routes(): Router {

    const router = Router();
    
    // Definir las rutas
    router.use('/api/auth', AuthRoutes.routes );

    return router;
  }
}
```

3. Crear controlador. Node\18-Autentication\src\presentation\auth\constroller.ts

``` ts
import { Request, Response } from "express";

export class AuthController {

    //DI
    constructor(){}

    registerUser = (req: Request, res: Response) => {
        res.json('registerUser');
    }

    loginUser = (req: Request, res: Response) => {
        res.json('loginUser');
    }

    validateEmail = (req: Request, res: Response) => {
        res.json('email');
    }
}
```

4. Usar controladores en rutas de auth.

``` ts
import { Router } from 'express';
import { AuthController } from './constroller';

export class AuthRoutes {

  static get routes(): Router {

    const router = Router();

    const controller = new AuthController();
    
    // Definir las rutas
    router.post('/login', controller.loginUser );
    router.post('/register', controller.registerUser );
    router.get('/validate-email/:token', controller.validateEmail );

    return router;
  }
}
```

## 2. DB
1. Node\18-Autentication\src\data\mongo\mongo-database.ts
2. Leer pasos en Notas.

## 3. User Model
1. Node\18-Autentication\src\data\mongo\models\user.model.ts

``` ts
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    img: {
        type: String
    },
    role: {
        type: [String],
        default: ['USER_ROLE'],
        enum: ['ADMIN_ROLE', 'USER_ROLE']
    }
});

export const UserModel = mongoose.model('User', userSchema);
```

## 4. Errores personalizados
1. Node\18-Autentication\src\domain\errors\custom.error.ts
2. Se le colocan métodos estáticos para instanciar el error según sea el caso.

``` ts
export class CustomError extends Error {
    constructor(
        public readonly statusCode: number,
        public readonly message: string,
    ){
        super(message);
    }

    static badRequest(message: string) {
        return new CustomError(400, message);
    }

    static unauthorized(message: string) {
        return new CustomError(401, message);
    }

    static forbidden(message: string) {
        return new CustomError(403, message);
    }

    static notFound(message: string) {
        return new CustomError(404, message);
    }

    static internalServer(message: string) {
        return new CustomError(500, message);
    }
}
```

## 5. User Entity
1. Node\18-Autentication\src\domain\entities\user.entity.ts

``` ts
import { CustomError } from "../errors";

export class UserEntity {
    constructor(
        public id: string,
        public name: string,
        public email: string,
        public emailValidated: boolean,
        public password: string,
        public role: string[],
        public img?: string,
    ){}

    static fromOjbect(object: {[key: string]:any}) {
        const { id, _id, name, email, emailValidated, password, role, img } = object;

        if(!id && !_id) {
            throw CustomError.badRequest('Missing id');
        }

        if(!name) throw CustomError.badRequest('Missing name');
        if(!email) throw CustomError.badRequest('Missing email');
        if(emailValidated === undefined) throw CustomError.badRequest('Missing emailValidated');
        if(!password) throw CustomError.badRequest('Missing password');
        if(!role) throw CustomError.badRequest('Missing role');

        return new UserEntity(_id || id, name, email, emailValidated, password, role, img);
    }
}
``` 

## 6. Register User Dto
- Se crean Dtos por cada endpoint que se recibe información.
- Se crea con un constructor privado para poder instanciarlo solo por medio de métodos estáticos.

``` ts
import { regularExps } from "../../../config/regular-exp";

export class RegisterUserDto {
    private constructor(
        public name: string,
        public email: string,
        public password: string,
    ){}

    static create(object: {[key: string]:any}) : [string?, RegisterUserDto?]{
        const { name, email, password } = object;

        if(!name) return ['Missing name'];
        if(!email) return ['Missing email'];
        if(!regularExps.email.test(email)) return ['Missing is not valid'];
        if(!password) return ['Missing password'];
        if(password.length < 6) return ['Password too short'];

        return [undefined, new RegisterUserDto(name, email, password)];
    }
}
```

## 7. AuthService
- El servicio podría recibir el repositorio como dependencia para que así sea más fácil cambiar la DB en un futuro, pero por el momento se deja así por simplicidad.
- Se podría coloca el siguiente código en el controller para el registro de usuarios. Node\18-Autentication\src\presentation\auth\controller.ts

``` ts
export class AuthController {

    //DI
    constructor(){}

    registerUser = (req: Request, res: Response) => {
        const [error, registerDto] = RegisterUserDto.create(req.body);
        if(error) return res.status(400).json({error});
        res.json(registerDto);
    }
```

- En el código anterior, el método registerUser del constrolador no debería realizar el trabajo de creación, validación y todo el proceso, simplemente es el controlador de la ruta. Entonces, se crea un servicio el cual puede ser visto como un gestor de estado. Se encarga de todo el proceso de autenticación y del estado del usuario autenticado. Esto último no hace falta ya que se está trabajando con REST.
1. Node\18-Autentication\src\presentation\services\auth.service.ts
``` ts
import { UserModel } from "../../data";
import { RegisterUserDto, CustomError } from "../../domain";

export class AuthService {
    constructor(){}

    public async registerUser(resigetUserDto: RegisterUserDto) {
        const existUser = await UserModel.findOne({email: resigetUserDto.email});
        if(existUser) throw CustomError.badRequest('Email already exists');
        return 'todo ok!'
    }
}
```

2. Inyectar servicio como dependencia en auth/controller.
``` ts
export class AuthController {

    //DI
    constructor(
        public readonly authService: AuthService
    ){}
```

3. Inicializar AuthService (crear instancia).
    - Se puede crear la instancia al momento que se declaró como inyección de dependencia en el código anterior, pero se recomienda crear la instancia en el lugar en donde se necesita (archivo que indica error ya que pide se pase la dependencia al controller, auth/routes).

``` ts
export class AuthRoutes {

  static get routes(): Router {

    const router = Router();
    const authService = new AuthService();

    const controller = new AuthController(authService);
```

## 8. Crear usuario y manejo de errores
1. Afina método de creación de usuario en el servicio.
    - Si se trabajra con la arquitectura limpia en su totalidad registerUser debería ser un caso de uso.

``` ts
export class AuthService {
    constructor(){}

    public async registerUser(resigetUserDto: RegisterUserDto) {
        const existUser = await UserModel.findOne({email: resigetUserDto.email});
        if(existUser) throw CustomError.badRequest('Email already exists');
        
        try {
            const user = new UserModel(resigetUserDto);
            await user.save();
            // Encriptar la constraseña

            // JWT para matener la autenticación del usuario.

            // Email de confirmación
            return user;
        } catch (error) {
            throw CustomError.internalServer(`${error}`);
        }
    }
}
```

2. Manejar el error en el controlador.
    - Se crea un método privado para manejar el error, el cual se va a usar en los catch.
    - Un ejemplo del error puede ser que el email ya exista, lo cual se considera un bad request.

``` ts
export class AuthController {

    //DI
    constructor(
        public readonly authService: AuthService
    ){}

    private handleError = (error: unknown, res: Response) => {
        if(error instanceof CustomError) {
            return res.status(error.statusCode).json({error: error.message});
        }

        console.log(`${error}`);
        return res.status(500).json({error: 'Internal server error'});
    }

    registerUser = (req: Request, res: Response) => {
        const [error, registerDto] = RegisterUserDto.create(req.body);
        if(error) return res.status(400).json({error});
        this.authService.registerUser(registerDto!)
            .then(user => res.json(user))
            .catch(error => this.handleError(error, res));
    }
```

3. Crear instancia de entidad de usuario con el user que retorna la db en el service al momento de crear el usuario, lo cual sirve para hacer destructuración y no mandar la password.

``` ts
export class AuthService {
    constructor(){}

    public async registerUser(resigetUserDto: RegisterUserDto) {
        const existUser = await UserModel.findOne({email: resigetUserDto.email});
        if(existUser) throw CustomError.badRequest('Email already exists');
        
        try {
            const user = new UserModel(resigetUserDto);
            await user.save();
            // Encriptar la constraseña

            // JWT para matener la autenticación del usuario.

            // Email de confirmación
            const {password, ...rest} = UserEntity.fromObject(user);

            return {...rest, token:'ABC'};
        } catch (error) {
            throw CustomError.internalServer(`${error}`);
        }
    }
}
```

## 9. Encriptar contraseñas
1. Instalar dependencia bcryptjs. https://www.npmjs.com/package/bcryptjs
``` bash
npm i bcryptjs
```

``` bash
npm i -D @types/bcryptjs
```

2. Aplicar patrón adaptador.

``` ts
import { compareSync, genSaltSync, hashSync } from "bcryptjs"

export const bcrypt = {
    hash: (password: string) => {
        const salt = genSaltSync();
        return hashSync(password, salt);
    },

    compare: (password: string, hashed: string) => {
        return compareSync(password, hashed);
    }
}
```

3. Usar en AuthService.

``` ts
        try {
            const user = new UserModel(registerUserDto);

            // Encriptar la constraseña
            user.password = bcryptAdapter.hash(registerUserDto.password)

            await user.save();
            // JWT para matener la autenticación del usuario.

            // Email de confirmación
            const {password, ...rest} = UserEntity.fromObject(user);

            return {...rest, token:'ABC'};
        }
```

## 10. Login del usuario
1. Creación de DTO.
    - En el DTO se colocan las propiedades que se esperan.
    - En el DTO se hacen las validaciones, en donde si todo está bien se crea la instancia del DTO.

``` ts
import { regularExps } from '../../../config/regular-exp';
export class LoginUserDto {
    constructor(
        public email: string,
        public password: string,
    ){}

    static login(object: {[key: string]: string}): [string?, LoginUserDto?]{
        const { email, password } = object;

        if(!email) return ['Missing email'];
        if(!regularExps.email.test(email)) return ['Missing is not valid'];
        if(!password) return ['Missing password'];

        return [undefined, new LoginUserDto(email,password)];
    }
}
```

2. Crear método de login en AuthService.
    1. Verificar que el usuario existe.
    2. Aplicar isMatch para la la contraseña.
    3. Crear instancia de la entidad de usuario.
    4. Retornar el user sin el password y el token hardcodeado.

``` ts
    public async loginUser(loginUserDto: LoginUserDto) {
        const user = await UserModel.findOne({email: loginUserDto.email});
        if(!user) throw CustomError.badRequest('User does not exists');

        try {
            const passwordMatches = bcryptAdapter.compare(loginUserDto.password, user.password);
            if(!passwordMatches) throw CustomError.badRequest('Password is incorrect');

            const {password, ...rest} = UserEntity.fromObject(user);

            return {
                user: rest,
                token: 'ABC'
            }
            
        } catch (error) {
            throw CustomError.internalServer(`${error}`);
        }

    }
```

3. Implementar en controlador.
    - Usar método estático de de DTO para extraer error e instancia de DTO.
    - Verificar que no hay error.
    - Llamar al servicio para empezar proceso de login.

``` ts
    loginUser = (req: Request, res: Response) => {
        const [ error, loginDto ] = LoginUserDto.login(req.body);
        if(error) return res.status(400).json({error});
        this.authService.loginUser(loginDto!)
            .then(user => res.json(user))
            .catch(error => this.handleError(error, res));
    }
```

4. Verificar que la ruta esté establecida y se llame al controlador correcto.

## 11. Introduccióin a JWTs
### 1. Instalar dependencias
1. https://www.npmjs.com/package/jsonwebtoken
``` bash
npm i jsonwebtoken
npm i @types/jsonwebtoken
```

### 2. Patrón adaptador.
- El patrón adaptador puede ser con un objeto o clase. En este caso se hace con clase para ilustrar cómo es.
- Si no se tienen inyección de dependencias entonces se puede trabajar con métodos estáticos.
- Se define al payload como any para poder hacerlo genérico para que se le pueda mandar un objeto, string, etc.
    - Se puede hacer estricto si por ejemplo solo se usara paragenerar el payload de una petición login.

``` ts
import jwt  from "jsonwebtoken";

export class JwtAdapter {
    static async generateToken(payload: any, duration: string = '2h') {

        return new Promise((resolve) => {
            jwt.sign(payload, "SEED", {expiresIn: duration}, (err, token) => {
                if(err) resolve(null);
                resolve(token)
            })
        })
    }

    static validateToken(token: string) {
        
    }
}
```

### 3. Crear token en AuthService
- En el payload se coloca el id del usuario.

``` ts
    public async loginUser(loginUserDto: LoginUserDto) {
        const user = await UserModel.findOne({email: loginUserDto.email});
        if(!user) throw CustomError.badRequest('User does not exists');

        try {
            const passwordMatches = bcryptAdapter.compare(loginUserDto.password, user.password);
            if(!passwordMatches) throw CustomError.badRequest('Password is incorrect');

            const {password, ...rest} = UserEntity.fromObject(user);
            const token = await JwtAdapter.generateToken({id: user.id});
            if(!token) throw CustomError.internalServer('Error while creating JWT');
            return {
                user: rest,
                token: token
            }
            
        } catch (error) {
            throw CustomError.internalServer(`${error}`);
        }

    } 
```

### 4. JWT Seed
1. Generar variable de entorno para almacenar seed.
2. Colocar varaible de entorno en envs (config)

``` ts
export const envs = {

  PORT: get('PORT').required().asPortNumber(),
  MONGO_URL: get('MONGO_URL').required().asString(),
  MONGO_DB_NAME: get('MONGO_DB_NAME').required().asString(),
  JWT_SEED: get('JWT_SEED').required().asString(),
}

```

3. Idealmente se debería recibir la semilla por medio de inyección al constructor, pero por el momento solo se especifica en el mismo archivo.

``` ts
import jwt  from "jsonwebtoken";
import { envs } from "./envs";

const JWT_SEED = envs.JWT_SEED;

export class JwtAdapter {
    static async generateToken(payload: any, duration: string = '2h') {

        return new Promise((resolve) => {
            jwt.sign(payload, JWT_SEED, {expiresIn: duration}, (err, token) => {
                if(err) resolve(null);
                resolve(token)
            })
        })
    }

    static validateToken(token: string) {
        
    }
}
```

# Sección 19. Enviar correro + Validación de Tokens
## Temas
1. Envío de correo
2. Creación de links de retorno
3. ngrok para tunneling
4. Variables de entorno para facilitar sus cambios
5. Pruebas de conexión y validación desde el celular
6. Pruebas hacia el localhost desde internet

## 1. Email Service
1. Instalar dependencia
``` bash
npm i nodemailer
npm install --save @types/nodemailer
```

2. Definir variables de entorno y actualizar envs.
3. Crear servicio. src\presentation\services\email.service.ts
    - El código es el mismo que el que se ocupó en 8-NOC.
    - Se corrige el problema de las dependencias oculta
        1. Quitar inicialización de trasporter y definirlo como una inyección de dependencia.

``` ts
import nodemailer, { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  htmlBody: string;
  attachements?: Attachement[];
}

export interface Attachement {
  filename: string;
  path: string;
}

export class EmailService {

  private transporter: Transporter

  constructor(
    mailerService: string,
    mailerEmail: string,
    senderEmailPassword: string
  ) {
    this.transporter = nodemailer.createTransport( {
        service: mailerService,
        auth: {
          user: mailerEmail,
          pass: senderEmailPassword,
        }
      });
  }


  async sendEmail( options: SendMailOptions ): Promise<boolean> {

    const { to, subject, htmlBody, attachements = [] } = options;


    try {

      const sentInformation = await this.transporter.sendMail( {
        to: to,
        subject: subject,
        html: htmlBody,
        attachments: attachements,
      });

      // console.log( sentInformation );

      return true;
    } catch ( error ) {
      return false;
    }

  }
}
```

4. Obtener Key como se vio con NOC. https://myaccount.google.com/security
    - Crear nuevo acceso para nueva aplicación. https://myaccount.google.com/u/0/apppasswords?rapt=AEjHL4OqxssGd-CX83q5G3UnD2i1CsZyx76O6u0MfZ3Ep4kIe-dlZpkJGnwQ49L1ZU4qxEVyZfcDFBe5rtVlz5G6Ha7CogjjsC7nwsuo4lC3eYnGid_ScdI
    - Colocar nueva llave en .env MAILER_SECRET_KEY

## 2. Enviar correo con link de verificación
1. Generar variable de entorno para guardar el link de la api.
    - Actualizar envs.
2. Realizar inyección de servicio a AuthService y del webservice_url

``` ts
export class AuthService {
    constructor(
        private readonly emailService: EmailService,
        private readonly webserviceUrl: string,
    ){} 
```

3. Definir método sendEmailValidationLink, el cual podría ser un caso de uso.

``` ts
    private sendEmailValidationLink = async (email: string) => {
        const token = await JwtAdapter.generateToken({email});
        if(!token) throw CustomError.internalServer('Error getting token');

        const link = `${this.webserviceUrl}/auth/validate-email/${token}`;
        const html = `
            <h1>Validate your email</h1>
            <p>Click on the following link to validate your email</p>
            <a href="${link}">Validate email: ${email}</a>
        `;

        const options = {
            to: email,
            subject: 'Validate your email',
            htmlBody: html,
        };

        const isSet = await this.emailService.sendEmail(options);
        if(!isSet) throw CustomError.internalServer('Error sending email');

        return true;
    }
```

4. Llamar método en creación de usuario.

``` ts
    public async registerUser(registerUserDto: RegisterUserDto) {
        const existUser = await UserModel.findOne({email: registerUserDto.email});
        if(existUser) throw CustomError.badRequest('Email already exists');
        
        try {
            const user = new UserModel(registerUserDto);

            // Encriptar la constraseña
            user.password = bcryptAdapter.hash(registerUserDto.password)

            await user.save();
            // JWT para matener la autenticación del usuario.
            const token = await JwtAdapter.generateToken({id: user.id});
            if(!token) throw CustomError.internalServer('Error while creating JWT');

            // Email de confirmación
            this.sendEmailValidationLink(user.email);
            ...
```

5. Pasar dependencias a instancia de AuthService, lo cual es en auth/routes.

``` ts
export class AuthRoutes {

  static get routes(): Router {

    const router = Router();
    const emailService = new EmailService(
      envs.MAILER_SERVICE, 
      envs.MAILER_EMAIL,
      envs.MAILER_SECRET_KEY
    );
    const webserviceUrl = envs.WEBSERVICE_URL;
    const authService = new AuthService(emailService, webserviceUrl);

```

## 3. Implementar validateEmail
1. En jwt.adapter. Se usan genéricos.

``` ts
    static validateToken<T>(token: string): Promise<T|null> {
        return new Promise((resolve) => {
            jwt.verify(token, JWT_SEED, (err, decoded) => {
                if(err) return resolve(null);
                resolve(decoded as T);
            })
        });
    }
``` 

2. En AuthService.

``` ts
    public async validateEmail(token: string) {
        const payload = await JwtAdapter.validateToken(token);
        if(!payload) throw CustomError.unauthorized('Invalid token');

        // Ya que payload es de tipo any se usa un cast
        const{ email } = payload as {email: string};
        if(!email) throw CustomError.internalServer('Email not in token');

        const user = await UserModel.findOne({email});
        if(!user) throw CustomError.internalServer('Email not exists');

        user.emailValidated = true;
        await user.save();

        return true;
    }
```

3. Controlador.
``` ts
    validateEmail = (req: Request, res: Response) => {
        const { token } = req.params;
        this.authService.validateEmail(token)
        .then(() => res.json('Email validated'))
        .catch(error => this.handleError(error, res));
    }
```

## 4. ngrok - Tunneling
- Por el momento el link del email apunta solo al localhost de la computadora, por lo que no sería posible validar el email desde un celular.
- ngrok permite exponer un puerto de la computadora.
1. Crear cuenta. https://ngrok.com/ 
2. Instalar.
    - La instalación varía según es os. https://cursos.devtalles.com/courses/take/nodejs-de-cero-a-experto/lessons/48371972-ngrok-tunneling-instalacion
    - En Windoes se descarga el ejecutable, se coloca en una carpeta y esa dirección se coloca en el PATH para poder usar el comando ngrok.
3. Colocar token de acceso.
    - En el sitio de token se tiene el apartado de getting started -> Your authtoken, en donde se tiene el comando line.

``` bash
ngrok config add-authtoken <token>
```

4. Exponer puerto de la aplicación:

``` bash
ngrok http 3000
```

5. Colocar enlace que da ngrok como WEBSERVICE_URL en las variables de entorno de la app, concatenando la palabra api al final.
    - Esto permite poder volver a probar en el celular.

``` bash
WEBSERVICE_URL=https://33b3-187-189-215-146.ngrok-free.app/api
```

## 5. CSCode Ports
https://cursos.devtalles.com/courses/take/nodejs-de-cero-a-experto/lessons/48751709-vscode-ports
- VS Code también permite exponer puertos, en donde en la sección de la terminal se tiene el apartado de PORTS.
    - Se selecciona forward a port, se vincula github.

# Sección 20. Protección de rutas, relaciones, middlewares y paginación.
## Temas
1. Middlewares
2. Rutas
3. Modelos
4. Validación de token
5. Query parameters
6. Estrategias de paginación
7. Manejo de errores
8. Consideración sobre uso de servicios y inyección de dependencias.

## 1. Deshabilitar envío de correos.
1. Ya que ya se ha probado se puede crear una variable de entorno que permita saber si enviar correos o no.

``` ts
SEND_EMAIL: get('SEND_EMAIL').default('false').asBool()
```

2. Colocar variable en depnedencias de EmailService

``` ts

export class EmailService {

  private transporter: Transporter

  constructor(
    mailerService: string,
    mailerEmail: string,
    senderEmailPassword: string,
    private readonly postToProvider: boolean
```

3. Usar variable en método sendEmail

``` ts
  async sendEmail( options: SendMailOptions ): Promise<boolean> {

    const { to, subject, htmlBody, attachements = [] } = options;


    try {
      if(!this.postToProvider) return true;
      await this.transporter.sendMail( {
        to: to,
        subject: subject,
        html: htmlBody,
        attachments: attachements,
      });

```

4. Pasar variable al instanciar servicio.

``` TS
export class AuthRoutes {

  static get routes(): Router {

    const router = Router();
    const emailService = new EmailService(
      envs.MAILER_SERVICE, 
      envs.MAILER_EMAIL,
      envs.MAILER_SECRET_KEY,
      envs.SEND_EMAIL
    );
```

## 2. Preparación de los modelos restantes
### Category
- Se crea una relación con el modelo de user.

``` ts
import mongoose, { Schema } from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    available: {
        type: Boolean,
        default: false,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
});

export const CategoryModel = mongoose.model('Category', categorySchema);
```

### Product

``` ts
import mongoose, { Schema } from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        unique: true
    },
    available: {
        type: Boolean,
        default: false,
    },
    price: {
        type: Number, 
        default: 0,
    },
    description: {
        type: String
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    }
});

export const ProductModel = mongoose.model('Product', productSchema);
```

## 3. Category Rutas y Controlador
1. Crear controlador. src -> presentation -> categories -> controller.ts

``` ts
import { Response } from "express";
import { CustomError } from "../../domain";

export class CategoryController {
    constructor(){}

    private handleError = (error: unknown, res: Response) => {
        if(error instanceof CustomError) {
            return res.status(error.statusCode).json({error: error.message});
        }

        console.log(`${error}`);
        return res.status(500).json({error: 'Internal server error'});
    }

    createCategory = async(req: Request, res: Response) => {
        res.json('Create Category')
    }

    getCategory = async(req: Request, res: Response) => {
        res.json('Get Category')
    }
}
```

2. Crear rutas. src -> presentation -> categories -> routes.ts

``` ts
import { Router } from 'express';
import { CategoryController } from './controller';

export class CategoryRoutes {

  static get routes(): Router {

    const router = Router();
    const controller = new CategoryController();
    
    // Definir las rutas
    router.get('/', controller.getCategory);
    router.post('/', controller.createCategory);

    return router;
  }
}
```

3. Asignar nuevas rutas en sistemas de rutas principal. Node\18-Autentication\src\presentation\routes.ts

``` ts
import { Router } from 'express';
import { AuthRoutes } from './auth/routes';
import { CategoryRoutes } from './categories/routes';

export class AppRoutes {

  static get routes(): Router {

    const router = Router();
    
    // Definir las rutas
    router.use('/api/auth', AuthRoutes.routes );
    router.use('/api/categories', CategoryRoutes.routes );

    return router;
  }
}

```

## 4. Create Category DTO
1. Node\18-Autentication\src\domain\dtos\category\create-category.dto.ts

``` ts
export class CreateCategoryDto {
    private constructor(
        public readonly name: string,
        public readonly available: boolean,
    ){}

    static create(object: {[key: string]: any}): [string?, CreateCategoryDto?] {
        const { name, available } = object;
        let availableBoolean = available;

        if(!name) return ['Missing name']
        if(typeof available !== 'boolean'){
            availableBoolean = (available === 'true')
        }

        return [undefined, new CreateCategoryDto(name, availableBoolean)];
    }
}
```

2. Usarlo en controller de category.

``` ts
    createCategory = async(req: Request, res: Response) => {
        const [error, createCategoryDto] = CreateCategoryDto.create(req.body);
        if(error) return res.status(400).json({error});
        res.json('Create Category')
    }
```

## 5. AuthMiddleware Proteger Rutas
1. Se planea colocar en req.body una instancia de UserEntity.

``` ts
import { NextFunction, Request, Response } from "express";
import { JwtAdapter } from "../../config";
import { UserModel } from "../../data";
import { UserEntity } from "../../domain";

export class AuthMiddleware {
    static async validateJWT(req: Request, res: Response, next: NextFunction) {
        const authorization = req.header('Authorization');
        if(!authorization) return res.status(401).json({ error: 'No token provider'})
        if(!authorization.startsWith('Bearer ')) return res.status(401).json({ error: 'Invalidad Bearer token'})
        const token = authorization.split(' ').at(1) || '';
        
        try {
            const payload = await JwtAdapter.validateToken<{id: string}>(token);
            if(!payload) return res.status(401).json({error: 'Invalid Token'});
            const user = await UserModel.findById(payload.id);
            if(!user) return res.status(401).json({error: 'Invalid token - user'});
            // TODO: Validar que el usuario esté activo.
            req.body.user = UserEntity.fromObject(user);

            next();
        } catch (error) {
            console.log(error);
            res.status(500).json({error: 'Internal Server Error'});
        }
    }
}
``` 

## 6. Puebas.
- En las rutas los middlewares se pueden colocar como argumento o como un arreglo, lo cual es mejor para poder expandir en un futuro.

``` ts
import { Router } from 'express';
import { CategoryController } from './controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

export class CategoryRoutes {

  static get routes(): Router {

    const router = Router();
    const controller = new CategoryController();
    
    // Definir las rutas
    router.get('/', controller.getCategory);
    router.post('/', [AuthMiddleware.validateJWT],controller.createCategory);

    return router;
  }
}
``` 

## 7. Crear en DB
1. Implementar servicio de category. Node\18-Autentication\src\presentation\services\category.service.ts

``` ts
import { CategoryModel } from '../../data';
import { CustomError, UserEntity } from '../../domain';
import { CreateCategoryDto } from '../../domain/dtos/category/create-category.dto';
export class CategoryService {
    constructor(){}

    async createCategory( createCategoryDto:CreateCategoryDto, user: UserEntity){
        const categoryExists = await CategoryModel.findOne({name: createCategoryDto.name});
        if(categoryExists) throw CustomError.badRequest('Categor already exists');

        try {
            const category = new CategoryModel({
                ...createCategoryDto,
                user: user.id
            });

            await category.save();

            return {
                id: category.id,
                name: category.name,
                available: category.available
            }
        } catch (error) {   
           throw CustomError.internalServer(`${error}`); 
        }
    }
}
```

2. Usar servicio en el controlador.
    1. Se debe inyectar el servicio como DI.
``` ts
export class CategoryController {
    constructor(
        private readonly categoryService: CategoryService,
    ){}

    private handleError = (error: unknown, res: Response) => {
        if(error instanceof CustomError) {
            return res.status(error.statusCode).json({error: error.message});
        }

        console.log(`${error}`);
        return res.status(500).json({error: 'Internal server error'});
    }

    createCategory = (req: Request, res: Response) => {
        const [error, createCategoryDto] = CreateCategoryDto.create(req.body);
        if(error) return res.status(400).json({error});

        this.categoryService.createCategory(createCategoryDto!, req.body.user)
            .then(category => res.status(201).json(category))
            .catch(error => this.handleError(error, res));
    }

```
3. Inyectar dependencia al crear instancia del servicio. Node\18-Autentication\src\presentation\categories\routes.ts

``` ts
import { Router } from 'express';
import { CategoryController } from './controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { CategoryService } from '../services/category.service';

export class CategoryRoutes {

  static get routes(): Router {

    const router = Router();
    const categoryService = new CategoryService()
    const controller = new CategoryController(categoryService);
    
    // Definir las rutas
    router.get('/', controller.getCategory);
    router.post('/', [AuthMiddleware.validateJWT],controller.createCategory);

    return router;
  }
}
```

## 8. Retornar todas las categorías. Pagination DTO
- Cuando se recibe info de un endpoint se puede usar un DTO.
1. Node\18-Autentication\src\domain\dtos\shared\pagination.dto.ts

``` ts
export class PaginationDto {
    private constructor(
        public readonly page: number,
        public readonly limit: number,
    ){}

    static create(page: number = 1, limit: number = 10): [string?, PaginationDto?] {
        if(isNaN(page) || isNaN(limit)) return ['Page and Limit must be numbers'];
        if(page <= 0) return ['Page must be greater than 0'];
        if(limit <= 0) return ['Limit must be greater than 0'];

        return [undefined, new PaginationDto(page, limit)];
    }

}
```

2. Extraer parámetros de limit y page en el controlador.
    - Ya que todos los parámetros siempre vienen como string se usa + para convertir los que deben ser números.

``` ts
    getCategory = (req: Request, res: Response) => {
        const { page = 1, limit = 10 } = req.query;
        const [error, paginationDto] = PaginationDto.create(+page, +limit);
        if(error) return res.status(400).json({error});
        this.categoryService.getCategories(paginationDto!)
            .then(categories => res.json(categories))
            .catch(error => this.handleError(error, res));
    }
```

3. Aplicar paginación en servicio de categoría.
    1. Se define el parámetros de paginationDto en el método.
    2. Se utiliza skip de mongo, el cual es base 0.
    3. Se debe indicar al cliente la página en la que está, el límite, y la cantidad de registros.
        - Se igual manera se indica el next y prev, el cual es el endpoint esperado.

``` ts
    async getCategories(paginationDto: PaginationDto){

        const { page, limit } = paginationDto;

        try {
            const [total, categories] = await Promise.all([
                CategoryModel.countDocuments(),
                CategoryModel.find()
                .skip( (page-1) * limit )
                .limit(limit)
            ]);

            return {
                page,
                limit,
                total,
                next: `/api/categories?page=${(page+1)}&limit=${limit}`,
                prev: (page - 1 > 0) ? `/api/categories?page=${(page-1)}&limit=${limit}`:null,
                categories: (categories).map(category => ({
                    id: category.id,
                    name: category.name,
                    available: category.available,
                }))
            };
        } catch (error) {
            throw CustomError.internalServer(`${error}`); 
        }
    }
```

# Sección 21. Relaciones y Semilla
- Se va a seguir con una arquitectura diferente para introducirla. Ya no se van a crear entidades.
    - En lugar de crear entidades se va a trabajar directamente con el modelo de la db.
- En la sección anterior al crear categorías el usuario se pasaba a través del token, el cual se pasaba a lo demás con req.body. En este ejercicio se va a pasar el ID del usuario al momento de crear un producto. Esto tiene el propósito de mostrar otro enfoque.

## Temas
1. Una nueva forma de DTO completa
2. Validar MongoIDs
3. Crear categorías, productos y usuarios desde una semilla
4. Remover información en la serialización JSON

## 1. Rutas y controlador de productos
1. Crear servicio.
2. Crear controlador.
3. Crear rutas.
4. Agregar ruta en el archivo de routes.ts principal.

### 1. Create Product Dto
- En este caso se hace una doble negación a available para convertirlo a un boolean. Este es otro enfoque al que se usó anteriormente, ya que puede venir como un string.
- El modelo del prodecto da una idea de las propiedades que se deben recibir en este dto.

1. Crear función que valida ID's de mongo.
    - Aplicar patrón adaptador para usar la función de Mongoose.

``` ts
import mongoose from "mongoose";

export class Validators {
    static isMongoID(id:string) {
        return mongoose.isValidObjectId(id);
    }
}
```

2. Crear DTO.

``` ts
import { Validators } from "../../../config/validators";

export class CreateProductDto {
    private constructor(
        public readonly name: string,
        public readonly available: boolean,
        public readonly price: number,
        public readonly description: string,
        public readonly user: string, // ID
        public readonly category: string, // ID
    ){}

    static create(props: {[key: string]: any}): [string?, CreateProductDto?] {
        const {
            name,
            available,
            price,
            description,
            user,
            category,
        } = props

        if(!name) return ['Missing name'];
        
        if(!user) return ['Missing user'];
        if(!Validators.isMongoID(user)) return ['Invalid User ID'];

        if(!category) return ['Missing category'];
        if(!Validators.isMongoID(category)) return ['Invalid User ID'];

        return [undefined, new CreateProductDto(
            name,
            !!available,
            price,
            description,
            user,
            category,
        )];
    }

}
```

### 2. Implementar métodos del ProductService

``` ts
import { ProductModel } from "../../data";
import { CreateProductDto, CustomError, PaginationDto } from "../../domain";

export class ProductService {
    constructor(){}

    async createProduct( createProductDto:CreateProductDto){
        const productExists = await ProductModel.findOne({name: createProductDto.name});
        if(productExists) throw CustomError.badRequest('Product already exists');

        try {
            const product = new ProductModel(createProductDto);

            await product.save();

            return product;

        } catch (error) {   
           throw CustomError.internalServer(`${error}`); 
        }
    }

    async getProducts(paginationDto: PaginationDto){

        const { page, limit } = paginationDto;

        try {
            const [total, products] = await Promise.all([
                ProductModel.countDocuments(),
                ProductModel.find()
                .skip( (page-1) * limit )
                .limit(limit)
                // TODO: populate
            ]);

            return {
                page,
                limit,
                total,
                next: `/api/categories?page=${(page+1)}&limit=${limit}`,
                prev: (page - 1 > 0) ? `/api/categories?page=${(page-1)}&limit=${limit}`:null,
                products
            };
        } catch (error) {
            throw CustomError.internalServer(`${error}`); 
        }
    }
}
```

- Uso en controlador.

``` ts
import { Response, Request } from "express";
import { CreateProductDto, CustomError, PaginationDto } from "../../domain";
import { ProductService } from "../services/product.service";

export class ProductController {
    constructor(
        private readonly productService: ProductService,
    ){}

    private handleError = (error: unknown, res: Response) => {
        if(error instanceof CustomError) {
            return res.status(error.statusCode).json({error: error.message});
        }

        console.log(`${error}`);
        return res.status(500).json({error: 'Internal server error'});
    }

    createProduct = (req: Request, res: Response) => {
        const [error, createProductDto] = CreateProductDto.create({...req.body, user: req.body.user.id});
        if(error) return res.status(400).json({error});

        this.productService.createProduct(createProductDto!)
            .then(product => res.status(201).json(product))
            .catch(error => this.handleError(error, res));
    }

    getProducts = (req: Request, res: Response) => {
        const { page = 1, limit = 10 } = req.query;
        const [error, paginationDto] = PaginationDto.create(+page, +limit);
        if(error) return res.status(400).json({error});
        this.productService.getProducts(paginationDto!)
            .then(products => res.json(products))
            .catch(error => this.handleError(error, res));
    }
}
```

### 3. Populate y propiedades adicionales
1. Usar set y virtuals en el modelo de products.

``` ts
import mongoose, { Schema } from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        unique: true
    },
    available: {
        type: Boolean,
        default: false,
    },
    price: {
        type: Number, 
        default: 0,
    },
    description: {
        type: String
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    }
});

productSchema.set('toJSON', {
    virtuals: true, // coloca id como propiedad extra pero sin _.
    versionKey: false, // Quita version key
    transform: function(doc, ret, options) {
        delete ret._id; // Elimina _id
    }
});

export const ProductModel = mongoose.model('Product', productSchema);
```
2. Colocar virtuales en user y category para no traer esos campos al momento de hacer populate.

``` ts
userSchema.set('toJSON', {
    virtuals: true, // coloca id como propiedad extra pero sin _.
    versionKey: false, // Quita version key
    transform: function(doc, ret, options) {
        delete ret._id; // Elimina _id
        delete ret.password;
    }
});



categorySchema.set('toJSON', {
    virtuals: true, // coloca id como propiedad extra pero sin _.
    versionKey: false, // Quita version key
    transform: function(doc, ret, options) {
        delete ret._id; // Elimina _id
    }
});
```

3. Colocar populate en el servicio de product al recuperar product.

``` ts
            const [total, products] = await Promise.all([
                ProductModel.countDocuments(),
                ProductModel.find()
                .skip( (page-1) * limit )
                .limit(limit)
                .populate('user')
                .populate('category')
            ]);
```

## 2. Crear semilla para poblar base de datos
1. Crear seed/data.ts y seed/seed.ts
    - El primero contiene la data.
    - El segundo con los pasos a ejecutar.
2. Crear script para llamar la semilla.
3. Crear método disconnect en mongo-database.ts
- El proceso de seed no debe subirse a producción.
    - Se podría usar una bandera en env para desarrollar la lógica de si se puede o no ejecutar el seed.

``` ts
    static async disconnect() {
        await mongoose.disconnect();
    }
```

``` ts
import { envs } from "../../config/envs";
import { CategoryModel } from "../mongo/models/category.model";
import { ProductModel } from "../mongo/models/product.model";
import { UserModel } from "../mongo/models/user.model";
import { MongoDatabase } from "../mongo/mongo-database";
import { seedData } from "./data";

(async() => {
    await MongoDatabase.connect({
        dbName: envs.MONGO_DB_NAME,
        mongoUrl: envs.MONGO_URL,
    })

    await main();

    await MongoDatabase.disconnect();
})();

const randomBetween0AndX = (x: number) => {
    return Math.floor(Math.random() * x);
}

async function main() {
    // 0. Borrar todo
    await Promise.all([
        UserModel.deleteMany(),
        CategoryModel.deleteMany(),
        ProductModel.deleteMany(),
    ])

    // 1. Crear usuarios
    const users = await UserModel.insertMany(seedData.users);

    // 2. Crear categorías
    const categories = await CategoryModel.insertMany(
        seedData.categories.map(category => {
            return {
                ...category,
                user: users[0]._id
            }
        })
    )

    // 3. Crear productos
    const products = await ProductModel.insertMany(
        seedData.products.map(product => {
            return {
                ...product,
                user: users[randomBetween0AndX(seedData.users.length - 1)]._id,
                category: categories[randomBetween0AndX(seedData.users.length - 1)]._id
            }
        })
    )
   
}
```

# Sección 22. Carga de archivos
- En este ejercicio los archivos se guardan en el servidor, pero en un proyecto real el servidor solo sirve de puente para guardar los archivos hacia otro lado.

## Temas
1. Carga Simple
2. Carga Multiple
3. Obtener archivos + Body de la petición http de forma simultánea
4. Validaciones de archivo y extensiones
5. Middlewares personalizados
6. Almacenamiento en File System
7. Obtención del archivo de la petición http

## Definir carpetas de uploads
1. Se define en el root.
2. Se le coloca un archivo .gitkeep

## 1. fileUpload - Ruta y controlador
1. Se crean los archivos de routes y controller para file-upload.
2. Se realiza un endpoint flexible para poder subir o un archivo o múltiples, los cuales pueden ser de cualquier tipo.

## 2. fileUpload Service y Middleware
- El tipo UploadedFile viene de las dependencias que se instalan en el siguiente paso.
``` ts
import { UploadedFile } from "express-fileupload"

export class FileUploadService {
    constructor(){}

    private checkFolder( folderPath: string ) {
        throw new Error('Not implemented')
    }

    public uploadMultiple( 
        file: UploadedFile, 
        folder: string = 'uploads', 
        validExtensions: string[] = ['png', 'jpg', 'jpeg', 'gif'] 
     ) {
        throw new Error('Not implemented')
    }

    public uploadSingle( 
        file: UploadedFile, 
        folder: string = 'uploads', 
        validExtensions: string[] = ['png', 'jpg', 'jpeg', 'gif'] 
    ) {
        throw new Error('Not implemented')
    }
}
```

## 3. Instalar dependencias
1. uuid
``` bash
npm i uuid
npm i --save-dev @types/uuid
```
2. Patrón adaptador de uuid.
``` ts
import { v4 as uuidv4 } from 'uuid';
export class Uuid {
    static v4 = () => uuidv4()
}
```

3. express-fileupload
    - Con esta dependencia ahora se tiene en req la propiedad files.
``` bash
npm i express-fileupload
npm i -D @types/express-fileupload
```

4. Definir fileupload en la cadena de middlewares. Esto está en server.

``` ts
    this.app.use(fileUpload({
      limits: {fileSize: 50 * 1024 * 1024}
    }))
```

5. Hacer prueba en postman.
    - En el apartado de body se tiene la sección de form-data, lo cual permite subir archivos.
    - En el controlador se coloca un console log para ver req.files
    - Si es un archivo se recibe un objeto, pero más de 1 entonces ahora se tiene un arreglo con los objetos.

``` ts
    uploadFile = (req: Request, res: Response) => {
        console.log(req.files)
        res.json('uploadFile')
    }
```

## 4. Middleware de verificación de archivos.
1. Node\18-Autentication\src\presentation\middlewares\file-upload.middleware.ts

``` ts
import { NextFunction, Request, Response } from "express";

export class FileUploadMiddleware {
    static containFiles(req: Request, res: Response, next: NextFunction) {
        if(!req.files || Object.keys(req.files).length === 0) return res.status(400).json({error: 'No files were selected'});
        
        if(Array.isArray(req.files.file)) {
            req.body.files = [req.files.file];
        }  else {
            req.body.files = req.files.file;
        }

        next();
    }
}
```

2. Aplicar middlewara común a rutas.
``` ts
    router.use(FileUploadMiddleware.containFiles);
    // Definir las rutas
    // api/upload/<user|category|product>/
    // api/upload/single/<user|category|product>/
    // api/upload/multiple/<user|category|product>/
    router.post('/single/:type', controller.uploadFile);
    router.post('/multiple/:type', controller.uploadMultipleFiles);
```

## 5. Middleware para verificar el tipo.
1. Se crea un factory method para retornar la middleware con la finalidad de poder inyectar los tipos que se desean soportar.
    - En este caso no se pueden recuperar los parámetros, ya que los params están definidos cuando se está directamente en la ruta, no colocando la middleware de forma general como se va a hacer. Entonces, se debe hacer un split del url.

``` ts
import { NextFunction, Request, Response } from "express";

export class TypeMiddleware {
    static validTypes(validTypes: string[]) {
        return (req: Request, res: Response, next: NextFunction) => {
            const type = req.url.split('/').at(-1) ?? '';
            if(!validTypes.includes(type)) {
                return res.status(400).json({error: `Invalid type: ${type}, valid ones ${validTypes}`});
            }

            next();
        }
    }
}
```

2. Se coloca en la cadena de middleware para las rutas de file upload.

``` ts
export class FileUploadRoutes {

  static get routes(): Router {

    const router = Router();
    const fileUploadService = new FileUploadService()
    const controller = new FileUploadController(fileUploadService);
    
    router.use(FileUploadMiddleware.containFiles);
    router.use(TypeMiddleware.validTypes(['users', 'categories', 'products']));
    // Definir las rutas
    // api/upload/<user|category|product>/
    // api/upload/single/<user|category|product>/
    // api/upload/multiple/<user|category|product>/
    router.post('/single/:type', controller.uploadFile);
    router.post('/multiple/:type', controller.uploadMultipleFiles);

    return router;
  }
}

```

## 6. Retornar una imagen
1. images -> routes.ts

``` ts
import { Router } from "express";

export class ImageRoutes {
    static get routes(): Router {
        const router = Router();
        router.get('/:type/:img')

        return router;
    }
}
```

2. Colocar images en routes principales.

``` ts
export class AppRoutes {

  static get routes(): Router {

    const router = Router();
    
    // Definir las rutas
    router.use('/api/auth', AuthRoutes.routes );
    router.use('/api/categories', CategoryRoutes.routes );
    router.use('/api/products', ProductRoutes.routes );
    router.use('/api/upload', FileUploadRoutes.routes );
    router.use('/api/images', ImageRoutes.routes );

    return router;
  }
}

```

3. Controlador

``` ts
import { Request, Response } from "express";
import path from "path";
import fs from 'fs';

export class ImageController {
    constructor(){}

    getImage = (req: Request, res: Response) => {
        const { type = '', img = '' } = req.params;

        const imagePath = path.resolve(__dirname, `../../../uploads/${type}/${img}`);

        if(!fs.existsSync(imagePath)) {
            return res.status(404).send('Image not found');
        }

        res.sendFile(imagePath);
    }
}
```

4. Completar routes de image al colocar el controlador que se requiere.

``` ts
import { Router } from "express";
import { ImageController } from "./controller";

export class ImageRoutes {
    static get routes(): Router {
        const router = Router();
        const controller = new ImageController();
        
        router.get('/:type/:img', controller.getImage);

        return router;
    }
}
```