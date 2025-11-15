import { ModelService } from './model.service';
import { ModelListItemDto } from './dto/model.dto';
export declare class ModelController {
    private readonly modelService;
    constructor(modelService: ModelService);
    list(): Promise<ModelListItemDto[]>;
}
