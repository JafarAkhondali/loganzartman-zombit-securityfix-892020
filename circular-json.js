var
  // should be a not so common char
  // possibly one JSON does not encode
  // possibly one encodeURIComponent does not encode
  // right now this char is '~' but this might change in the future
  specialChar = '~',
  safeSpecialChar = '\\x' + (
    '0' + specialChar.charCodeAt(0).toString(16)
  ).slice(-2),
  specialCharRG = new RegExp(safeSpecialChar, 'g'),
  safeSpecialCharRG = new RegExp('\\' + safeSpecialChar, 'g'),
  indexOf = [].indexOf || function(v){
    for(var i=this.length;i--&&this[i]!==v;);
    return i;
  },
  $String = String  // there's no way to drop warnings in JSHint
                    // about new String ... well, I need that here!
                    // faked, and happy linter!
;

function generateReplacer(value, replacer, resolve) {
  var
    path = [],
    seen = [value],
    mapp = [resolve ? specialChar : '[Circular]'],
    i
  ;
  return function(key, value) {
    // the replacer has rights to decide
    // if a new object should be returned
    // or if there's some key to drop
    // let's call it here rather than "too late"
    if (replacer) value = replacer(key, value);

    // did you know ? Safari passes keys as integers for arrays
    if (key !== '') {
      if (typeof value === 'object' && value) {
        i = indexOf.call(seen, value);
        if (i < 0) {
          i = seen.push(value) - 1;
          if (resolve) {
            // key cannot contain specialChar but could be not a string
            path.push(('' + key).replace(specialCharRG, safeSpecialChar));
            mapp[i] = specialChar + path.join(specialChar);
          } else {
            mapp[i] = mapp[0];
          }
        } else {
          value = mapp[i];
        }
      } else {
        path.pop();
        if (typeof value === 'string' && resolve) {
          // ensure no special char involved on deserialization
          // in this case only first char is important
          // no need to replace all value (better performance)
          value = value.replace(specialChar, safeSpecialChar);
        }
      }
    }
    return value;
  };
}

function retrieveFromPath(current, keys) {
  for(var i = 0, length = keys.length; i < length; current = current[
    // keys should be normalized back here
    keys[i++].replace(safeSpecialCharRG, specialChar)
  ]);
  return current;
}

function generateReviver(reviver) {
  return function(key, value) {
    var isString = typeof value === 'string';
    if (isString && value.charAt(0) === specialChar) {
      return new $String(value.slice(1));
    }
    if (key === '') value = regenerate(value, value, {});
    // again, only one needed, do not use the RegExp for this replacement
    // only keys need the RegExp
    if (isString) value = value.replace(safeSpecialChar, specialChar);
    return reviver ? reviver(key, value) : value;
  };
}

function regenerateArray(root, current, retrieve) {
  for (var i = 0, length = current.length; i < length; i++) {
    current[i] = regenerate(root, current[i], retrieve);
  }
  return current;
}

function regenerateObject(root, current, retrieve) {
  for (var key in current) {
    if (current.hasOwnProperty(key)) {
      current[key] = regenerate(root, current[key], retrieve);
    }
  }
  return current;
}

function regenerate(root, current, retrieve) {
  return current instanceof Array ?
    // fast Array reconstruction
    regenerateArray(root, current, retrieve) :
    (
      current instanceof $String ?
        (
          // root is an empty string
          current.length ?
            (
              retrieve.hasOwnProperty(current) ?
                retrieve[current] :
                retrieve[current] = retrieveFromPath(
                  root, current.split(specialChar)
                )
            ) :
            root
        ) :
        (
          current instanceof Object ?
            // dedicated Object parser
            regenerateObject(root, current, retrieve) :
            // value as it is
            current
        )
    )
  ;
}

function stringifyRecursion(value, replacer, space, doNotResolve) {
  return JSON.stringify(value, generateReplacer(value, replacer, !doNotResolve), space);
}

function parseRecursion(text, reviver) {
  return JSON.parse(text, generateReviver(reviver));
}

function cjson() {
	this.stringify = function(val,repl,space,dnr) {
		return stringifyRecursion(val,repl,space,dnr);
	}
	this.parse = function(text,rev) {
		return parseRecursion(text,rev);
	}
}

CircularJSON = new cjson();