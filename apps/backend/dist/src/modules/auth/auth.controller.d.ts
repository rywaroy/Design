import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(createUserDto: CreateUserDto): Promise<{
        accessToken: string;
        id: string;
        username: string;
        roles: import("../user/entities/user.entity").Role[];
    }>;
    logout(): Promise<{
        message: string;
    }>;
}
