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
exports.SessionSchema = exports.Session = exports.SessionStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["ACTIVE"] = "active";
    SessionStatus["ARCHIVED"] = "archived";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
let Session = class Session {
};
exports.Session = Session;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Session.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Session.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: SessionStatus, default: SessionStatus.ACTIVE }),
    __metadata("design:type", String)
], Session.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, maxlength: 500 }),
    __metadata("design:type", String)
], Session.prototype, "lastMessage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Session.prototype, "lastMessageAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Session.prototype, "pinned", void 0);
exports.Session = Session = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: 'sessions',
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    })
], Session);
exports.SessionSchema = mongoose_1.SchemaFactory.createForClass(Session);
exports.SessionSchema.index({ userId: 1, updatedAt: -1 });
exports.SessionSchema.index({ userId: 1, status: 1 });
exports.SessionSchema.virtual('messages', {
    ref: 'Message',
    localField: '_id',
    foreignField: 'sessionId',
    justOne: false,
    options: { sort: { createdAt: -1 } },
});
//# sourceMappingURL=session.entity.js.map