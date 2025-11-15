import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    getInfo(req: any): Promise<any>;
    register(createUserDto: CreateUserDto): Promise<import("mongoose").Document<unknown, {}, import("./entities/user.entity").User, {}, {}> & import("./entities/user.entity").User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
}
