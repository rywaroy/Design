import { HydratedDocument } from 'mongoose';
export declare class Project {
    platform: string;
    appName: string;
    appLogoUrl?: string;
    name: string;
    projectId: string;
    previewScreens: string[];
    screenCount: number;
    recommendedCount: number;
    appTagline?: string;
    keywords?: string[];
    applicationType?: string[];
    industrySector?: string[];
    isFavorite?: boolean;
}
export type ProjectDocument = HydratedDocument<Project>;
export declare const ProjectSchema: import("mongoose").Schema<Project, import("mongoose").Model<Project, any, any, any, import("mongoose").Document<unknown, any, Project, any, {}> & Project & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Project, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Project>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Project> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
