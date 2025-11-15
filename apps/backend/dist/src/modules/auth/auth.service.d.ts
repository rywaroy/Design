import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserDocument } from '../user/entities/user.entity';
export declare class AuthService {
    private jwtService;
    private userModel;
    constructor(jwtService: JwtService, userModel: Model<UserDocument>);
    login(createUserDto: CreateUserDto): Promise<{
        _id: string;
        username: string;
        roles: import("../user/entities/user.entity").Role[];
    }>;
    createToken(user: any): Promise<string>;
    logout(): Promise<void>;
}
