import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDocument } from './entities/user.entity';
export declare class UserService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    create(createUserDto: CreateUserDto): Promise<UserDocument>;
    findOne(id: string): Promise<UserDocument>;
}
