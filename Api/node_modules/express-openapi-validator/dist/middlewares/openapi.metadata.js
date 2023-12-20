"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyOpenApiMetadata = void 0;
const _zipObject = require("lodash.zipobject");
const path_to_regexp_1 = require("path-to-regexp");
const types_1 = require("../framework/types");
const schema_preprocessor_1 = require("./parsers/schema.preprocessor");
function applyOpenApiMetadata(openApiContext, responseApiDoc) {
    return (req, res, next) => {
        // note base path is empty when path is fully qualified i.e. req.path.startsWith('')
        const path = req.path.startsWith(req.baseUrl)
            ? req.path
            : `${req.baseUrl}/${req.path}`;
        if (openApiContext.shouldIgnoreRoute(path)) {
            return next();
        }
        const matched = lookupRoute(req);
        if (matched) {
            const { expressRoute, openApiRoute, pathParams, schema } = matched;
            if (!schema) {
                // Prevents validation for routes which match on path but mismatch on method
                if (openApiContext.ignoreUndocumented) {
                    return next();
                }
                throw new types_1.MethodNotAllowed({
                    path: req.path,
                    message: `${req.method} method not allowed`,
                    headers: {
                        Allow: Object.keys(openApiContext.openApiRouteMap[openApiRoute])
                            .filter((key) => schema_preprocessor_1.httpMethods.has(key.toLowerCase()))
                            .join(', '),
                    },
                });
            }
            req.openapi = {
                expressRoute: expressRoute,
                openApiRoute: openApiRoute,
                pathParams: pathParams,
                schema: schema,
            };
            req.params = pathParams;
            if (responseApiDoc) {
                // add the response schema if validating responses
                req.openapi._responseSchema = matched._responseSchema;
            }
        }
        else if (openApiContext.isManagedRoute(path) && !openApiContext.ignoreUndocumented) {
            throw new types_1.NotFound({
                path: req.path,
                message: 'not found',
            });
        }
        next();
    };
    function lookupRoute(req) {
        const path = req.originalUrl.split('?')[0];
        const method = req.method;
        const routeEntries = Object.entries(openApiContext.expressRouteMap);
        for (const [expressRoute, methods] of routeEntries) {
            const routePair = openApiContext.routePair(expressRoute);
            const openApiRoute = routePair.openApiRoute;
            const pathKey = openApiRoute.substring(methods.basePath.length);
            const schema = openApiContext.apiDoc.paths[pathKey][method.toLowerCase()];
            const _schema = responseApiDoc === null || responseApiDoc === void 0 ? void 0 : responseApiDoc.paths[pathKey][method.toLowerCase()];
            const keys = [];
            const strict = !!req.app.enabled('strict routing');
            const sensitive = !!req.app.enabled('case sensitive routing');
            const pathOpts = {
                sensitive,
                strict,
            };
            const regexp = (0, path_to_regexp_1.pathToRegexp)(expressRoute, keys, pathOpts);
            const matchedRoute = regexp.exec(path);
            if (matchedRoute) {
                const paramKeys = keys.map((k) => k.name);
                try {
                    const paramsVals = matchedRoute.slice(1).map(decodeURIComponent);
                    const pathParams = _zipObject(paramKeys, paramsVals);
                    const r = {
                        schema,
                        expressRoute,
                        openApiRoute,
                        pathParams,
                    };
                    r._responseSchema = _schema;
                    return r;
                }
                catch (error) {
                    throw new types_1.BadRequest({
                        path: req.path,
                        message: `malformed uri'`,
                    });
                }
            }
        }
        return null;
    }
}
exports.applyOpenApiMetadata = applyOpenApiMetadata;
//# sourceMappingURL=openapi.metadata.js.map