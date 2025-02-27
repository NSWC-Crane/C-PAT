/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

let ResponsePayload = function (code, payload) {
    this.code = code;
    this.payload = payload;
}

exports.respondWithCode = function (code, payload) {
    return new ResponsePayload(code, payload);
}

let writeJson = exports.writeJson = function (response, arg1, arg2) {
    let code;
    let payload;
    if (arg1 && arg1 instanceof ResponsePayload) {
        writeJson(response, arg1.payload, arg1.code);
        return;
    }
    if (arg2 && Number.isInteger(arg2)) {
        code = arg2;
    } else if (arg1 && Number.isInteger(arg1)) {
        code = arg1;
    }
    if (arg1) {
        payload = arg1;
    }
    if (!code) {
        // if no response code given, we default to 200
        code = 200;
    }
    if (typeof payload == 'undefined') {
        code = 204
    }
    if (payload instanceof Error) {
        payload = JSON.stringify(payload, Object.getOwnPropertyNames(payload), 2);
        code = 500
    }
    else {
        payload = JSON.stringify(payload);
    }
    response.writeHead(code, {
        'Content-Type': 'application/json',
        'Cache-control': 'no-store'
    });
    response.end(payload);
}

const charToHexStr = (c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`

const goodFilename = (string) =>
    string.replace(/([<>:"/\\|?*])|( +$)/g, (match, specialChar, trailingSpace) => {
        if (specialChar) return '';
        if (trailingSpace) return '';
        return match;
    });

exports.writeInlineFile = function (response, payload, filename, contentType) {
    response.writeHead(200, {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${goodFilename(filename)}"`,
        'Access-Control-Expose-Headers': 'Content-Disposition'
    })
    response.write(payload)
    response.end()
}

exports.writeWithContentType = function (response, { payload, status = "200", contentType = "application/json" }) {
    response.writeHead(status, {
        'Content-Type': contentType
    })
    response.end(payload)
}

exports.writeNoContent = function (response) {
    response.writeHead(204)
    response.end()
}