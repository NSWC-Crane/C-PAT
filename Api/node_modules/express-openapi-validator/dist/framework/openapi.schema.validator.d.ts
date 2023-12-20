import * as Ajv from 'ajv';
import { OpenAPIV3 } from './types.js';
export interface OpenAPISchemaValidatorOpts {
    version: string;
    validateApiSpec: boolean;
    extensions?: object;
}
export declare class OpenAPISchemaValidator {
    private validator;
    constructor(opts: OpenAPISchemaValidatorOpts);
    validate(openapiDoc: OpenAPIV3.Document): {
        errors: Array<Ajv.ErrorObject> | null;
    };
}
