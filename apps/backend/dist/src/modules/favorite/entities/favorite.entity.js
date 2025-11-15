"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoriteSchema = exports.Favorite = exports.FavoriteTargetType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var FavoriteTargetType;
(function (FavoriteTargetType) {
    FavoriteTargetType["PROJECT"] = "project";
    FavoriteTargetType["SCREEN"] = "screen";
})(FavoriteTargetType || (exports.FavoriteTargetType = FavoriteTargetType = {}));
let Favorite = class Favorite {
};
exports.Favorite = Favorite;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Favorite.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: [FavoriteTargetType.PROJECT, FavoriteTargetType.SCREEN],
        index: true,
    }),
    __metadata("design:type", String)
], Favorite.prototype, "targetType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Favorite.prototype, "targetId", void 0);
exports.Favorite = Favorite = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Favorite);
exports.FavoriteSchema = mongoose_1.SchemaFactory.createForClass(Favorite);
exports.FavoriteSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
//# sourceMappingURL=favorite.entity.js.map