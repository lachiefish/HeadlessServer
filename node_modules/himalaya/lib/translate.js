'use strict';

var _paul = require('paul');

var _paul2 = _interopRequireDefault(_paul);

var _compat = require('./compat');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// c/p'd from ../index.js
var voidTags = ['!doctype', 'area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

function serializeAttr(attr, value, isXml) {
  if (!isXml && attr === value) return attr;
  var text = value.toString();
  var quoteEscape = text.indexOf('\'') !== -1;
  var quote = quoteEscape ? '"' : '\'';
  return attr + '=' + quote + text + quote;
}

// stolen from underscore.string
function dasherize(str) {
  return str.trim().replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
}

function inlineStyle(style) {
  return Object.keys(style).reduce(function (css, key) {
    return css + '; ' + dasherize(key) + ': ' + style[key];
  }, '').slice(2);
}

var htmlDefaults = {};

function toHTML(tree) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : htmlDefaults;
  var doctype = options.doctype;

  var isXml = doctype === 'xml';
  var html = _paul2.default.walk(tree, function (node, walk) {
    var type = node.type,
        tagName = node.tagName,
        attributes = node.attributes,
        content = node.content;

    if (type === 'Text') return content;
    if (type === 'Comment') return '<!--' + content + '-->';
    var tag = '<' + tagName;
    for (var attr in attributes) {
      var val = attributes[attr];
      if (attr === 'dataset') {
        for (var prop in val) {
          var key = 'data-' + dasherize(prop);
          tag += ' ' + serializeAttr(key, val[prop], isXml);
        }
        continue;
      }

      if (attr === 'style') {
        tag += ' ' + serializeAttr(attr, inlineStyle(val));
        continue;
      }

      if (attr === 'className') {
        tag += ' ' + serializeAttr('class', val.join(' '));
        continue;
      }

      tag += ' ' + serializeAttr(dasherize(attr), val, isXml);
    }

    tag += '>';
    var autoClose = !isXml && (0, _compat.arrayIncludes)(voidTags, tagName.toLowerCase());
    if (autoClose) return tag;

    var innerds = walk(node.children || []).join('');
    return tag + innerds + ('</' + tagName + '>');
  });
  if (html.join) return html.join('');
  return html;
}

var newline = '\n';
var jadeDefaults = {
  indentation: '  '
};

function isWhitespaceNode(node) {
  return !(node.type === 'Text' && !node.content.trim());
}

function toJade(tree) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : jadeDefaults;
  var doctype = options.doctype;

  var multi = multilineText(options.indentation);

  if (tree.filter) tree = tree.filter(isWhitespaceNode);
  var jade = _paul2.default.walk(tree, function (node, walk, depth) {
    var type = node.type,
        tagName = node.tagName,
        attributes = node.attributes;

    if (type === 'Text') {
      return multi(node.content, depth, '| ');
    }
    if (type === 'Comment') {
      var text = node.content;
      return ~text.indexOf(newline) ? multi('//', depth) + newline + multi(text, depth + 1) : multi('//' + text, depth);
    }
    var tag = tagName;
    var id = attributes.id,
        className = attributes.className;

    if (id) tag += '#' + id;
    if (className) tag += '.' + className.join('.');

    var redundantDiv = node.tagName === 'div' && tag.length > 3;
    if (redundantDiv) tag = tag.slice(3);

    tag = multi(tag, depth);
    var attrs = node.attributes;
    var props = Object.keys(attrs).filter(function (key) {
      return key !== 'className' && key !== 'id';
    });
    if (props.length) {
      var isXml = doctype === 'xml';
      tag += '(';
      tag += props.map(function (prop) {
        var val = attrs[prop];
        if (prop === 'dataset') {
          return Object.keys(val).map(function (attr) {
            return serializeAttr('data-' + dasherize(attr), val[attr], isXml);
          }).join(', ');
        }
        if (prop === 'style') return serializeAttr(prop, inlineStyle(val));
        return serializeAttr(dasherize(prop), val, isXml);
      }).join(', ');
      tag += ')';
    }
    var lowTagName = node.tagName.toLowerCase();
    if ((0, _compat.arrayIncludes)(voidTags, lowTagName)) {
      if (lowTagName === '!doctype') {
        if (!doctype) doctype = doctypeShortcut(tag);
        return multi('doctype ' + doctype, depth);
      }
      return tag;
    }

    var children = node.children;

    if (!children.length) return tag;
    if (children.length === 1 && children[0].type === 'Text') {
      var _text = children[0].content;
      return ~_text.indexOf(newline) ? tag + '.' + newline + multi(_text, depth + 1) : tag + ' ' + _text;
    }

    return tag + newline + walk(children.filter(isWhitespaceNode), depth + 1).join(newline);
  }, 0);
  if (jade.join) return jade.join(newline);
  return jade;
}

function multilineText(indentation) {
  var format = function format(line) {
    return line;
  };
  var hasTab = (0, _compat.stringIncludes)(indentation, '\t');
  if (hasTab) {
    format = function format(line) {
      return line.replace(/\t/g, indentation);
    };
  }

  function indent(depth, str) {
    while (depth--) {
      str = indentation + str;
    }
    return str;
  }

  return function (str, depth) {
    var lead = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

    var lines = str.split(newline).map(format).filter(function (line) {
      return !!line.trim();
    });

    var start = maxSharedIndent(lines);
    return lines.map(function (line) {
      return indent(depth, lead + line.slice(start));
    }).join(newline);
  };
}

function maxSharedIndent(lines) {
  return lines.reduce(function (num, line) {
    return Math.min(num, line.length - line.trimLeft().length);
  }, Infinity);
}

// see http://jade-lang.com/reference/doctype/
function doctypeShortcut(str) {
  if ((0, _compat.stringIncludes)(str, 'Transitional')) return 'transitional';
  if ((0, _compat.stringIncludes)(str, 'strict')) return 'strict';
  if ((0, _compat.stringIncludes)(str, 'Frameset')) return 'frameset';
  if ((0, _compat.stringIncludes)(str, 'Basic')) return 'basic';
  if ((0, _compat.stringIncludes)(str, '1.1')) return '1.1';
  if ((0, _compat.stringIncludes)(str, 'Mobile')) return 'mobile';
  return 'html';
}

module.exports = {
  toHTML: toHTML,
  toJade: toJade,
  toPug: toJade
};
//# sourceMappingURL=translate.js.map
