import { OpenAPIV3, SecurityHandlers, OpenApiRequestHandler } from '../framework/types';
export declare function security(apiDoc: OpenAPIV3.Document, securityHandlers: SecurityHandlers): OpenApiRequestHandler;
