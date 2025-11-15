import { Type } from '@nestjs/common';
export declare const ApiResponse: <TModel extends Type<any>>(model: TModel, message?: string, code?: number) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
