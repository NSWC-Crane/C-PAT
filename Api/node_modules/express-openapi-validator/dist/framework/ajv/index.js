"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResponseAjv = exports.createRequestAjv = void 0;
const Ajv = require("ajv");
const draftSchema = require("ajv/lib/refs/json-schema-draft-04.json");
const formats_1 = require("./formats");
function createRequestAjv(openApiSpec, options = {}) {
    return createAjv(openApiSpec, options);
}
exports.createRequestAjv = createRequestAjv;
function createResponseAjv(openApiSpec, options = {}) {
    return createAjv(openApiSpec, options, false);
}
exports.createResponseAjv = createResponseAjv;
function createAjv(openApiSpec, options = {}, request = true) {
    var _a;
    const ajv = new Ajv(Object.assign(Object.assign({}, options), { schemaId: 'auto', allErrors: true, meta: draftSchema, formats: Object.assign(Object.assign({}, formats_1.formats), options.formats), unknownFormats: options.unknownFormats }));
    ajv.removeKeyword('propertyNames');
    ajv.removeKeyword('contains');
    ajv.removeKeyword('const');
    if (request) {
        if (options.serDesMap) {
            ajv.addKeyword('x-eov-serdes', {
                modifying: true,
                compile: (sch) => {
                    if (sch) {
                        return function validate(data, path, obj, propName) {
                            if (!!sch.deserialize) {
                                if (typeof data !== 'string') {
                                    validate.errors = [
                                        {
                                            keyword: 'serdes',
                                            schemaPath: data,
                                            dataPath: path,
                                            message: `must be a string`,
                                            params: { 'x-eov-serdes': propName },
                                        },
                                    ];
                                    return false;
                                }
                                try {
                                    obj[propName] = sch.deserialize(data);
                                }
                                catch (e) {
                                    validate.errors = [
                                        {
                                            keyword: 'serdes',
                                            schemaPath: data,
                                            dataPath: path,
                                            message: `format is invalid`,
                                            params: { 'x-eov-serdes': propName },
                                        },
                                    ];
                                    return false;
                                }
                            }
                            return true;
                        };
                    }
                    return () => true;
                },
                // errors: 'full',
            });
        }
        ajv.removeKeyword('readOnly');
        ajv.addKeyword('readOnly', {
            modifying: true,
            compile: (sch) => {
                if (sch) {
                    return function validate(data, path, obj, propName) {
                        const isValid = !(sch === true && data != null);
                        delete obj[propName];
                        validate.errors = [
                            {
                                keyword: 'readOnly',
                                schemaPath: data,
                                dataPath: path,
                                message: `is read-only`,
                                params: { readOnly: propName },
                            },
                        ];
                        return isValid;
                    };
                }
                return () => true;
            },
        });
    }
    else {
        // response
        if (options.serDesMap) {
            ajv.addKeyword('x-eov-serdes', {
                modifying: true,
                compile: (sch) => {
                    if (sch) {
                        return function validate(data, path, obj, propName) {
                            if (typeof data === 'string')
                                return true;
                            if (!!sch.serialize) {
                                try {
                                    obj[propName] = sch.serialize(data);
                                }
                                catch (e) {
                                    validate.errors = [
                                        {
                                            keyword: 'serdes',
                                            schemaPath: data,
                                            dataPath: path,
                                            message: `format is invalid`,
                                            params: { 'x-eov-serdes': propName },
                                        },
                                    ];
                                    return false;
                                }
                            }
                            return true;
                        };
                    }
                    return () => true;
                },
            });
        }
        ajv.removeKeyword('writeOnly');
        ajv.addKeyword('writeOnly', {
            modifying: true,
            compile: (sch) => {
                if (sch) {
                    return function validate(data, path, obj, propName) {
                        const isValid = !(sch === true && data != null);
                        validate.errors = [
                            {
                                keyword: 'writeOnly',
                                dataPath: path,
                                schemaPath: path,
                                message: `is write-only`,
                                params: { writeOnly: propName },
                            },
                        ];
                        return isValid;
                    };
                }
                return () => true;
            },
        });
    }
    if ((_a = openApiSpec.components) === null || _a === void 0 ? void 0 : _a.schemas) {
        Object.entries(openApiSpec.components.schemas).forEach(([id, schema]) => {
            ajv.addSchema(openApiSpec.components.schemas[id], `#/components/schemas/${id}`);
        });
    }
    return ajv;
}
//# sourceMappingURL=index.js.map