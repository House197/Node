import { JwtAdapter, bcryptAdapter } from "../../config";
import { UserModel } from "../../data";
import { RegisterUserDto, CustomError, UserEntity, LoginUserDto } from "../../domain";
import { EmailService } from "./email.service";

export class AuthService {
    constructor(
        private readonly emailService: EmailService,
        private readonly webserviceUrl: string,
    ){}

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

            const {password, ...rest} = UserEntity.fromObject(user);

            return {...rest, token:'ABC'};
        } catch (error) {
            throw CustomError.internalServer(`${error}`);
        }
    }

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
}