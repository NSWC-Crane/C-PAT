/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

export const deepExtend = function (...objects: any[]): any {
    if (arguments.length < 1 || typeof arguments[0] !== 'object') {
      return false;
    }
  
    if (arguments.length < 2) {
      return arguments[0];
    }
  
    const target = arguments[0];
    const args = Array.prototype.slice.call(arguments, 1);
    let val, src;
  
    args.forEach(function (obj: any) {
      if (typeof obj !== 'object' || Array.isArray(obj)) {
        return;
      }
  
      Object.keys(obj).forEach(function (key) {
        src = target[key];
        val = obj[key];
  
        if (val === target) {
          return;
  

        } else if (typeof val !== 'object' || val === null) {
          target[key] = val;
  
          return;
  
        } else if (Array.isArray(val)) {
          target[key] = deepCloneArray(val);
  
          return;
  
                  } else if (isSpecificValue(val)) {
          target[key] = cloneSpecificValue(val);
  
          return;
  
                  } else if (typeof src !== 'object' || src === null || Array.isArray(src)) {
          target[key] = deepExtend({}, val);
  
          return;
  
                  } else {
          target[key] = deepExtend(src, val);
  
          return;
        }
      });
    });
  
    return target;
  };
  
  function isSpecificValue(val: any) {
    return (
      val instanceof Date
      || val instanceof RegExp
    ) ? true : false;
  }
  
  function cloneSpecificValue(val: any): any {
    if (val instanceof Date) {
      return new Date(val.getTime());
    } else if (val instanceof RegExp) {
      return new RegExp(val);
    } else {
      throw new Error('cloneSpecificValue: Unexpected situation');
    }
  }
  
  function deepCloneArray(arr: any[]): any {
    const clone: any[] = [];
    arr.forEach(function (item: any, index: any) {
      if (typeof item === 'object' && item !== null) {
        if (Array.isArray(item)) {
          clone[index] = deepCloneArray(item);
        } else if (isSpecificValue(item)) {
          clone[index] = cloneSpecificValue(item);
        } else {
          clone[index] = deepExtend({}, item);
        }
      } else {
        clone[index] = item;
      }
    });
  
    return clone;
  }
  
  export function getDeepFromObject(object = {}, name: string, defaultValue?: any) {
    const keys = name.split('.');
    let level = deepExtend({}, object || {});
    keys.forEach((k) => {
      if (level && typeof level[k] !== 'undefined') {
        level = level[k];
      } else {
        level = undefined;
      }
    });
  
    return typeof level === 'undefined' ? defaultValue : level;
  }
  
  export function urlBase64Decode(str: string): string {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
      case 0: { break; }
      case 2: { output += '=='; break; }
      case 3: { output += '='; break; }
      default: {
        throw new Error('Illegal base64url string!');
      }
    }
    return b64DecodeUnicode(output);
  }
  
  export function b64decode(str: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output: string = '';
  
    str = String(str).replace(/=+$/, '');
  
    if (str.length % 4 === 1) {
      throw new Error(`'atob' failed: The string to be decoded is not correctly encoded.`);
    }
  
    for (
      let bc: number = 0, bs: any, buffer: any, idx: number = 0;
      buffer = str.charAt(idx++);
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,

      bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      buffer = chars.indexOf(buffer);
    }
    return output;
  }
  
  export function b64DecodeUnicode(str: any) {
    return decodeURIComponent(Array.prototype.map.call(b64decode(str), (c: any) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }
