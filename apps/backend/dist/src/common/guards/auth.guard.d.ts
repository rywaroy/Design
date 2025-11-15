import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/modules/user/user.service';
export declare class AuthGuard implements CanActivate {
    private jwtService;
    private userSerivce;
    private configService;
    constructor(jwtService: JwtService, userSerivce: UserService, configService: ConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTokenFromHeader;
}
