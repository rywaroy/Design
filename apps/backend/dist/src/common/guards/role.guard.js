"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleGuard = RoleGuard;
const common_1 = require("@nestjs/common");
function RoleGuard(roles) {
    let RoleGuardClass = class RoleGuardClass {
        async canActivate(context) {
            const request = context.switchToHttp().getRequest();
            const user = request.user;
            const userRoles = user.roles;
            if (typeof roles === 'string') {
                roles = [roles];
            }
            const res = roles.some((role) => userRoles.includes(role));
            if (!res) {
                throw new common_1.UnauthorizedException('您没有权限访问');
            }
            return true;
        }
    };
    RoleGuardClass = __decorate([
        (0, common_1.Injectable)()
    ], RoleGuardClass);
    return RoleGuardClass;
}
//# sourceMappingURL=role.guard.js.map