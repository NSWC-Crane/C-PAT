import ajv = require('ajv');
import { OpenApiValidatorOpts, Options, RequestValidatorOptions } from '../types';
export declare class AjvOptions {
    private options;
    constructor(options: OpenApiValidatorOpts);
    get preprocessor(): ajv.Options;
    get response(): ajv.Options;
    get request(): RequestValidatorOptions;
    get multipart(): Options;
    private baseOptions;
}
