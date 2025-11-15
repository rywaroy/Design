"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const validation_pipe_1 = require("./common/pipes/validation.pipe");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transformreturn_interceptor_1 = require("./common/interceptor/transformreturn.interceptor");
const logging_interceptor_1 = require("./common/interceptor/logging.interceptor");
const PREFIX = 'api';
const SWAGGER_V1 = `${PREFIX}/v1/swagger`;
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.setGlobalPrefix(PREFIX);
    app.useStaticAssets('public', {
        prefix: '/static/',
    });
    app.useStaticAssets('uploads', {
        prefix: '/uploads/',
    });
    const options = new swagger_1.DocumentBuilder()
        .setTitle('标题')
        .setDescription('描述信息')
        .setVersion('1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, options);
    swagger_1.SwaggerModule.setup(SWAGGER_V1, app, document);
    app.enableCors();
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new transformreturn_interceptor_1.TransformReturnInterceptor());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor());
    app.useGlobalPipes(new validation_pipe_1.ValidationPipe());
    const port = configService.get('app.port') ?? 3000;
    await app.listen(port);
}
bootstrap();
//# sourceMappingURL=main.js.map