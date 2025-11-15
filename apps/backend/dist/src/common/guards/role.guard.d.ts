import { ExecutionContext } from '@nestjs/common';
export declare function RoleGuard(roles: string[] | string): {
    new (): {
        canActivate(context: ExecutionContext): Promise<boolean>;
    };
};
