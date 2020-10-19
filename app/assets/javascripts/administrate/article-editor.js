/*
    Article Editor
    Version 1.5.1
    Updated: July 9, 2020

    http://imperavi.com/article/

    Copyright (c) 2009-2020, Imperavi Ltd.
    License: http://imperavi.com/article/license/
*/

(function() {
if (typeof CodeMirror === 'undefined') { var CodeMirror = null; }
var Ajax = {};

Ajax.settings = {};
Ajax.post = function(options) { return new AjaxRequest('post', options); };
Ajax.get = function(options) { return new AjaxRequest('get', options); };

var AjaxRequest = function(method, options) {
    var defaults = {
        method: method,
        url: '',
        before: function() {},
        success: function() {},
        error: function() {},
        data: false,
        async: true,
        headers: {}
    };

    this.p = this.extend(defaults, options);
    this.p = this.extend(this.p, Ajax.settings);
    this.p.method = this.p.method.toUpperCase();

    this.prepareData();

    this.xhr = new XMLHttpRequest();
    this.xhr.open(this.p.method, this.p.url, this.p.async);

    this.setHeaders();

    var before = (typeof this.p.before === 'function') ? this.p.before(this.xhr) : true;
    if (before !== false) {
        this.send();
    }
};

AjaxRequest.prototype = {
    extend: function(obj1, obj2) {
        if (obj2) for (var name in obj2) { obj1[name] = obj2[name]; }
        return obj1;
    },
    prepareData: function() {
        if (this.p.method === 'POST' && !this.isFormData()) this.p.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        if (typeof this.p.data === 'object' && !this.isFormData()) this.p.data = this.toParams(this.p.data);
        if (this.p.method === 'GET') this.p.url = (this.p.data) ? this.p.url + '?' + this.p.data : this.p.url;
    },
    setHeaders: function() {
        this.xhr.setRequestHeader('X-Requested-With', this.p.headers['X-Requested-With'] || 'XMLHttpRequest');
        for (var name in this.p.headers) {
            this.xhr.setRequestHeader(name, this.p.headers[name]);
        }
    },
    isFormData: function() {
        return (typeof window.FormData !== 'undefined' && this.p.data instanceof window.FormData);
    },
    isComplete: function() {
        return !(this.xhr.status < 200 || this.xhr.status >= 300 && this.xhr.status !== 304);
    },
    send: function() {
        if (this.p.async) {
            this.xhr.onload = this.loaded.bind(this);
            this.xhr.send(this.p.data);
        }
        else {
            this.xhr.send(this.p.data);
            this.loaded.call(this);
        }
    },
    loaded: function() {
        if (this.isComplete()) {
            var response = this.xhr.response;
            var json = this.parseJson(response);
            response = (json) ? json : response;

            if (typeof this.p.success === 'function') this.p.success(response, this.xhr);
        }
        else {
            if (typeof this.p.error === 'function') this.p.error(this.xhr.statusText);
        }
    },
    parseJson: function(str) {
        try {
            var o = JSON.parse(str);
            if (o && typeof o === 'object') {
                return o;
            }

        } catch (e) {}

        return false;
    },
    toParams: function (obj) {
        return Object.keys(obj).map(
            function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]); }
        ).join('&');
    }
};
var DomCache = [0];
var DomExpando = 'data' + new Date().getTime();

var Dom = function(selector, context) {
    return this.parse(selector, context);
};

Dom.ready = function(fn) {
    if (document.readyState != 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
};

Dom.prototype = {
    get dom() {
        return true;
    },
    get length() {
        return this.nodes.length;
    },
    parse: function(selector, context) {
        var nodes;
        var reHtmlTest = /^\s*<(\w+|!)[^>]*>/;

        if (!selector) {
            nodes = [];
        }
        else if (selector.dom) {
            this.nodes = selector.nodes;
            return selector;
        }
        else if (typeof selector !== 'string') {
            if (selector.nodeType && selector.nodeType === 11) {
                nodes = selector.childNodes;
            }
            else {
                nodes = (selector.nodeType || selector === window) ? [selector] : selector;
            }
        }
        else if (reHtmlTest.test(selector)) {
            nodes = this.create(selector);
        }
        else {
            nodes = this._query(selector, context);
        }

        this.nodes = this._slice(nodes);
    },
    create: function(html) {
        if (/^<(\w+)\s*\/?>(?:<\/\1>|)$/.test(html)) {
            return [document.createElement(RegExp.$1)];
        }

        var elements = [];
        var container = document.createElement('div');
        var children = container.childNodes;

        container.innerHTML = html;

        for (var i = 0, l = children.length; i < l; i++) {
            elements.push(children[i]);
        }

        return elements;
    },

    // add
    add: function(nodes) {
        this.nodes = this.nodes.concat(this._toArray(nodes));
        return this;
    },

    // get
    get: function(index) {
        return this.nodes[(index || 0)] || false;
    },
    getAll: function() {
        return this.nodes;
    },
    eq: function(index) {
        return new Dom(this.nodes[index]);
    },
    first: function() {
        return new Dom(this.nodes[0]);
    },
    last: function() {
        return new Dom(this.nodes[this.nodes.length - 1]);
    },
    contents: function() {
        return this.get().childNodes;
    },

    // loop
    each: function(callback) {
        var len = this.nodes.length;
        for (var i = 0; i < len; i++) {
            callback.call(this, (this.nodes[i].dom) ? this.nodes[i].get() : this.nodes[i], i);
        }

        return this;
    },

    // traversing
    is: function(selector) {
        return (this.filter(selector).length > 0);
    },
    filter: function (selector) {
        var callback;
        if (selector === undefined) {
            return this;
        }
        else if (typeof selector === 'function') {
            callback = selector;
        }
        else {
            callback = function(node) {
                if (selector instanceof Node) {
                    return (selector === node);
                }
                else if (selector && selector.dom) {
                    return ((selector.nodes).indexOf(node) !== -1);
                }
                else {
                    node.matches = node.matches || node.msMatchesSelector || node.webkitMatchesSelector;
                    return (node.nodeType === 1) ? node.matches(selector || '*') : false;
                }
            };
        }

        return new Dom(this.nodes.filter(callback));
    },
    not: function(filter) {
        return this.filter(function(node)
        {
            return !new Dom(node).is(filter || true);
        });
    },
    find: function(selector) {
        var nodes = [];
        this.each(function(node) {
            var ns = this._query(selector || '*', node);
            for (var i = 0; i < ns.length; i++) {
                nodes.push(ns[i]);
            }
        });

        return new Dom(nodes);
    },
    children: function(selector) {
        var nodes = [];
        this.each(function(node) {
            if (node.children) {
                var ns = node.children;
                for (var i = 0; i < ns.length; i++) {
                    nodes.push(ns[i]);
                }
            }
        });

        return new Dom(nodes).filter(selector);
    },
    parent: function(selector) {
        var nodes = [];
        this.each(function(node) {
            if (node.parentNode) nodes.push(node.parentNode);
        });

        return new Dom(nodes).filter(selector);
    },
    parents: function(selector, context) {
        context = this._getContext(context);

        var nodes = [];
        this.each(function(node) {
            var parent = node.parentNode;
            while (parent && parent !== context) {
                if (selector) {
                    if (new Dom(parent).is(selector)) { nodes.push(parent); }
                }
                else {
                    nodes.push(parent);
                }

                parent = parent.parentNode;
            }
        });

        return new Dom(nodes);
    },
    closest: function(selector, context) {
        context = this._getContext(context);
        selector = (selector.dom) ? selector.get() : selector;

        var nodes = [];
        var isNode = (selector && selector.nodeType);
        this.each(function(node) {
            do {
                if ((isNode && node === selector) || new Dom(node).is(selector)) return nodes.push(node);
            } while ((node = node.parentNode) && node !== context);
        });

        return new Dom(nodes);
    },
    next: function(selector) {
         return this._getSibling(selector, 'nextSibling');
    },
    nextElement: function(selector) {
        return this._getSibling(selector, 'nextElementSibling');
    },
    prev: function(selector) {
        return this._getSibling(selector, 'previousSibling');
    },
    prevElement: function(selector) {
        return this._getSibling(selector, 'previousElementSibling');
    },

    // css
    css: function(name, value) {
        if (value === undefined && (typeof name !== 'object')) {
            var node = this.get();
            if (name === 'width' || name === 'height') {
                return (node.style) ? this._getHeightOrWidth(name, node, false) + 'px' : undefined;
            }
            else {
                return (node.style) ? getComputedStyle(node, null)[name] : undefined;
            }
        }

        // set
        return this.each(function(node) {
            var obj = {};
            if (typeof name === 'object') obj = name;
            else obj[name] = value;

            for (var key in obj)
            {
                if (node.style) node.style[key] = obj[key];
            }
        });
    },

    // attr
    attr: function(name, value, data) {
        data = (data) ? 'data-' : '';

        if (value === undefined && (typeof name !== 'object')) {
            var node = this.get();
            if (node && node.nodeType !== 3) {
                return (name === 'checked') ? node.checked : this._getBooleanFromStr(node.getAttribute(data + name));
            }
            else {
                return;
            }
        }

        // set
        return this.each(function(node) {
            var obj = {};
            if (typeof name === 'object') obj = name;
            else obj[name] = value;

            for (var key in obj) {
                if (node.nodeType !== 3) {
                    if (key === 'checked') node.checked = obj[key];
                    else node.setAttribute(data + key, obj[key]);
                }
            }
        });
    },
    data: function(name, value) {
        if (name === undefined) {
            var reDataAttr = /^data\-(.+)$/;
            var attrs = this.get().attributes;

            var data = {};
            var replacer = function (g) { return g[1].toUpperCase(); };

            for (var key in attrs) {
                if (attrs[key] && reDataAttr.test(attrs[key].nodeName)) {
                    var dataName = attrs[key].nodeName.match(reDataAttr)[1];
                    var val = attrs[key].value;
                    dataName = dataName.replace(/-([a-z])/g, replacer);

                    if (this._isObjectString(val)) val = this._toObject(val);
                    else val = (this._isNumber(val)) ? parseFloat(val) : this._getBooleanFromStr(val);

                    data[dataName] = val;
                }
            }

            return data;
        }

        return this.attr(name, value, true);
    },
    val: function(value) {
        if (value === undefined) {
            var el = this.get();
            if (el.type && el.type === 'checkbox') return el.checked;
            else return el.value;
        }

        return this.each(function(node) {
            node.value = value;
        });
    },
    removeAttr: function(value) {
        return this.each(function(node) {
            var rmAttr = function(name) { if (node.nodeType !== 3) node.removeAttribute(name); };
            value.split(' ').forEach(rmAttr);
        });
    },
    removeData: function(value) {
        return this.each(function(node) {
            var rmData = function(name) { if (node.nodeType !== 3) node.removeAttribute('data-' + name); };
            value.split(' ').forEach(rmData);
        });
    },

    // dataset/dataget
    dataset: function(key, value) {
        return this.each(function(node) {
            DomCache[this.dataindex(node)][key] = value;
        });
    },
    dataget: function(key) {
        return DomCache[this.dataindex(this.get())][key];
    },
    dataindex: function(el) {
        var cacheIndex = el[DomExpando];
        var nextCacheIndex = DomCache.length;

        if (!cacheIndex) {
            cacheIndex = el[DomExpando] = nextCacheIndex;
            DomCache[cacheIndex] = {};
        }

        return cacheIndex;
    },

    // class
    addClass: function(value) {
        return this._eachClass(value, 'add');
    },
    removeClass: function(value) {
        return this._eachClass(value, 'remove');
    },
    toggleClass: function(value) {
        return this._eachClass(value, 'toggle');
    },
    hasClass: function(value) {
        return this.nodes.some(function(node) {
            return (node.classList) ? node.classList.contains(value) : false;
        });
    },

    // html & text
    empty: function() {
        return this.each(function(node) {
            node.innerHTML = '';
        });
    },
    html: function(html) {
        return (html === undefined) ? (this.get().innerHTML || '') : this.empty().append(html);
    },
    text: function(text) {
        return (text === undefined) ? (this.get().textContent || '') : this.each(function(node) { node.textContent = text; });
    },

    // manipulation
    after: function(html) {
        return this._inject(html, function(frag, node) {
            if (typeof frag === 'string') {
                node.insertAdjacentHTML('afterend', frag);
            }
            else {
                if (node.parentNode !== null) {
                    for (var i = frag instanceof Node ? [frag] : this._toArray(frag).reverse(), s = 0; s < i.length; s++) {
                        node.parentNode.insertBefore(i[s], node.nextSibling);
                    }
                }
            }

            return node;

        });
    },
    before: function(html) {
        return this._inject(html, function(frag, node) {
            if (typeof frag === 'string') {
                node.insertAdjacentHTML('beforebegin', frag);
            }
            else {
                var elms = (frag instanceof Node) ? [frag] : this._toArray(frag);
                for (var i = 0; i < elms.length; i++) {
                    node.parentNode.insertBefore(elms[i], node);
                }
            }

            return node;
        });
    },
    append: function(html) {
        return this._inject(html, function(frag, node) {
            if (typeof frag === 'string' || typeof frag === 'number') {
                node.insertAdjacentHTML('beforeend', frag);
            }
            else {
                var elms = (frag instanceof Node) ? [frag] : this._toArray(frag);
                for (var i = 0; i < elms.length; i++) {
                    node.appendChild(elms[i]);
                }
            }

            return node;
        });
    },
    prepend: function(html) {
        return this._inject(html, function(frag, node) {
            if (typeof frag === 'string' || typeof frag === 'number') {
                node.insertAdjacentHTML('afterbegin', frag);
            }
            else {
                var elms = (frag instanceof Node) ? [frag] : this._toArray(frag).reverse();
                for (var i = 0; i < elms.length; i++) {
                    node.insertBefore(elms[i], node.firstChild);
                }
            }

            return node;
        });
    },
    wrap: function(html) {
        return this._inject(html, function(frag, node) {
            var wrapper = (typeof frag === 'string' || typeof frag === 'number') ? this.create(frag)[0] : (frag instanceof Node) ? frag : this._toArray(frag)[0];

            if (node.parentNode) {
                node.parentNode.insertBefore(wrapper, node);
            }

            wrapper.appendChild(node);

            return new Dom(wrapper);

        });
    },
    unwrap: function() {
        return this.each(function(node) {
            var $node = new Dom(node);

            return $node.replaceWith($node.contents());
        });
    },
    replaceWith: function(html) {
        return this._inject(html, function(frag, node) {
            var docFrag = document.createDocumentFragment();
            var elms = (typeof frag === 'string' || typeof frag === 'number') ? this.create(frag) : (frag instanceof Node) ? [frag] : this._toArray(frag);

            for (var i = 0; i < elms.length; i++) {
                docFrag.appendChild(elms[i]);
            }

            var result = docFrag.childNodes[0];
            node.parentNode.replaceChild(docFrag, node);

            return result;

        });
    },
    remove: function() {
        return this.each(function(node) {
            if (node.parentNode) node.parentNode.removeChild(node);
        });
    },
    clone: function(events) {
        var nodes = [];
        this.each(function(node) {
            var copy = this._clone(node);
            if (events) copy = this._cloneEvents(node, copy);
            nodes.push(copy);
        });

        return new Dom(nodes);
    },

    // show/hide
    show: function() {
        return this.each(function(node) {
            if (!node.style || !this._hasDisplayNone(node)) return;

            var target = node.getAttribute('domTargetShow');

            node.style.display = (target) ? target : 'block';
            node.removeAttribute('domTargetShow');

        }.bind(this));
    },
    hide: function() {
        return this.each(function(node) {
            if (!node.style || this._hasDisplayNone(node)) return;

            var display = node.style.display;

            if (display !== 'block') node.setAttribute('domTargetShow', display);
            node.style.display = 'none';
        });
    },

    // dimensions
    scrollTop: function(value) {
        var node = this.get();
        var isWindow = (node === window);
        var isDocument = (node.nodeType === 9);
        var el = (isDocument) ? (document.scrollingElement || document.body.parentNode || document.body || document.documentElement) : node;

        if (value !== undefined) {
            if (isWindow) window.scrollTo(0, value);
            else el.scrollTop = value;
            return;
        }

        if (isDocument) {
            return (typeof window.pageYOffset != 'undefined') ? window.pageYOffset : ((document.documentElement.scrollTop) ? document.documentElement.scrollTop : ((document.body.scrollTop) ? document.body.scrollTop : 0));
        }
        else {
            return (isWindow) ? window.pageYOffset : el.scrollTop;
        }
    },
    offset: function() {
        return this._getDim('Offset');
    },
    position: function() {
        return this._getDim('Position');
    },
    width: function(value, adjust) {
        return this._getSize('width', 'Width', value, adjust);
    },
    height: function(value, adjust) {
        return this._getSize('height', 'Height', value, adjust);
    },
    outerWidth: function() {
        return this._getInnerOrOuter('width', 'outer');
    },
    outerHeight: function() {
        return this._getInnerOrOuter('height', 'outer');
    },
    innerWidth: function() {
        return this._getInnerOrOuter('width', 'inner');
    },
    innerHeight: function() {
        return this._getInnerOrOuter('height', 'inner');
    },

    // events
    click: function() {
        return this._triggerEvent('click');
    },
    focus: function() {
        return this._triggerEvent('focus');
    },
    blur: function() {
        return this._triggerEvent('blur');
    },
    trigger: function(names) {
        return this.each(function(node) {
            var events = names.split(' ');
            for (var i = 0; i < events.length; i++) {
                var ev;
                var opts = { bubbles: true, cancelable: true };

                try {
                    ev = new window.CustomEvent(events[i], opts);
                } catch(e) {
                    ev = document.createEvent('CustomEvent');
                    ev.initCustomEvent(events[i], true, true);
                }

                node.dispatchEvent(ev);
            }
        });
    },
    on: function(names, handler, one) {
        return this.each(function(node) {
            var events = names.split(' ');
            for (var i = 0; i < events.length; i++) {
                var event = this._getEventName(events[i]);
                var namespace = this._getEventNamespace(events[i]);

                handler = (one) ? this._getOneHandler(handler, names) : handler;
                node.addEventListener(event, handler);

                node._e = node._e || {};
                node._e[namespace] = node._e[namespace] || {};
                node._e[namespace][event] = node._e[namespace][event] || [];
                node._e[namespace][event].push(handler);
            }

        });
    },
    one: function(events, handler) {
        return this.on(events, handler, true);
    },
    off: function(names, handler) {
        var testEvent = function(name, key, event) { return (name === event); };
        var testNamespace = function(name, key, event, namespace) { return (key === namespace); };
        var testEventNamespace = function(name, key, event, namespace) { return (name === event && key === namespace); };
        var testPositive = function() { return true; };

        if (names === undefined) {
            // all
            return this.each(function(node) {
                this._offEvent(node, false, false, handler, testPositive);
            });
        }

        return this.each(function(node) {
            var events = names.split(' ');

            for (var i = 0; i < events.length; i++) {
                var event = this._getEventName(events[i]);
                var namespace = this._getEventNamespace(events[i]);

                // 1) event without namespace
                if (namespace === '_events') this._offEvent(node, event, namespace, handler, testEvent);
                // 2) only namespace
                else if (!event && namespace !== '_events') this._offEvent(node, event, namespace, handler, testNamespace);
                // 3) event + namespace
                else this._offEvent(node, event, namespace, handler, testEventNamespace);
            }
        });
    },

    // form
    serialize: function(asObject) {
        var obj = {};
        var elms = this.get().elements;
        for (var i = 0; i < elms.length; i++) {
            var el = elms[i];
            if (/(checkbox|radio)/.test(el.type) && !el.checked) continue;
            if (!el.name || el.disabled || el.type === 'file') continue;

            if (el.type === 'select-multiple') {
                for (var z = 0; z < el.options.length; z++) {
                    var opt = el.options[z];
                    if (opt.selected) obj[el.name] = opt.value;
                }
            }

            obj[el.name] = (this._isNumber(el.value)) ? parseFloat(el.value) : this._getBooleanFromStr(el.value);
        }

        return (asObject) ? obj : this._toParams(obj);
    },
    ajax: function(success, error) {
        if (typeof AjaxRequest !== 'undefined')
        {
            var method = this.attr('method') || 'post';
            var options = {
                url: this.attr('action'),
                data: this.serialize(),
                success: success,
                error: error
            };

            return new AjaxRequest(method, options);
        }
    },

    // private
    _queryContext: function(selector, context) {
        context = this._getContext(context);

        return (context.nodeType !== 3 && typeof context.querySelectorAll === 'function') ? context.querySelectorAll(selector) : [];
    },
    _query: function(selector, context) {
        if (context) {
            return this._queryContext(selector, context);
        }
        else if (/^[.#]?[\w-]*$/.test(selector)) {
            if (selector[0] === '#') {
                var element = document.getElementById(selector.slice(1));
                return element ? [element] : [];
            }

            if (selector[0] === '.') {
                return document.getElementsByClassName(selector.slice(1));
            }

            return document.getElementsByTagName(selector);
        }

        return document.querySelectorAll(selector);
    },
    _getContext: function(context) {
        context = (typeof context === 'string') ? document.querySelector(context) : context;

        return (context && context.dom) ? context.get() : (context || document);
    },
    _inject: function(html, fn) {
        var len = this.nodes.length;
        var nodes = [];
        while (len--) {
            var res = (typeof html === 'function') ? html.call(this, this.nodes[len]) : html;
            var el = (len === 0) ? res : this._clone(res);
            var node = fn.call(this, el, this.nodes[len]);

            if (node) {
                if (node.dom) nodes.push(node.get());
                else nodes.push(node);
            }
        }

        return new Dom(nodes);
    },
    _cloneEvents: function(node, copy) {
        var events = node._e;
        if (events) {
            copy._e = events;
            for (var name in events._events) {
                for (var i = 0; i < events._events[name].length; i++) {
                    copy.addEventListener(name, events._events[name][i]);
                }
            }
        }

        return copy;
    },
    _clone: function(node) {
        if (typeof node === 'undefined') return;
        if (typeof node === 'string') return node;
        else if (node instanceof Node || node.nodeType) return node.cloneNode(true);
        else if ('length' in node) {
            return [].map.call(this._toArray(node), function(el) { return el.cloneNode(true); });
        }
    },
    _slice: function(obj) {
        return (!obj || obj.length === 0) ? [] : (obj.length) ? [].slice.call(obj.nodes || obj) : [obj];
    },
    _eachClass: function(value, type) {
        return this.each(function(node) {
            if (value) {
                var setClass = function(name) { if (node.classList) node.classList[type](name); };
                value.split(' ').forEach(setClass);
            }
        });
    },
    _triggerEvent: function(name) {
        var node = this.get();
        if (node && node.nodeType !== 3) node[name]();
        return this;
    },
    _getOneHandler: function(handler, events) {
        var self = this;
        return function() {
            handler.apply(this, arguments);
            self.off(events);
        };
    },
    _getEventNamespace: function(event) {
        var arr = event.split('.');
        var namespace = (arr[1]) ? arr[1] : '_events';
        return (arr[2]) ? namespace + arr[2] : namespace;
    },
    _getEventName: function(event) {
        return event.split('.')[0];
    },
    _offEvent: function(node, event, namespace, handler, condition) {
        for (var key in node._e) {
            for (var name in node._e[key]) {
                if (condition(name, key, event, namespace)) {
                    var handlers = node._e[key][name];
                    for (var i = 0; i < handlers.length; i++) {
                        if (typeof handler !== 'undefined' && handlers[i].toString() !== handler.toString()) {
                            continue;
                        }

                        node.removeEventListener(name, handlers[i]);
                        node._e[key][name].splice(i, 1);

                        if (node._e[key][name].length === 0) delete node._e[key][name];
                        if (Object.keys(node._e[key]).length === 0) delete node._e[key];
                    }
                }
            }
        }
    },
    _getInnerOrOuter: function(method, type) {
        return this[method](undefined, type);
    },
    _getDocSize: function(node, type) {
        var body = node.body, html = node.documentElement;
        return Math.max(body['scroll' + type], body['offset' + type], html['client' + type], html['scroll' + type], html['offset' + type]);
    },
    _getSize: function(type, captype, value, adjust) {
        if (value === undefined) {
            var el = this.get();
            if (el.nodeType === 3)      value = 0;
            else if (el.nodeType === 9) value = this._getDocSize(el, captype);
            else if (el === window)     value = window['inner' + captype];
            else                        value = this._getHeightOrWidth(type, el, adjust || 'normal');

            return Math.round(value);
        }

        return this.each(function(node) {
            value = parseFloat(value);
            value = value + this._adjustResultHeightOrWidth(type, node, adjust || 'normal');

            new Dom(node).css(type, value + 'px');

        }.bind(this));
    },
    _getHeightOrWidth: function(type, el, adjust) {
        if (!el) return 0;

        var name = type.charAt(0).toUpperCase() + type.slice(1);
        var result = 0;
        var style = getComputedStyle(el, null);
        var $el = new Dom(el);
        var $targets = $el.parents().filter(function(node) {
            return (node.nodeType === 1 && getComputedStyle(node, null).display === 'none') ? node : false;
        });

        if (style.display === 'none') $targets.add(el);
        if ($targets.length !== 0) {
            var fixStyle = 'visibility: hidden !important; display: block !important;';
            var tmp = [];

            $targets.each(function(node) {
                var $node = new Dom(node);
                var thisStyle = $node.attr('style');
                if (thisStyle !== null) tmp.push(thisStyle);
                $node.attr('style', (thisStyle !== null) ? thisStyle + ';' + fixStyle : fixStyle);
            });

            result = $el.get()['offset' + name] - this._adjustResultHeightOrWidth(type, el, adjust);

            $targets.each(function(node, i) {
                var $node = new Dom(node);
                if (tmp[i] === undefined) $node.removeAttr('style');
                else $node.attr('style', tmp[i]);
            });
        }
        else {
            result = el['offset' + name] - this._adjustResultHeightOrWidth(type, el, adjust);
        }

        return result;
    },
    _adjustResultHeightOrWidth: function(type, el, adjust) {
        if (!el || adjust === false) return 0;

        var fix = 0;
        var style = getComputedStyle(el, null);
        var isBorderBox = (style.boxSizing === "border-box");

        if (type === 'height') {
            if (adjust === 'inner' || (adjust === 'normal' && isBorderBox)) {
                fix += (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.borderBottomWidth) || 0);
            }

            if (adjust === 'outer') fix -= (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
        }
        else {
            if (adjust === 'inner' || (adjust === 'normal' && isBorderBox)) {
                fix += (parseFloat(style.borderLeftWidth) || 0) + (parseFloat(style.borderRightWidth) || 0);
            }

            if (adjust === 'outer') fix -= (parseFloat(style.marginLeft) || 0) + (parseFloat(style.marginRight) || 0);
        }

        return fix;
    },
    _getDim: function(type) {
        var node = this.get();
        return (node.nodeType === 3) ? { top: 0, left: 0 } : this['_get' + type](node);
    },
    _getPosition: function(node) {
        return { top: node.offsetTop, left: node.offsetLeft };
    },
    _getOffset: function(node) {
        var rect = node.getBoundingClientRect();
        var doc = node.ownerDocument;
		var docElem = doc.documentElement;
		var win = doc.defaultView;

		return {
			top: rect.top + win.pageYOffset - docElem.clientTop,
			left: rect.left + win.pageXOffset - docElem.clientLeft
		};
    },
    _getSibling: function(selector, method) {
        selector = (selector && selector.dom) ? selector.get() : selector;

        var isNode = (selector && selector.nodeType);
        var sibling;

        this.each(function(node) {
            while (node = node[method]) {
                if ((isNode && node === selector) || new Dom(node).is(selector)) {
                    sibling = node;
                    return;
                }
            }
        });

        return new Dom(sibling);
    },
    _toArray: function(obj) {
        if (obj instanceof NodeList) {
            var arr = [];
            for (var i = 0; i < obj.length; i++) {
                arr[i] = obj[i];
            }

            return arr;
        }
        else if (obj === undefined) return [];
        else {
            return (obj.dom) ? obj.nodes : obj;
        }
    },
    _toParams: function(obj) {
        var params = '';
        for (var key in obj) {
            params += '&' + this._encodeUri(key) + '=' + this._encodeUri(obj[key]);
        }

        return params.replace(/^&/, '');
    },
    _toObject: function(str) {
        return (new Function("return " + str))();
    },
    _encodeUri: function(str) {
        return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
    },
    _isNumber: function(str) {
        return !isNaN(str) && !isNaN(parseFloat(str));
    },
    _isObjectString: function(str) {
        return (str.search(/^{/) !== -1);
    },
    _getBooleanFromStr: function(str) {
        if (str === 'true') return true;
        else if (str === 'false') return false;

        return str;
    },
    _hasDisplayNone: function(el) {
        return (el.style.display === 'none') || ((el.currentStyle) ? el.currentStyle.display : getComputedStyle(el, null).display) === 'none';
    }
};
// Unique ID
var uuid = 0;

// Init
var ArticleEditor = function(selector, settings) {
    return ArticleEditorInit(selector, settings);
};

// Globals
ArticleEditor.instances = [];
ArticleEditor.version = '1.5.1';
ArticleEditor.settings = {};
ArticleEditor.lang = {};
ArticleEditor._mixins = {};
ArticleEditor._store = {};
ArticleEditor._subscribe = {};
ArticleEditor.keycodes = {
	BACKSPACE: 8,
	DELETE: 46,
	UP: 38,
	DOWN: 40,
	ENTER: 13,
	SPACE: 32,
	ESC: 27,
	TAB: 9,
	CTRL: 17,
	META: 91,
	SHIFT: 16,
	ALT: 18,
	RIGHT: 39,
	LEFT: 37
};

// Dom & Ajax
ArticleEditor.dom = function(selector, context) { return new Dom(selector, context); };
ArticleEditor.ajax = Ajax;

// Class
var ArticleEditorInit = function(selector, settings, args) {
    var namespace = 'article-editor';
    var $elms = ArticleEditor.dom(selector);
    var instance;

    $elms.each(function(node) {
        var $el = ArticleEditor.dom(node);
        instance = $el.dataget(namespace);

        if (!instance) {
            // Initialization
            instance = new App($el, settings, uuid);
            $el.dataset(namespace, instance);
            ArticleEditor.instances[uuid] = instance;
            uuid++;
        }
    });

    return instance;
};

// Add
ArticleEditor.add = function(type, name, obj) {
    // translations
    if (obj.translations) {
        ArticleEditor.lang = ArticleEditor.extend(true, ArticleEditor.lang, obj.translations);
    }

    // defaults
    if (obj.defaults) {
        var localopts = {};
        localopts[name] = obj.defaults;
        ArticleEditor.opts = ArticleEditor.extend(true, ArticleEditor.opts, localopts);
    }

    // mixin
    if (type === 'mixin') {
        ArticleEditor._mixins[name] = obj;
    }
    else {
        // subscribe
        if (obj.subscribe) {
            for (var key in obj.subscribe) {

                if (typeof ArticleEditor._subscribe[key] === 'undefined') {
                    ArticleEditor._subscribe[key] = [];
                }

                var event = {
                    module: name,
                    func: obj.subscribe[key]
                };

                ArticleEditor._subscribe[key].push(event);
            }
        }

        // prototype
        var F = function() {};
        F.prototype = obj;

        // mixins
        if (obj.mixins) {
            for (var i = 0; i < obj.mixins.length; i++) {
                ArticleEditor.inherit(F, ArticleEditor._mixins[obj.mixins[i]]);
            }
        }

        // store
        ArticleEditor._store[name] = { type: type, proto: F };
    }
};

// Lang
ArticleEditor.addLang = function(lang, obj) {
    if (typeof ArticleEditor.lang[lang] === 'undefined') {
        ArticleEditor.lang[lang] = {};
    }

    ArticleEditor.lang[lang] = ArticleEditor.extend(true, ArticleEditor.lang[lang], obj);
};

// Inherit
ArticleEditor.inherit = function(current, parent) {
    var F = function() {};
    F.prototype = parent;
    var f = new F();

    for (var prop in current.prototype) {
        if (current.prototype.__lookupGetter__(prop)) {
            f.__defineGetter__(prop, current.prototype.__lookupGetter__(prop));
        }
        else {
            f[prop] = current.prototype[prop];
        }
    }

    current.prototype = f;
    current.prototype.super = parent;

    return current;
};

// Error
ArticleEditor.error = function(exception) {
    throw exception;
};

// Extend
ArticleEditor.extend = function() {
    var extended = {};
    var deep = false;
    var i = 0;
    var length = arguments.length;

    if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
        deep = arguments[0];
        i++;
    }

    var merge = function(obj) {
        for (var prop in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                    extended[prop] = ArticleEditor.extend(true, extended[prop], obj[prop]);
                }
                else {
                    extended[prop] = obj[prop];
                }
            }
        }
    };

    for (; i < length; i++) {
        var obj = arguments[i];
        merge(obj);
    }

    return extended;
};
ArticleEditor.opts = {
    plugins: [],
    editor: {
        focus: false,
        control: true,
        classname: 'arx-content',
        lang: 'en',
        scrollTarget: document,
        direction: 'ltr',
        spellcheck: true,
        grammarly: false,
        notranslate: false,
        minHeight: false, // string, '100px'
        maxHeight: false, // string, '100px'
        undoredo: false,
        shortcutsPopup: true,
        multipleSelection: false
    },
    source: true,
    image: {
        upload: false,
        url: true,
        select: false,
        name: 'file',
        data: false,
        drop: true,
        multiple: true,
        clipboard: true,
        tag: 'figure' // p, div, figure
    },
    codemirror: false,
    buffer: {
        limit: 100
    },
    path: {
        title: '## editor.title ##'
    },
    autosave: {
        url: false,
        name: false,
        data: false
    },
    paste: {
        clean: true,
        autolink: true,
        paragraphize: true,
        plaintext: false,
        linkTarget: false,
        images: true,
        links: true,
        keepStyle: [],
        keepClass: [],
        keepAttrs: ['td', 'th'],
        formTags: ['form', 'input', 'button', 'select', 'textarea', 'legend', 'fieldset'],
        blockTags: ['pre', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'tbody', 'thead', 'tfoot', 'th', 'tr', 'td', 'ul', 'ol', 'li', 'blockquote', 'p', 'figure', 'figcaption', 'address', 'section', 'header', 'footer', 'aside', 'article'],
        inlineTags: ['a', 'svg', 'img', 'br', 'strong', 'ins', 'code', 'del', 'span', 'samp', 'kbd', 'sup', 'sub', 'mark', 'var', 'cite', 'small', 'b', 'u', 'em', 'i', 'abbr']
    },
    plaintext: {
        markup: false,
        classname: 'arx-text'
    },
    tab: {
        spaces: false
    },
    noneditable: {
        classname: 'noneditable'
    },
    pre: {
        classname: false, // string
        spaces: 4 // or false
    },
    clean: {
        enter: true
    },
    toolbar: {
        sticky: true,
        stickyMinHeight: 200, // pixels
        stickyTopOffset: 0
    },
    buttons: {
        editor: {
            'shortcuts': { title: '## buttons.shortcuts ##', command: 'shortcuts.buildPopup', observer: 'shortcuts.observePopup' },
            'templates': { title: '## buttons.templates ##', command: 'template.buildPopup', observer: 'template.observe' },
            'html': { title: '## buttons.html ##',  command: 'source.toggle' }
        },
        toolbar: {
            add: {
                title: '## buttons.add ##',
                popup: {
                    name: 'addbar',
                    width: '400px',
                    builder: 'toolbar.addbar'
                }
            },
            undo: { title: '## buttons.undo ##', command: 'buffer.undo' },
            redo: { title: '## buttons.redo ##', command: 'buffer.redo' }
        },
        control: {
            trash: { command: 'block.remove', title: '## command.delete ##' },
            duplicate: { command: 'block.duplicate', title: '## command.duplicate ##' }
        }
    },
    embed: {
        responsive: 'embed-responsive'
    },
    code: {
        template: '<pre></pre>'
    },
    line: true,
    layer: {
        template: '<div></div>'
    },
    table: {
        template: '<table><tr><td></td><td></td></tr><tr><td></td><td></td></tr></table>'
    },
    addbar: {
        text: {
            title: '## buttons.text ##',
            command: 'block.addBlock'
        },
        image: {
            title: '## buttons.image ##',
            command: 'image.buildPopup',
            observer: 'image.observeAdd'
        },
        embed: {
            title: '## buttons.embed ##',
            command: 'embed.buildPopup',
            observer: 'embed.observeAdd'
        },
        line: {
            title: '## buttons.line ##',
            command: 'block.addBlock',
            observer: 'block.observeAdd'
        },
        table: {
            title: '## buttons.table ##',
            command: 'table.addBlock',
            observer: 'table.observeAdd'
        },
        snippet: {
            title: '## buttons.snippet ##',
            command: 'snippet.buildPopup',
            observer: 'snippet.observeAdd'
        },
        quote: {
            title: '## buttons.quote ##',
            command: 'block.addBlock',
            observer: 'block.observeAdd'
        },
        code: {
            title: '## buttons.code ##',
            command: 'code.buildPopup',
            observer: 'code.observeAdd'
        },
        grid: {
            title: '## buttons.grid ##',
            command: 'grid.buildPopup',
            observer: 'grid.observeAdd'
        },
        layer: {
            title: '## buttons.layer ##',
            command: 'block.addBlock',
            observer: 'block.observeAdd'
        }
    },
    format: {
        "p": {
            title: '## format.normal-text ##',
            params: { tag: 'p', block: 'paragraph' }
        },
        "h1": {
            title: '<span style="font-size: 20px; font-weight: bold;">## format.large-heading ##</span>',
            params: { tag: 'h1', block: 'heading' }
        },
        "h2": {
            title: '<span style="font-size: 16px; font-weight: bold;">## format.medium-heading ##</span>',
            params: { tag: 'h2', block: 'heading' }
        },
        "h3": {
            title: '<span style="font-weight: bold;">## format.small-heading ##</span>',
            params: { tag: 'h3', block: 'heading' }
        },
        "ul": {
            title: '&bull; ## format.unordered-list ##',
            params: { tag: 'ul', block: 'list' }
        },
        "ol": {
            title: '1. ## format.ordered-list ##',
            params: { tag: 'ol', block: 'list' }
        }
    },
    inline: {
        "bold": {
            title: '<span style="font-weight: bold;">## inline.bold ##</span>',
            params: { tag: 'b' }
        },
        "italic": {
            title: '<span style="font-style: italic;">## inline.italic ##</span>',
            params: { tag: 'i' }
        },
        "deleted": {
            title: '<span style="text-decoration: line-through;">## inline.deleted ##</span>',
            params: { tag: 'del' }
        }
    },
    link: {
        size: 30,
        nofollow: false,
        target: false
    },
    outset: {
        'outset-none': {
            title: '## outset.none ##',
            params: { classname: false }
        },
        'outset-left': {
            title: '## outset.left ##',
            params: { classname: 'outset-left' }
        },
        'outset-both': {
            title: '## outset.both ##',
            params: { classname: 'outset-both' }
        },
        'outset-right': {
            title: '## outset.right ##',
            params: { classname: 'outset-right' }
        }
    },
    align: {
        'align-left': {
            title: '## align.left ##',
            params: { classname: 'align-left' }
        },
        'align-center': {
            title: '## align.center ##',
            params: { classname: 'align-center' }
        },
        'align-right': {
            title: '## align.right ##',
            params: { classname: 'align-right' }
        },
        'align-justify': {
            title: '## align.justify ##',
            params: { classname: 'align-justify' }
        }
    },
    valign: {
        'valign-none': {
            title: '## valign.none ##',
            params: { classname: false }
        },
        'valign-top': {
            title: '## valign.top ##',
            params: { classname: 'valign-top' }
        },
        'valign-middle': {
            title: '## valign.middle ##',
            params: { classname: 'valign-middle' }
        },
        'valign-bottom': {
            title: '## valign.bottom ##',
            params: { classname: 'valign-bottom' }
        }
    },
    quote: {
        template: '<blockquote><p>Quote...</p><p><cite>Author Attribution</cite></p></blockquote>'
    },
    grid: {
        classname: 'grid',
        overlay: true,
        columns: {
            size: 12,
            gutter: '24px',
            classname: 'column',
            prefix: 'column-'
        },
        patterns: [
            '6|6', '4|4|4', '3|3|3|3', '2|2|2|2|2|2',
            '3|6|3', '2|8|2', '5|7', '7|5',
            '4|8', '8|4', '3|9', '9|3',
            '2|10', '10|2', '12'
        ]
    },
    snippets: {
        json: false
    },
    templates: {
        json: false
    },
    shortcutsBase: {
        'meta+z': '## shortcuts.meta-z ##',
        'meta+shift+z': '## shortcuts.meta-shift-z ##',
        'meta+a': '## shortcuts.meta-a ##',
        'meta+shift+a': '## shortcuts.meta-shift-a ##',
        'meta+click': '## shortcuts.meta-click ##'
    },
    shortcuts: {
        'ctrl+shift+d, meta+shift+d': {
            title: '## shortcuts.meta-shift-d ##',
            name: 'meta+shift+d',
            command: 'block.duplicate'
        },
        'ctrl+shift+up, meta+shift+up': {
            title: '## shortcuts.meta-shift-up ##',
            name: 'meta+shift+&uarr;',
            command: 'block.moveUp'
        },
        'ctrl+shift+down, meta+shift+down': {
            title: '## shortcuts.meta-shift-down ##',
            name: 'meta+shift+&darr;',
            command: 'block.moveDown'
        },
        'ctrl+shift+m, meta+shift+m': {
            title: '## shortcuts.meta-shift-m ##',
            name: 'meta+shift+m',
            command: 'inline.removeFormat'
        },
        'ctrl+b, meta+b': {
            title: '## shortcuts.meta-b ##',
            name: 'meta+b',
            command: 'inline.format',
            params: { tag: 'b' }
        },
        'ctrl+i, meta+i': {
            title: '## shortcuts.meta-i ##',
            name: 'meta+i',
            command: 'inline.format',
            params: { tag: 'i' }
        },
        'ctrl+u, meta+u': {
            title: '## shortcuts.meta-u ##',
            name: 'meta+u',
            command: 'inline.format',
            params: { tag: 'u' }
        },
        'ctrl+h, meta+h': {
            title: '## shortcuts.meta-h ##',
            name: 'meta+h',
            command: 'inline.format',
            params: { tag: 'sup' }
        },
        'ctrl+l, meta+l': {
            title: '## shortcuts.meta-l ##',
            name: 'meta+l',
            command: 'inline.format',
            params: { tag: 'sub' }
        },
        'ctrl+k, meta+k': {
            title: '## shortcuts.meta-k ##',
            name: 'meta+k',
            command: 'link.format'
        },
        'ctrl+alt+0, meta+alt+0': {
            title: '## shortcuts.meta-alt-0 ##',
            name: 'meta+alt+0',
            command: 'block.format',
            params: { tag: 'p', block: 'paragraph' }
        },
        'ctrl+alt+1, meta+alt+1': {
            title: '## shortcuts.meta-alt-1 ##',
            name: 'meta+alt+1',
            command: 'block.format',
            params: { tag: 'h1', block: 'heading' }
        },
        'ctrl+alt+2, meta+alt+2': {
            title: '## shortcuts.meta-alt-2 ##',
            name: 'meta+alt+2',
            command: 'block.format',
            params: { tag: 'h2', block: 'heading' }
        },
        'ctrl+alt+3, meta+alt+3': {
            title: '## shortcuts.meta-alt-3 ##',
            name: 'meta+alt+3',
            command: 'block.format',
            params: { tag: 'h3', block: 'heading' }
        },
        'ctrl+alt+4, meta+alt+4': {
            title: '## shortcuts.meta-alt-4 ##',
            name: 'meta+alt+4',
            command: 'block.format',
            params: { tag: 'h4', block: 'heading' }
        },
        'ctrl+alt+5, meta+alt+5': {
            title: '## shortcuts.meta-alt-5 ##',
            name: 'meta+alt+5',
            command: 'block.format',
            params: { tag: 'h5', block: 'heading' }
        },
        'ctrl+alt+6, meta+alt+6': {
            title: '## shortcuts.meta-alt-6 ##',
            name: 'meta+alt+6',
            command: 'block.format',
            params: { tag: 'h6', block: 'heading' }
        },
        'ctrl+shift+7, meta+shift+7': {
            title: '## shortcuts.meta-shift-7 ##',
            name: 'meta+shift+7',
            command: 'block.format',
            params: { tag: 'ol', block: 'list' }
        },
        'ctrl+shift+8, meta+shift+8': {
            title: '## shortcuts.meta-shift-8 ##',
            name: 'meta+shift+8',
            command: 'block.format',
            params: { tag: 'ul', block: 'list' }
        },
        'ctrl+], meta+]': {
            title: '## shortcuts.meta-indent ##',
            name: 'meta+]',
            command: 'list.indent'
        },
        'ctrl+[, meta+[': {
            title: '## shortcuts.meta-outdent ##',
            name: 'meta+[',
            command: 'list.outdent'
        }
    },

    // private
    markerChar: '\ufeff',
    arxclasses: 'arx-block-editable arx-block-focus arx-block-focus-offset arx-block-multiple-focus arx-block-multiple-hover arx-block-hover arx-block-no-hover arx-grid-overlay arx-empty-layer',
    tags: {
        denied: ['font', 'html', 'head', 'link', 'title', 'body', 'meta', 'applet', 'marquee'],
        form: ['form', 'input', 'button', 'select', 'textarea', 'legend', 'fieldset'],
        inline: ['a', 'svg', 'span', 'strong', 'strike', 'b', 'u', 'em', 'i', 'code', 'del', 'ins', 'samp', 'kbd', 'sup', 'sub', 'mark', 'var', 'cite', 'small', 'abbr'],
        block: ['pre', 'ul', 'ol', 'li', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',  'dl', 'dt', 'dd', 'div', 'table', 'tbody', 'thead', 'tfoot', 'tr', 'th', 'td', 'blockquote', 'output', 'figcaption', 'figure', 'address', 'main', 'section', 'header', 'footer', 'aside', 'article', 'iframe']
    },
    bsmodal: false,
    blocks: {
        text: {
            selector: false,
            command: 'parser.parseTextBlock',
            editable: true,
            controls: true,
            hover: true
        },
        paragraph: {
            selector: 'p',
            command: 'parser.parseTextBlock',
            editable: true,
            controls: true,
            hover: true
        },
        heading: {
            selector: 'h1, h2, h3, h4, h5, h6',
            command: 'parser.parseTextBlock',
            editable: true,
            controls: true,
            hover: true
        },
        quote: {
            selector: 'blockquote',
            command: 'parser.parseQuote',
            editable: false,
            controls: true,
            hover: false
        },
        quoteitem: {
            selector: 'blockquote p',
            command: 'parser.parseBlock',
            editable: true,
            controls: false,
            hover: true
        },
        list: {
            selector: 'ul, ol',
            command: 'parser.parseList',
            editable: true,
            controls: true,
            hover: true
        },
        figcaption: {
            selector: 'figcaption',
            command: 'parser.parseBlock',
            editable: true,
            controls: false,
            hover: true
        },
        table: {
            selector: 'table',
            command: 'parser.parseBlock',
            editable: false,
            controls: true,
            hover: true
        },
        row: {
            selector: 'tr',
            command: 'parser.parseBlock',
            editable: false,
            controls: false,
            hover: false
        },
        cell: {
            selector: 'td, th',
            command: 'parser.parseBlock',
            editable: true,
            controls: false,
            hover: true
        },
        layer: {
            selector: 'div, main, section, header, footer, aside, article',
            command: 'parser.parseLayer',
            editable: false,
            controls: true,
            hover: true
        },
        line: {
            selector: 'hr',
            command: 'parser.parseBlock',
            editable: false,
            controls: true,
            hover: true
        },
        code: {
            selector: 'pre',
            command: 'parser.parseCode',
            editable: false,
            controls: true,
            hover: true
        },
        image: {
            selector: 'img',
            command: 'parser.parseImage',
            editable: false,
            controls: true,
            hover: true
        },
        embed: {
            selector: 'figure, iframe',
            command: 'parser.parseEmbed',
            editable: false,
            controls: true,
            hover: true
        },
        snippet: {
            selector: false,
            command: 'parser.parseBlock',
            editable: false,
            controls: true,
            hover: true
        },
        column: {
            selector: false,
            command: 'parser.parseBlock',
            editable: false,
            controls: false,
            hover: false
        },
        grid: {
            selector: false,
            command: 'parser.parseBlock',
            editable: false,
            controls: true,
            hover: false
        },
        noneditable: {
            selector: false,
            command: false,
            editable: false,
            controls: true,
            hover: true
        }
    },
    regex: {
        youtube: /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube\.com\S*[^\w\-\s])([\w\-]{11})(?=[^\w\-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/gi,
        vimeo: /(http|https)?:\/\/(?:www.|player.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_-]+)?/gi,
        imageurl: /((https?|www)[^\s]+\.)(jpe?g|png|gif)(\?[^\s-]+)?/gi,
        url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi
    }
};
ArticleEditor.lang['en'] = {
    "accessibility": {
        "help-label": "Rich text editor"
    },
    "editor": {
        "title": "Article",
        "multiple": "Multiple",
    },
    "command": {
        "delete": "Delete",
        "duplicate": "Duplicate",
        "sort": "Sort",
        "edit": "Edit"
    },
    "placeholders": {
        "figcaption": "Type caption (optional)",
        "text": "Type something...",
        "code": "Edit to add code...",
        "layer": "Press enter to add a new text..."
    },
    "align": {
        "left": "Left align",
        "center": "Center align",
        "right": "Right align",
        "justify": "Justify"
    },
    "valign": {
        "none": "None",
        "top": "Top",
        "middle": "Middle",
        "bottom": "Bottom"
    },
    "outset": {
        "none": "None",
        "left": "Left",
        "both": "Both",
        "right": "Right"
    },
    "shortcuts": {
        "meta-a": "Select text in the block",
        "meta-shift-a": "Select all blocks",
        "meta-click": "Select multiple blocks",
        "meta-z": "Undo",
        "meta-shift-z": "Redo",
        "meta-shift-m": "Remove inline format",
        "meta-b": "Bold",
        "meta-i": "Italic",
        "meta-u": "Underline",
        "meta-h": "Superscript",
        "meta-l": "Subscript",
        "meta-k": "Link",
        "meta-alt-0": "Normal text",
        "meta-alt-1": "Heading 1",
        "meta-alt-2": "Heading 2",
        "meta-alt-3": "Heading 3",
        "meta-alt-4": "Heading 4",
        "meta-alt-5": "Heading 5",
        "meta-alt-6": "Heading 6",
        "meta-shift-7": "Ordered List",
        "meta-shift-8": "Unordered List",
        "meta-indent": "Indent",
        "meta-outdent": "Outdent",
        "meta-shift-d": "Duplicate block",
        "meta-shift-up": "Move line up",
        "meta-shift-down": "Move line down"
    },
    "headings": {
        "h1": "Large Heading",
        "h2": "Medium Heading",
        "h3": "Small Heading",
        "h4": "Heading 4",
        "h5": "Heading 5",
        "h6": "Heading 6"
    },
    "inline": {
        "bold": "Bold",
        "italic": "Italic",
        "deleted": "Deleted"
    },
    "list": {
        "indent": "Indent",
        "outdent": "Outdent"
    },
    "link": {
        "link": "Link",
        "edit-link": "Edit link",
        "unlink": "Unlink",
        "link-in-new-tab": "Open link in new tab",
        "save": "Save",
        "insert": "Insert",
        "cancel": "Cancel",
        "text": "Text",
        "url": "URL"
    },
    "table": {
        "width": "Width",
        "nowrap": "Nowrap",
        "save": "Save",
        "cancel": "Cancel"
    },
    "image": {
        "or": "or",
        "alt-text": "Alt Text",
        "save": "Save",
        "link": "Link",
        "delete": "Delete",
        "cancel": "Cancel",
        "insert": "Insert",
        "link-in-new-tab": "Open link in new tab",
        "url-placeholder": "Paste url of image...",
        "upload-new-placeholder": "Drag to upload a new image<br>or click to select"
    },
    "code": {
        "code": "Code",
        "insert": "Insert",
        "save": "Save",
        "cancel": "Cancel"
    },
    "embed": {
        "embed": "Embed",
        "insert": "Insert",
        "save": "Save",
        "cancel": "Cancel",
        "description": "Paste any embed/html code or enter the url (vimeo or youtube video only)",
        "responsive-video": "Responsive video"
    },
    "upload": {
        "placeholder": "Drag to upload <br>or click to select"
    },
    "templates": {
        "templates": "Templates"
    },
    "snippets": {
        "snippets": "Snippets"
    },
    "format": {
        "normal-text": "Normal Text",
        "large-heading": "Large Heading",
        "medium-heading": "Medium Heading",
        "small-heading": "Small Heading",
        "unordered-list": "Unordered List",
        "ordered-list": "Ordered List"
    },
    "buttons": {
        "transform-to-text": "Transform to text",
        "align": "Alignment",
        "valign": "Valign",
        "outset": "Outset",
        "indent": "Indent",
        "outdent": "Outdent",
        "head": "Head",
        "row": "Row",
        "cell": "Cell",
        "html": "HTML",
        "templates": "Templates",
        "shortcuts": "Keyboard Shortcuts",
        "format": "Format",
        "table": "Table",
        "add": "Add",
        "undo": "Undo",
        "redo": "Redo",
        "style": "Style",
        "config": "Config",
        "text": "Text",
        "embed": "Embed",
        "snippet": "Snippet",
        "grid": "Grid",
        "line": "Line",
        "image": "Image",
        "quote": "Quote",
        "code": "Code",
        "layer": "Layer"
    },
    "blocks": {
        "noneditable": "Noneditable",
        "paragraph": "Paragraph",
        "heading": "Heading",
        "image": "Image",
        "figcaption": "Figcaption",
        "embed": "Embed",
        "line": "Line",
        "code": "Code",
        "quote": "Quote",
        "quoteitem": "Paragraph",
        "snippet": "Snippet",
        "column": "Column",
        "grid": "Grid",
        "list": "List",
        "table": "Table",
        "row": "Row",
        "text": "Text",
        "cell": "Cell"
    }
};
var App = function($element, settings, uuid) {
    // environment
    this.uuid = uuid;
    this.keycodes = ArticleEditor.keycodes;
    this.dom = ArticleEditor.dom;
    this.ajax = ArticleEditor.ajax;
    this.$win = this.dom(window);
    this.$doc = this.dom(document);
    this.$body = this.dom('body');
    this.$element = $element;
    this._store = ArticleEditor._store;
    this._subscribe = ArticleEditor._subscribe;

    // initial
    this.initialSettings = settings;

    // starter
    this._initer = ['setting', 'lang'];
    this._priority = ['container', 'source', 'editor', 'toolbar', 'statusbar',  'path', 'control', 'popup', 'focus', 'buffer'];
    this._plugins = [];

    // started
    this.started = false;

    // start
    this.start();
};

App.prototype = {
    // start
    start: function(settings) {
        if (this.isStarted()) return;
        if (settings) this.initialSettings = settings;

        // core
        this._initCore();
        this._plugins = this.setting.get('plugins');

        // starting
        this.broadcast('app.before.start');

        // init
        this._initModules();
        this._initPlugins();

        // start
        this._startPriority();
        this._startModules();
        this._startPlugins();

        this.started = true;

        // started
        this.broadcast('app.start');
    },
    isStarted: function() {
        return this.started;
    },

    // stop
    stop: function() {
        if (this.isStopped()) return;

        // stopping
        this.broadcast('app.before.stop');

        this._stopPriority();
        this._stopModules();
        this._stopPlugins();

        this.started = false;

        // stopped
        this.broadcast('app.stop');
    },
    isStopped: function() {
        return !this.started;
    },

    // broadcast
    broadcast: function(name, params) {
        var event = (params instanceof App.Event) ? params : new App.Event(name, params);
        if (typeof this._subscribe[name] !== 'undefined') {
            var events = this._subscribe[name];
            for (var i = 0; i < events.length; i++) {
                var instance = this[events[i].module];
                if (instance) {
                    events[i].func.call(instance, event);
                }
            }
        }

        // callbacks
        var callbacks = (this.setting.has('subscribe')) ? this.setting.get('subscribe') : {};
        if (typeof callbacks[name] === 'function') {
            callbacks[name].call(this, event);
        }

        return event;
    },

    // create
    create: function(name) {
        if (typeof this._store[name] === 'undefined') {
            ArticleEditor.error('The class "' + name + '" does not exist.');
        }

        var args = [].slice.call(arguments, 1);
        var instance = new this._store[name].proto();

        instance.app = this;
        instance.uuid = this.uuid;
        instance.dom = this.dom;
        instance.ajax = this.ajax;

        if (this.lang) instance.lang = this.lang;
        if (this.setting) instance.opts = this.setting.dump();

        if (instance.init) {
            var res = instance.init.apply(instance, args);
            instance = (res) ? res : instance;
        }

        return instance;
    },

    // api
    api: function(name) {
        var args = [].slice.call(arguments, 1);
        var namespaces = name.split(".");
        var func = namespaces.pop();
        var context = this;
        for (var i = 0; i < namespaces.length; i++) {
            context = context[namespaces[i]];
        }

        if (context && typeof context[func] === 'function') {
            return context[func].apply(context, args);
        }
    },

    // init
    _initCore: function() {
        for (var i = 0; i < this._initer.length; i++) {
            this[this._initer[i]] = this.create(this._initer[i]);
        }
    },
    _initModules: function() {
        for (var key in this._store) {
            if (this._store[key].type === 'module' && this._initer.indexOf(key) === -1) {
                this[key] = this.create(key);
            }
        }
    },
    _initPlugins: function() {
        var plugins = this.setting.get('plugins');
        for (var key in this._store) {
            if (this._store[key].type === 'plugin' && plugins.indexOf(key) !== -1) {
                this[key] = this.create(key);
            }
        }
    },

    // start
    _startPriority: function() {
        for (var i = 0; i < this._priority.length; i++) {
            this._call(this[this._priority[i]], 'start');
        }
    },
    _startModules: function() {
        this._iterate('module', 'start');
    },
    _startPlugins: function() {
        this._iterate('plugin', 'start');
    },

    // stop
    _stopPriority: function() {
        var priority = this._priority.slice().reverse();
        for (var i = 0; i < priority.length; i++) {
            this._call(this[priority[i]], 'stop');
        }
    },
    _stopModules: function() {
        this._iterate('module', 'stop');
    },
    _stopPlugins: function() {
        this._iterate('plugin', 'stop');
    },

    // iterate
    _iterate: function(type, method) {
        for (var key in this._store) {
            var isIn = (type === 'module') ? (this._priority.indexOf(key) === -1) : (this._plugins.indexOf(key) !== -1);
            if (this._store[key].type === type && isIn) {
                this._call(this[key], method);
            }
        }
    },

    // call
    _call: function(instance, method) {
        if (typeof instance[method] === 'function') {
            instance[method].apply(instance);
        }
    }
};
App.Event = function(name, params) {
    // local
    this.name = name;
    this.params = (typeof params === 'undefined') ? {} : params;
    this.stopped = false;
};

App.Event.prototype = {
    is: function(name) {
        return this.get(name);
    },
    has: function(name) {
        return (typeof this.params[name] !== 'undefined');
    },
    get: function(name) {
        return this.params[name];
    },
    set: function(name, value) {
        this.params[name] = value;
    },
    stop: function() {
        this.stopped = true;
    },
    isStopped: function() {
        return this.stopped;
    }
};
ArticleEditor.add('mixin', 'block', {
    init: function(element) {
        // parse
        this.$block = this._parse(element);
        this.$block.dataset('instance', this);
        this.$block.attr('data-arx-type', this.getType());
        if (this.isEditable()) {
            this.$block.attr('contenteditable', true);
            if (!this.opts.editor.grammarly) this.$block.attr('data-gramm_editor', false);
        }
    },
    isEmpty: function() {
        var utils = this.app.create('utils');
        return utils.isEmptyHtml(this.$block.html());
    },
    isAllowedButton: function(obj, bar) {
        // type
        var type = this.getType();

        // except
        if (obj.hasOwnProperty('except') && obj.except.indexOf(type) !== -1) {
            return false;
        }

        // all
        if (typeof obj.blocks === 'undefined' || obj.blocks === 'all') {
            return true;
        }
        // array of blocks
        else if ((Array.isArray(obj.blocks) && obj.blocks.indexOf(type) !== -1)) {
            return true;
        }
        else if (obj.blocks === 'first-level' && this.isFirstLevel()) {
            return true;
        }
        else if (obj.blocks === 'editable' && this.isEditable()) {
            return true;
        }

        return false;
    },
    isEditable: function() {
        return this._getProp('editable');
    },
    isHoverable: function() {
        return this._getProp('hover');
    },
    isControls: function() {
        return this._getProp('controls');
    },
    isFirstLevel: function() {
        return this.$block.attr('data-arx-first-level');
    },
    isSelectedAll: function() {
        var selection = this.app.create('selection');
        return selection.isAll(this.$block);
    },
    isStart: function() {
        return this.app.create('caret').is('start', this.$block);
    },
    isEnd: function() {
        return this.app.create('caret').is('end', this.$block);
    },
    getType: function() {
        return this.type;
    },
    getName: function() {
        var titles = this.lang.get('blocks');
        var type = this.getType();
        var attr = this.$block.attr('data-title');
        var name;

        if (attr) {
            name = attr;
        }
        else if (type === 'layer') {
            name = this._getNameByTag();
        }
        else {
            name = (typeof titles[type] !== 'undefined') ? titles[type] : name;
        }

        return name;
    },
    getTag: function() {
        return this.$block.get().tagName.toLowerCase();
    },
    getParent: function(selector) {
        return this.$block.closest(selector, this.app.editor.$editor);
    },
    getClass: function(value) {
        if (typeof value === 'string') {
            return this.$block.hasClass(value);
        }
        else {
            for (var i = 0; i < value.length; i++) {
                if (this.$block.hasClass(value[i])) {
                    return value[i];
                }
            }
        }

        return false;
    },
    getAlign: function() {
        var classes = this._buildClasses(this.opts.align);
        var name = this.getClass(classes);
        var obj = {
            name: name,
            key: this._getKeyByClassName(this.opts.align, name)
        };

        if (name === false) {
            obj = this._getDefaultAlign();
        }

        return obj;
    },
    getValign: function() {
        var classes = this._buildClasses(this.opts.valign);
        var name = this.getClass(classes);
        var obj = {
            name: name,
            key: (name === false) ? 'valign-none' : this._getKeyByClassName(this.opts.valign, name)
        };

        return obj;
    },
    getOutset: function() {
        var classes = this._buildClasses(this.opts.outset);
        var name = this.getClass(classes);
        var obj = {
            name: name,
            key: (name === false) ? 'outset-none' : this._getKeyByClassName(this.opts.outset, name)
        };

        return obj;
    },
    setAlign: function(value) {
        this.removeAlign();
        this.$block.addClass(value);
    },
    setValign: function(value) {
        this.removeValign();
        if (value) {
            this.$block.addClass(value);
        }
    },
    setOutset: function(value) {
        this.removeOutset();
        if (value) {
            this.$block.addClass(value);
        }

        // rebuild control
        this.app.control.rebuild();
    },
    hasChildren: function() {
        return (this.$block.children().length !== 0);
    },
    removeAlign: function() {
        this._removeClasses(this.opts.align);
    },
    removeValign: function() {
        this._removeClasses(this.opts.valign);
    },
    removeOutset: function() {
        this._removeClasses(this.opts.outset);
    },
    removeEmptyAttr: function(value) {
        var utils = this.app.create('utils');
        utils.removeEmptyAttr(this.$block, value);
    },
    remove: function(traverse) {
        var types = ['column', 'layer'];
        var type = this.getType();
        var $parent = this.$block.parents('[data-arx-type]').first();
        var next = this.app.block.next();
        var prev = this.app.block.prev();

        if (type === 'image') {
            var $image = this.getImage();
            this.app.broadcast('image.remove', {
                url: $image.attr('src'),
                id: $image.attr('data-image')
            });
        }

        this.$block.remove();
        this.app.block.unset();
        this.app.broadcast('block.remove', { type: type, parent: $parent });
        this.app.editor.images.observe();

        if (traverse === false) {
            return;
        }

        // no blocks
        if (this.app.editor.blocks.get().length === 0) {
            this.app.editor.empty();
            return;
        }

        // parent
        if ($parent.length !== 0) {
            var parentType = $parent.attr('data-arx-type');
            var parentInstance = this.app.create('block.' + parentType, $parent);
            if (types.indexOf(parentType) !== -1 && !parentInstance.hasChildren() && parentInstance.isEmpty()) {
                var utils = this.app.create('utils');
                utils.createPlaceholder($parent);
                return this.app.block.set($parent);
            }
        }

        // next/prev
        if (next) {
            return this.app.block.set(next.$block);
        }
        else if (prev) {
            return this.app.block.set(prev.$block);
        }
    },
    format: function(params) {

        var caret = this.app.create('caret');
        var selection = this.app.create('selection');
        var $newblock;
        var tag = this.getTag();
        var type = this.getType();
        var $items;

        if (this._isTextFormat(params)) {
            params.block = 'text';
            params.tag = 'div';
        }

        if (tag === params.tag) {
            return;
        }

        // save selection
        selection.save();

        // clear plaintext class
        if (type === 'text') {
            this.$block.removeClass(this.opts.plaintext.classname);
        }

        // convert to list
        if (params.block === 'list') {
            if (type === 'text' || type === 'paragraph' || type === 'heading') {

                // remove block tags
                var content = this.app.create('content');
                content.removeBlockTags(this.$block.get());

                // wrap
                this._wrapToItem();
            }
        }
        // convert to heading
        else if (params.block  === 'heading') {

            // remove images
            this.$block.find('img').remove();

            // convert
            if (type === 'list') {
                $items = this._prepareItemsToFormat();
            }
        }
        // convert list to normal text
        else if ((params.block === 'paragraph' || params.block === 'text') && type === 'list') {
            $items = this._prepareItemsToFormat();
        }

        // convert
        var $blocks = ($items) ? $items : this.$block;
        var $newblock;
        $blocks.each(function(node) {
            $newblock = this.convert(node, params);
            this.app.block.set($newblock);
            this.app.broadcast('block.format', { element: $newblock });
        }.bind(this));

        // restore selection
        var newinstance = this.app.block.get();
        if (newinstance.isEmpty()) {
            caret.set('start', newinstance.$block);
        }
        else {
            selection.restore();
        }
    },
    split: function() {
        var utils = this.app.create('utils');
        var $newblock = utils.splitNode(this.$block);
        var newinstance = this.app.create('block.' + this.getType(), $newblock);
        this.app.block.set(newinstance.$block);
        return true;
    },
    empty: function() {
        this.$block.html('');
        return this.$block;
    },
    convert: function(node, params) {

        var utils = this.app.create('utils');
        var $newblock = utils.replaceToTag(node, params.tag);
        var props = this.app.parser.getProps(params.block);

        if (params.block === 'text' && this.opts.plaintext.markup) {
            $newblock.addClass(this.opts.plaintext.classname);
        }

        // rebuild
        this.app.parser.parseProps($newblock, params.block, props);
        this.app.block.unset();
        this.app.editor.rebuild();

        return $newblock;
    },

    // input
    handleSpace: function(e, event, sel, input) {
        // shift+space
        if (this.isEditable() && e.shiftKey && !e.metaKey) {
            return input.insertNonBreakSpace();
        }
        else if (!this.isEditable()) {
            return input.replaceToParagraph(this);
        }

    },
    handleTab: function(e, event, sel, input) {
        if (this.isEditable() && this.opts.tab !== false && input.traverseTab(e, event, this)) {
            return true;
        }
    },
    handleEnter: function(e, event, sel, input) {

        // type
        var type = this.getType();

        // handle
        if (type === 'heading' || type === 'paragraph') {
            // ctrl/shift + enter
            if (e.shiftKey || e.ctrlKey) {
                return input.insertBreakline();
            }
            // block selected
            else if (this.isSelectedAll()) {
                return input.makeEmpty(this);
            }
            // caret end
            else if (this.isEnd()) {
                return input.createAfter();
            }
            // caret start
            else if (this.isStart()) {
                return input.createBefore(false);
            }
            // caret inside & collapsed
            else if (sel.collapsed) {
                return this.split();
            }
            // remove selected & uncollapsed
            else if (sel.range && !sel.collapsed) {
                return input.deleteContents(sel.range);
            }

            return true;
        }
        else if (type === 'text' || type === 'quoteitem') {
            // block selected
            if (this.isSelectedAll()) {
                return input.makeEmpty(this);
            }
            // remove selected
            else if (sel.range && !sel.collapsed) {
                return input.deleteContents(sel.range);
            }
            else {
                return input.insertBreakline();
            }
        }
        else if (!this.isEditable()) {
            return input.replaceToParagraph(this);
        }
    },
    handleArrow: function(e, event, sel, input) {

        // all types
        if (this.isEditable() && event.is('left-right')) {

            var caret = this.app.create('caret');
            var utils = this.app.create('utils');
            var ctype = (event.is('left')) ? 'before' : 'after';

            // trim char
            if (input.trimInvisibleChar(e, ctype)) {
                return true;
            }

            // empty inline
            if (sel.current && utils.isEmptyOrImageInline(sel.current)) {
                caret.set(ctype, sel.current);
                return true;
            }
        }

        // handle block up left
        if (event.is('up-left')) {
            var prev = this.app.block.prev();
            var isStart = (this.isEditable()) ? this.isStart() : true;
            if (isStart) {
                if (prev) this.app.block.set(prev.$block, 'end');
                else {
                    if (this.isEditable() && this.isEmpty()) {
                        return true;
                    }
                    else if (this.isFirstLevel()) {
                        return input.createBefore();
                    }
                }
                return true;
            }

        }
        // handle block down right
        else if (event.is('down-right')) {
            var next = this.app.block.next();
            var isEnd = (this.isEditable()) ? this.isEnd() : true;
            if (isEnd) {
                if (next) this.app.block.set(next.$block, 'start');
                else {
                    if (this.isEditable() && this.isEmpty()) {
                        return true;
                    }
                    else if (this.isFirstLevel()) {
                        return input.createAfter();
                    }
                }
                return true;
            }
        }

    },
    handleDelete: function(e, event, sel, input) {

        // type
        var type = this.getType();

        // all
        if (this.isEditable()) {
            var ctype = (event.is('backspace')) ? 'before' : 'after';
            if (input.trimEmptyInlines(e)) return true;
            if (input.trimInvisibleChar(e, ctype, true)) return true;

            // clean
            input.removeUnwantedStyles(this);
            input.removeEmptySpans(this);
        }

        // handle
        if (type === 'cell' || type === 'figcaption' || type === 'quoteitem') {
            if (this.isSelectedAll()) {
                return input.makeEmpty(this);
            }
        }
        else if (type === 'heading' || type === 'text' || type === 'paragraph') {

            // block selected
            if (this.isSelectedAll()) {
                return input.makeEmpty(this);
            }

            var types = ['paragraph', 'heading', 'text'];
            var next = this.app.block.next();
            var prev = this.app.block.prev();
            var caret = this.app.create('caret');

            // backspace
            if (prev && this.isStart() && event.is('backspace')) {
                // prev list
                if (prev.getType() === 'list') {
                    var html = this.$block.html();
                    var $item = prev.$block.find('li').last();
                    caret.set('end', $item);
                    $item.append(html);
                    this.$block.remove();
                    return true;
                }
                // empty
                else if (types.indexOf(prev.getType()) !== -1 && prev.isEmpty()) {
                    prev.remove();
                    return true;
                }
                // not empty
                else if (types.indexOf(prev.getType()) !== -1 && !prev.isEmpty()) {
                    var html = this.$block.html();
                    caret.set('end', prev.$block);
                    prev.$block.append(html);
                    this.app.block.set(prev.$block);
                    this.$block.remove();
                    return true;
                }
                // not editable
                else if (!prev.isEditable()) {
                    return this.app.block.set(prev.$block);
                }
            }
            // delete
            else if (next && this.isEnd() && event.is('delete')) {
                // next list
                if (next.getType() === 'list') {
                    var $item = next.$block.find('li').first();
                    $item.find('ul, ol, li').unwrap();
                    var html = $item.html();
                    this.$block.append(html);
                    $item.remove();
                    return true;
                }
                // empty
                else if (types.indexOf(next.getType()) !== -1 && next.isEmpty()) {
                    next.remove();
                    return true;
                }
                // not empty
                else if (types.indexOf(next.getType()) !== -1 && !next.isEmpty()) {
                    var html = next.$block.html();
                    this.$block.append(html);
                    next.$block.remove();
                    return true;
                }
                // not editable
                else if (!next.isEditable()) {
                    this.app.block.set(next.$block);
                    if (this.isEmpty()) this.remove();
                    return true;
                }
            }
        }
        else {
            var next = this.app.block.next();
            this.remove();
            if (next) this.app.block.set(next.$block);
            return true;
        }
    },

    // private
    _isTextFormat: function(params) {
        return (params.block === 'paragraph' && this.opts.plaintext.markup);
    },
    _wrapToItem: function() {
        var $item = this.dom('<li>');
        $item.html(this.$block.contents());
        this.$block.append($item);
    },
    _prepareItemsToFormat: function() {
        var $items = this.$block.children('li');
        $items.find('li').append('<br>').unwrap();
        $items.find('ul, ol').unwrap();

        $items.nodes.reverse();
        $items.each(function(node) { this.$block.after(node); }.bind(this));

        this.$block.remove();

        return $items;
    },
    _removeClasses: function(obj) {
        var classes = this._buildClasses(obj);
        this.$block.removeClass(classes.join(' '));
        this.removeEmptyAttr('class');
    },
    _buildClasses: function(items) {
        var classes = [];
        for (var key in items) {
            if (items[key].params.classname) {
                classes.push(items[key].params.classname);
            }
        }

        return classes;
    },
    _getKeyByClassName: function(items, name) {
        for (var key in items) {
            if (items[key].params.classname === name) {
                return key;
            }
        }
    },
    _getDefaultAlign: function() {
        if (this.opts.align === false) {
            return;
        }

        var dir = this.opts.editor.direction;
        var items = this.opts.align;
        var obj = {};
        if (dir === 'ltr' && typeof items['align-left'] !== 'undefined') {
            obj.name = items['align-left'].params.classname;
            obj.key = 'align-left';
        }
        else if (dir === 'rtl' && typeof items['align-right'] !== 'undefined') {
            obj.name = items['align-right'].params.classname;
            obj.key = 'align-right';
        }

        return obj;
    },
    _getNameByTag: function() {
         var utils = this.app.create('utils');
         var tag = this.$block.get().tagName.toLowerCase();

        return utils.capitalize(tag);
    },
    _getProp: function(name) {
        return this.app.parser.getProp(this.getType(), name);
    }
});
ArticleEditor.add('module', 'observer', {
    init: function() {
        // local
        this.observer = false;
        this.trigger = true;
    },
    start: function() {
        if (window.MutationObserver) {
            var el = this.app.editor.$editor.get();
            this.observer = this._build(el);
            this.observer.observe(el, {
                 attributes: true,
                 subtree: true,
                 childList: true,
                 characterData: true,
                 characterDataOldValue: true
            });
        }
    },
    stop: function() {
        if (this.observer) this.observer.disconnect();
        this.trigger = true;
    },

    // private
    _build: function(el) {
        var self = this;
        return new MutationObserver(function(mutations) {
            self._observe(mutations[mutations.length-1], el);
        });
    },
    _observe: function(mutation, el) {
        if (mutation.type === 'attributes' && mutation.target === el) {
            return;
        }

        // sync
        if (this.trigger) {
            this.app.broadcast('observer.change');
            this.app.editor.sync.build();
        }
    }
});
ArticleEditor.add('module', 'autosave', {
    init: function() {
        // services
        this.utils = this.app.create('utils');
    },
    start: function() {
    },
    stop: function() {
    },
    send: function() {
        if (this.opts.autosave.url) this._sending();
    },

    // private
    _getName: function() {
        var name;
        if (this.opts.autosave.name) {
            name = this.opts.autosave.name;
        }
        else {
            name = this.app.$element.attr('name');
            name = (!name) ? 'content' + this.uuid : name;
        }

        return name;
    },
    _sending: function() {
        var name = this._getName();
        var data = {};
        data[name] = this.app.$element.val();
        data = this.utils.extendData(data, this.opts.autosave.data);

        this.ajax.post({
            url: this.opts.autosave.url,
            data: data,
            before: function(xhr) {
                var event = this.app.broadcast('autosave.before.send', { xhr: xhr, name: name, data: data });
                if (event.isStopped()) {
                    return false;
                }
            }.bind(this),
            success: function(response) {
                this._complete(response, name, data);
            }.bind(this)
        });
    },
    _complete: function(response, name, data) {
        var callback = (response && response.error) ? 'autosave.error' : 'autosave.send';
        this.app.broadcast(callback, { name: name, data: data, response: response });
    }
});
ArticleEditor.add('module', 'block', {
    init: function() {
        // local
        this.activeInstance = false;

        // services
        this.caret = this.app.create('caret');
        this.utils = this.app.create('utils');
        this.content = this.app.create('content');
        this.selection = this.app.create('selection');
    },
    buildPopup: function(name) {
        var items = {};
        var instance = this.get();
        if (name === 'block') {
            items = this.opts.format;
            for (var key in items) {
                items[key].command = 'block.format';
            }
        }
        else if (name === 'align') {
            items = this.opts.align;
            for (var key in items) {
                items[key].command = 'block.align';
            }
        }
        else if (name === 'valign') {
            items = this.opts.valign;
            for (var key in items) {
                items[key].command = 'block.valign';
            }
        }
        else if (name === 'outset') {
            if (instance.isFirstLevel()) {
                items = this.opts.outset;
                for (var key in items) {
                    items[key].command = 'block.outset';
                }
            }
            else {
                items = false;
            }
        }

        return items;
    },
    is: function() {
        return this.activeInstance;
    },
    set: function($el, caretPos, e, force) {
        var type = $el.attr('data-arx-type');
        var instance = this.app.create('block.' + type, $el);

        if (force !== true && this.activeInstance && ($el.get() === this.activeInstance.$block.get())) {
            return;
        }

        this._removeBlur();
        this._removeFocus();
        this._setFocus(instance, caretPos, e);

        this.activeInstance = instance;

        // ui
        this.app.control.open();
        this.app.path.build();
        this.app.toolbar.build();
        this.app.editor.events.pause('multiple');

        // broadcast
        this.app.broadcast('block.set');

        return true;
    },
    unset: function() {

        this._removeBlur();
        this._removeFocus();
        this.activeInstance = false;

        // ui
        this.app.control.close();
        this.app.toolbar.build();
        this.app.path.build();

        // broadcast
        this.app.broadcast('block.unset');
    },
    get: function() {
        return this.activeInstance;
    },
    copy: function(e) {
        var instance = this.get();

        if (instance.isEditable() && !instance.isSelectedAll()) {
            var html = this.selection.getHtml().trim();
            var parse = true;
            if (instance.getType() === 'list') {
                var tag = instance.getTag();

                // contains li
                if (html.search(/<li/gi) !== -1) {
                    // does not have li at start
                    if (html.search(/^<li/g) === -1) {
                        html = '<li>' + html + '</li>';
                    }

                    // wrap to list
                    html = '<' + tag + '>' + html + '</' + tag + '>';
                }

                parse = false;
            }

            e.preventDefault();
            this.content.copy(e, html, parse);
            return;
        }

        // entire block
        e.preventDefault();
        this.content.copy(e, instance.$block);
    },
    cut: function(e) {
        var instance = this.get();

        if (instance.isEditable() && !instance.isSelectedAll()) {
            return;
        }

        e.preventDefault();
        if (instance.getType() === 'embed') {
            var code = decodeURI(instance.$block.attr('data-embed-code'));
            this.content.copy(e, '<figure>' + code + '</figure>', false);
        }
        else {
            this.content.copy(e, instance.$block);
        }

        if (instance.isEditable()) {
            instance.empty();
        }
        else {
            this.remove();
        }
    },
    remove: function(traverse) {
        if (this.is()) {
            this.activeInstance.remove(traverse);
        }
    },
    duplicate: function() {
        if (this.is()) {
            var $clone = this.activeInstance.$block.clone();
            this.activeInstance.$block.after($clone);

            // scroll if invisible
            this.utils.scrollToElement($clone);

            this.set($clone);
        }
    },
    observeAdd: function(obj, name) {

        var buttons = ['quote', 'line', 'layer'];
        for (var i = 0; i < buttons.length; i++) {
            if (name === buttons[i] && this.opts[buttons[i]] === false) {
                return false;
            }
        }

        return obj;
    },
    addBlock: function(args) {
        if (!this.is()) {
            return;
        }

        var instance = (args.name === 'text') ? this.create() : this.app.create('block.' + args.name);

        this.add(instance);
        this.app.popup.close();
    },
    insert: function(html, active) {
        var current = this.get();
        var parsed = this.content.parse(html, true, true);
        var data = {
            list: false,
            position: 'after'
        };

        if (!current) {
            this.app.editor.$editor.prepend(parsed);
        }
        else {
            // append to empty layer
            if (current.$block.hasClass('arx-empty-layer')) {
                current.$block.html(parsed);
                current.$block.removeClass('arx-empty-layer');
            }
            else {
                if (!current.isEditable()) {
                    current.$block.after(parsed);
                }
                else {
                    data = this._insertToEditable(current, parsed);
                }
            }
        }

        // first level & events
        this.app.editor.rebuild();

        // inserted
        var $inserted = this.app.editor.$editor.find('[data-arx-inserted]');

        // broadcast
        this.app.broadcast('block.insert', { inserted: $inserted });

        // active
        if (active !== false && !data.list) {
            var $el = (data.position === 'after') ? $inserted.first() :  $inserted.last();
            this.app.block.set($el);
        }

        // remove attr
        $inserted.removeAttr('data-arx-inserted');
    },
    add: function(instance, position, active) {

        // add
        this._add(instance, position);

        // first level & events
        this.app.editor.rebuild();

        // active
        if (active !== false) {

            this.set(instance.$block);

            // scroll if the element is invisible
            this.utils.scrollToElement(instance.$block);
        }

        // broadcast
        this.app.broadcast('block.add', { instance: instance });
    },
    change: function(instance, active) {
        var current = this.get();
        current.$block.after(instance.$block);
        current.$block.remove();

        // first level & events
        this.app.editor.rebuild();

        // set active
        if (active !== false) {
            this.set(instance.$block);
        }

        // broadcast
        this.app.broadcast('block.change', { instance: instance });
    },
    create: function() {
        var type = (this.opts.plaintext.markup) ? 'text' : 'paragraph';
        var instance = this.app.create('block.' + type);
        var current = this.get();

        // clone attributes
        if (current && !this.opts.clean.enter && current.$block.length !== 0 && type === current.getType()) {
            this.utils.cloneAttributes(current.$block, instance.$block);
        }

        return instance;
    },
    moveUp: function(args) {
        if (this.app.editor.blocks.isMultiple()) {
            return;
        }

        var prev = this.prev();
        if (prev) {
            var e = args.e;
            var $block = this.activeInstance.$block;
            var editable = this.activeInstance.isEditable();

            e.preventDefault();

            if (editable) {
                this.selection.save($block);
            }

            prev.$block.before(this.activeInstance.$block);

            // set
            this.set(this.activeInstance.$block, false, false, true);

            if (editable) {
                this.selection.restore($block);
            }
        }
    },
    moveDown: function(args) {
        if (this.app.editor.blocks.isMultiple()) {
            return;
        }

        var next = this.next();
        if (next) {
            var e = args.e;
            var $block = this.activeInstance.$block;
            var editable = this.activeInstance.isEditable();

            e.preventDefault();

            if (editable) {
                this.selection.save($block);
            }


            next.$block.after(this.activeInstance.$block);

            // set
            this.set(this.activeInstance.$block, false, false, true);


            if (editable) {
                this.selection.restore($block);
            }
        }
    },
    next: function() {
        return this._getSibling('nextElementSibling');
    },
    prev: function() {
        return this._getSibling('previousElementSibling');
    },
    input: function(event) {
        if (!this.is()) return;

        var e = event.get('e');
        var key = event.get('key');
        var instance = this.get();
        var sel = this.selection.get();
        var input = this.app.create('input');

        // enter
        if (event.is('enter') && instance.handleEnter(e, event, sel, input)) {
            return e.preventDefault();
        }

        // arrow
        if (event.is('arrow') && instance.handleArrow(e, event, sel, input)) {
            return e.preventDefault();
        }

        // space
        if (event.is('space') && instance.handleSpace(e, event, sel, input)) {
            return e.preventDefault();
        }

        // tab
        if (event.is('tab') && instance.handleTab(e, event, sel, input)) {
            return e.preventDefault();
        }

        // delete & backspace
        if ((event.is('delete') || event.is('backspace')) && instance.handleDelete(e, event, sel, input)) {
            return e.preventDefault();
        }

    },
    observe: function(buttons, name) {
        var instance = this.get();
        if (name === 'align') {
            var value = instance.getAlign();
            for (var key in buttons) {
                buttons[key].active = (key === value.key);
            }
        }
        else if (name === 'valign') {
            var value = instance.getValign();
            for (var key in buttons) {
                buttons[key].active = (key === value.key);
            }
        }
        else if (name === 'outset') {
            var value = instance.getOutset();
            for (var key in buttons) {
                buttons[key].active = (key === value.key);
            }
        }
        else if (name === 'block') {
            var tag = instance.getTag();
            tag = (instance.getType() === 'text') ? 'p' : tag;
            for (var key in buttons) {
                buttons[key].active = (key === tag);
            }
        }

        return buttons;
    },
    align: function(args) {
        this.app.popup.close();

        var instance = this.get();
        instance.setAlign(args.params.classname);

        if (instance.getType() === 'embed') {
            var $figcaption = instance.$block.find('figcaption');
            if ($figcaption.length !== 0) {
                var capInstance = this.app.create('block.figcaption', $figcaption);
                capInstance.setAlign(args.params.classname);
            }
        }

        this.selection.restore(instance.$block);
    },
    valign: function(args) {
        this.app.popup.close();

        var instance = this.get();
        instance.setValign(args.params.classname);
        this.selection.restore(instance.$block);
    },
    outset: function(args) {
        this.app.popup.close();

        var instance = this.get();
        instance.setOutset(args.params.classname);
        this.selection.restore(instance.$block);
    },
    format: function(args) {
        this.app.popup.close();

        var instance = this.get();
        var type = instance.getType();
        var types = ['paragraph', 'text', 'heading', 'list'];
        if (types.indexOf(type) !== -1) {
            instance.format(args.params);
        }
    },

    // private
    _add: function(instance, position) {
        var position = position || false; // after, before, start, end, prepend, append
        var $block = instance.$block;
        var current = this.get();

        if (!current) {
            if (position === 'start') {
                this.app.editor.$editor.prepend($block);
            }
            else if (position === 'end') {
                this.app.editor.$editor.append($block);
            }
            // multiple
            else if (this.app.editor.blocks.isMultiple()) {
                var $blocks = this.app.editor.blocks.get('multiple');
                $blocks.first().before(instance.$block);
                $blocks.remove();
            }
            // all selected
            else if (this.app.editor.isSelectedAll()) {
                this.app.editor.$editor.html(instance.$block);
            }

            return;
        }
        else {
            // append to empty layer
            if (current.$block.hasClass('arx-empty-layer') && position === false) {
                position = 'append';

                current.$block.html('');
                current.$block.removeClass('arx-empty-layer');
            }
        }

        if (position) {
            position = (position === 'start' || position === 'end') ? 'after' : position;
            current.$block[position]($block);
        }
        else {
            if (!current.isEditable()) {
                current.$block.after($block);
            }
            else {
                this._insertToEditable(current, $block);
            }
        }
    },
    _insertToEditable: function(current, $block) {

        var $list = this.dom($block);
        var isListToList = this._isListToList($list, current);
        var data = {
            position: 'after',
            list: false
        };

        // is empty
        if (current.isEmpty()) {
            current.$block.after($block);
            current.$block.remove();
        }
        // is start
        else if (current.isStart()) {
            if (isListToList) {
                current.$block.prepend($list.contents());
                data.list = true;
            }
            else {
                current.$block.before($block);
            }

            data.position = 'before';
        }
        // is end
        else if (current.isEnd()) {
            if (isListToList) {
                current.$block.append($list.contents());
                data.list = true;
            }
            else {
                current.$block.after($block);
            }
        }
        // is middle
        else {
            this.selection.restore(current.$block);
            var $newblock = this.utils.splitNode(current.$block);

            // combine lists
            if (isListToList) {
                current.$block.append($list.contents());
                current.$block.append($newblock.contents());
                $newblock.remove();
                data.list = true;
            }
            else {
                var newinstance = this.app.create('block.' + current.getType(), $newblock);
                newinstance.$block.before($block);
                this._removeFocusFromElement(newinstance.$block);
            }
        }

        return data;

    },
    _isListToList: function($list, current) {
        return (current.getType() === 'list' && ['ul', 'ol'].indexOf($list.get().tagName.toLowerCase()) !== -1);
    },
    _setFocus: function(instance, caretPos, e) {
        var hasFocus = true;
        if (this.opts.editor.control === false && !this.app.control.hasButtons(instance)) {
            hasFocus = false;
        }

        if (instance.isEditable() || hasFocus) {
            instance.$block.addClass('arx-block-focus');
        }

        if (instance.isEditable()) {
            instance.$block.focus();
            if (caretPos) {
                this.caret.set(caretPos, instance.$block);
            }
        }
        else {
            this.utils.saveScroll();
            instance.$block.attr('tabindex', '-1');
            instance.$block.focus();
            this.utils.restoreScroll();
        }
    },
    _removeBlur: function() {
        if (this.activeInstance && this.activeInstance.isEditable()) {
            this.activeInstance.$block.blur();
        }
    },
    _removeFocus: function() {
        this.app.editor.setSelectedAll(false);
        this._removeFocusFromElement(this.app.editor.blocks.get());
    },
    _removeFocusFromElement: function($el) {
        $el.removeClass('arx-block-focus arx-block-hover arx-block-focus-offset');
    },
    _getSibling: function(method) {
        var instance = this.get();
        var node = instance.$block.get();
        var sibling = this.dom();

        while (node = node[method]) {
            if (node.tagName !== 'script' && getComputedStyle(node, null).display !== 'none') {
                sibling = node;
                break;
            }
        }

        var $el = this.dom(sibling);
        var instance = false;
        var type = $el.attr('data-arx-type');
        if (type) {
            instance = this.app.create('block.' + type, $el);
        }

        return instance;
    }
});
ArticleEditor.add('module', 'buffer', {
    init: function() {
        // services
        this.utils = this.app.create('utils');
        this.offset = this.app.create('offset');

        // local
        this.started = false;
        this.storage2 = false;
        this.storage = false;
        this.state = false;
        this.passed = true;
        this.undoStorage = [];
        this.redoStorage = [];
    },
    start: function() {
        this.clear();
        this.trigger(true);
    },
    stop: function() {
        this.clear();
    },
    clear: function() {
        this.storage = false;
        this.state = false;
        this.passed = true;
        this.undoStorage = [];
        this.redoStorage = [];
    },
    get: function() {
        return this.undoStorage;
    },
    add: function(e) {
        if (e && (e.ctrlKey || e.metaKey || this._isUndo(e) || this._isRedo(e)) || !this.app.observer.trigger) {
            return;
        }

        // state
        this.state = this._createState();
        if (this.started === false) {
            this._setBuffer(this.state, 0);
            this.started = true;
        }
    },
    trigger: function(start) {
        if (!this.passed) {
            return;
        }

        // storage
        var storage = this._createState();

        // storage
        if (this.state) {
            storage = this.state;
        }
        else if (!this.state && !start) {
            storage = this.storage;
            this.started = true;
        }

        this._addBuffer(storage);

        // previous state
        this.storage = this._createState();
        this.state = false;
    },
    listen: function(e) {
        // undo
        if (this._isUndo(e)) {
            e.preventDefault();
            this.undo();
            return true;
        }
        // redo
        else if (this._isRedo(e)) {
            e.preventDefault();
            this.redo();
            return true;
        }

        this.passed = true;
    },
    undo: function() {
        if (!this._hasUndo()) return;

        this.passed = false;
        var buffer = this._getUndo();
        this._setRedo();

        this.app.editor.$editor.html(buffer[0]);
        this.offset.set(buffer[1]);
        this._rebuild(buffer, 'undo');
    },
    redo: function() {
        if (!this._hasRedo()) return;

        this.passed = false;
        var buffer = this.redoStorage.pop();

        this._addBuffer(buffer);
        this.app.editor.$editor.html(buffer[0]);
        this.offset.set(buffer[1]);
        this._rebuild(buffer, 'redo');
    },

    // private
    _rebuild: function(buffer, type) {
        this.app.editor.$editor.find('.arx-block-focus').each(function(node) {
            this.app.block.set(this.dom(node));
        }.bind(this));

        this.app.editor.rebuild();
        this.app.broadcast('buffer.' + type, { html: buffer[0], offset: buffer[1] });
    },
    _isUndo: function(e) {
        var key = e.which;
        var ctrl = e.ctrlKey || e.metaKey;

        return (ctrl && key === 90 && !e.shiftKey && !e.altKey);
    },
    _isRedo: function(e) {
        var key = e.which;
        var ctrl = e.ctrlKey || e.metaKey;

        return (ctrl && (key === 90 && e.shiftKey || key === 89 && !e.shiftKey) && !e.altKey);
    },
    _hasUndo: function() {
        return (this.undoStorage.length !== 0);
    },
    _hasRedo: function() {
        return (this.redoStorage.length !== 0);
    },
    _getUndo: function() {
        return (this.undoStorage.length === 1) ? this.undoStorage[0] : this.undoStorage.pop();
    },
    _createState: function() {
        return {
            html: this.app.editor.$editor.html(),
            offset: this.offset.get()
        };
    },
    _setBuffer: function(buffer, pos) {
        this.undoStorage[pos] = [buffer.html, buffer.offset];
    },
    _addBuffer: function(buffer) {
        var last = this.undoStorage[this.undoStorage.length-1];
        if (typeof last === 'undefined' || last[0] !== buffer.html) {
            this.undoStorage.push([buffer.html, buffer.offset]);
            this._removeOverStorage();
        }
    },
    _setRedo: function() {
        var buffer = this._createState();

        this.redoStorage.push([buffer.html, buffer.offset]);
        this.redoStorage = this.redoStorage.slice(0, this.opts.buffer.limit);
    },
    _removeOverStorage: function() {
        if (this.undoStorage.length > this.opts.buffer.limit) {
            this.undoStorage = this.undoStorage.slice(0, (this.undoStorage.length - this.opts.buffer.limit));
        }
    }

});
ArticleEditor.add('module', 'container', {
    init: function() {
        // local
        this.containers = ['toolbar', 'editor', 'source', 'statusbar'];
    },
    start: function() {
        this._buildMain();
        this._buildContainers();
        this._buildBSModal();
    },
    stop: function() {
        this.$main.remove();
    },

    // private
    _buildMain: function() {
        this.$main = this.dom('<div>');
        this.$main.addClass('arx-container arx-container-' + this.uuid);
        this.$main.attr('arx-uuid', this.uuid);

        // place
        this.app.$element.after(this.$main);
    },
    _buildContainers: function() {
        var name;
        for (var i = 0; i < this.containers.length; i++) {
            name = this.containers[i];

            this['$' + name] = this.dom('<div>');
            this['$' + name].addClass('arx-' + name + '-container');

            // append
            this.$main.append(this['$' + name]);
        }
    },
    _buildBSModal: function() {
        this.opts.bsmodal = (this.$main.closest('.modal-dialog').length !== 0);
    }
});
ArticleEditor.add('module', 'editor', {
    init: function() {
        // local
        this.selectedAll = false;
        this.savedSelection = false;

        // services
        this.utils = this.app.create('utils');

        // build
        this._build();
        this._buildBlocksList();
        this._buildClasses();
    },
    start: function() {

        var html = this.app.$element.val();
        this.app.$element.hide();

        html = this.content.build(html);

        this._buildAccessibility();
        this._buildOptions();
        this._buildStyles();
        this._buildGridCssVar();

        // append
        this._appendToContainer();

        // set content to the editor
        this.content.set(html, true);
        this.sync.compose();
    },
    stop: function() {
        this.events.stop();
        this.app.$element.show();
    },
    rebuild: function() {
        this.blocks.build();
        this.blocks.buildPlaceholders();
        this.events.build();
        this.images.observe();
    },
    is: function(element) {
        return (this.dom(element).hasClass('arx-editor'));
    },
    isSourceMode: function() {
        return (this.app.container.$editor.css('display') === 'none');
    },
    isSelectedAll: function() {
        return this.$editor.hasClass('arx-editor-selected');
    },
    isEmpty: function() {
        return this.utils.isEmptyHtml(this.$editor.html());
    },
    setFocus: function() {
        if (!this.$editor.hasClass('arx-editor-focus')) {
            this.$editor.addClass('arx-editor-focus');
            this.app.broadcast('editor.focus');
        }
    },
    removeFocus: function() {
        if (this.$editor.hasClass('arx-editor-focus')) {
            this.app.editor.setSelectedAll(false);
            this.app.block.unset();
            this.app.editor.blocks.unset();
            this.$editor.blur();
            this.$editor.removeClass('arx-editor-focus');
            this.app.broadcast('editor.blur');
        }
    },
    hasFocus: function() {
        return (this.$editor.hasClass('arx-editor-focus'));
    },
    setSelectedAll: function(selected) {
        if (selected) {
            this.$editor.addClass('arx-editor-selected');
            this.$editor.attr('tabindex', '-1');
            this.setFocus();
        }
        else {
            this.$editor.removeClass('arx-editor-selected');
        }
    },
    empty: function() {
        this.$editor.html('');
        var instance = this.app.block.create();
        this.app.block.add(instance, 'start');
        this.setSelectedAll(false);
        this.images.observe();
        this.sync.build();
    },
    input: function(event) {

        var e = event.get('e');
        var key = event.get('key');
        var instance = this.app.block.get();

        // selected all - make empty at action
        var isAction = (event.is('enter') || event.is('delete') || event.is('backspace') || event.is('alpha') || event.is('space'));
        if (this.isSelectedAll() && isAction) {
            if (event.is('alpha') || event.is('space')) {
                this.empty();
                return;
            }
            else {
                e.preventDefault();
                setTimeout(this.empty.bind(this), 1);
                return;
            }
        }

        // select all
        var isEditableSelected = (instance && instance.isEditable() && instance.isSelectedAll());
        var isNotEditableSelected = (instance && !instance.isEditable());
        var isCtrlA = (event.is('ctrl') && key === 65);
        if ((isCtrlA && (isEditableSelected || isNotEditableSelected)) || (event.is('shift') && isCtrlA)) {
            e.preventDefault();
            window.getSelection().removeAllRanges();
            this.app.block.unset();
            this.setSelectedAll(true);
            this.blocks.get('first-level').addClass('arx-block-focus');
            return;
        }

        if (!event.is('ctrl') && !event.is('shift')) {
            this.setSelectedAll(false);
        }
    },
    executeEmbed: function(scripts) {
        if (scripts === undefined) {
            var scripts = this.$editor.find('[data-arx-type=embed]').find("script").getAll();
            this.executeEmbed.call(this, scripts);
        }
        else {
            for (var i = 0; i < scripts.length; i++) {
                if (scripts[i].src !== '') {
                    var src = scripts[i].src;
                    this.app.$doc.find('head script[src="' + src + '"]').remove();

                    var $script = this.dom('<script>');
                    $script.attr('src', src);
                    $script.attr('async defer');
                    $script.get().onload = function() {
                        if (src.search('instagram') !== -1) window.instgrm.Embeds.process();
                        this.executeEmbed(scripts.slice(i + 1));
                    }.bind(this);

                    var head = document.getElementsByTagName('head')[0];
                    if (head) head.appendChild($script.get());

                    break;
                }
                else {
                    try {
                        eval(scripts[i].innerHTML);
                    } catch (e) {}
                }
            }
        }
    },

    // private
    _build: function() {
        this.$editor = this.dom('<div>');
    },
    _buildBlocksList: function() {
        this.blockslist = this.opts.blocks;
    },
    _buildAccessibility: function() {

        this.$editor.attr({ 'aria-labelledby': 'article-editor-voice', 'role': 'presentation' });

        var $label = this.dom('<span />');

        $label.addClass('arx-voice-label');
        $label.attr({ 'id': 'arx-voice-' + this.uuid, 'aria-hidden': false });
        $label.html(this.lang.get('accessibility.help-label'));

        // prepend to main
        this.app.container.$main.prepend($label);
    },
    _buildClasses: function() {
        var classes = ['blocks', 'content', 'events', 'images', 'sync'];
        for (var i = 0; i < classes.length; i++) {
            this[classes[i]] = this.app.create('editor.' + classes[i]);
        }
    },
    _buildStyles: function() {
        // editor & reset class
        this.$editor.addClass('arx-editor arx-reset arx-editor-' + this.uuid);

        // style class
        this.$editor.addClass(this.opts.editor.classname);
    },
    _buildGridCssVar: function() {
        if (!this.opts.grid) return;

        var style = document.documentElement.style;
        style.setProperty('--arx-grid-columns', this.opts.grid.columns.size);
        style.setProperty('--arx-grid-gutter', this.opts.grid.columns.gutter);
    },
    _buildOptions: function() {
        var $e = this.$editor;
        var o = this.opts.editor;

        $e.attr('dir', o.direction);

        if (o.minHeight) $e.css('min-height', o.minHeight);
        if (o.maxHeight) $e.css('max-height', o.maxHeight);
        if (o.notranslate) $e.addClass('notranslate');
        if (!o.spellcheck) $e.attr('spellcheck', false);
    },
    _appendToContainer: function() {
        this.app.container.$editor.append(this.$editor);
    }
});
ArticleEditor.add('class', 'editor.blocks', {
    init: function() {
        // services
        this.utils = this.app.create('utils');
        this.content = this.app.create('content');

        // local
        this.multipleClass = 'arx-block-multiple-focus';
        this.multipleHoverClass = 'arx-block-multiple-hover';
    },
    build: function() {
        this._buildFirstLevel();
    },
    buildPlaceholders: function() {
        var self = this;
        var $blocks = this.app.editor.$editor.find('[data-arx-type=layer],[data-arx-type=column]');
        $blocks.each(function(node) {
            if (node.innerHTML.trim() === '') {
                var $el = self.dom(node);
                self.utils.createPlaceholder($el);
            }
        });
    },
    isMultiple: function() {
        return (this.get('multiple').length !== 0);
    },
    remove: function(e) {
        var $blocks = this.get('multiple');
        $blocks.remove();
    },
    copy: function(e) {
        e.preventDefault();
        var $blocks = this.get('multiple');
        this._copy(e, $blocks);
    },
    cut: function(e) {
        e.preventDefault();
        var $blocks = this.get('multiple');
        this._copy(e, $blocks);
        $blocks.remove();
    },
    set: function($block, e) {
        e.preventDefault();

        // get parent
        $block = $block.closest('[data-arx-first-level]');

        // active class
        $block.removeClass(this.multipleHoverClass);
        if ($block.hasClass(this.multipleClass)) {
            $block.removeClass(this.multipleClass);
        }
        else {
            $block.addClass(this.multipleClass);
        }

        // current instance
        var current = this.app.block.get();
        if (current) {
            var $currentBlock = current.$block;
            $currentBlock.closest('[data-arx-first-level]').addClass(this.multipleClass);
            this.app.block.unset();
        }

        // path
        this.app.path.buildMultiple();
        e.target.blur();

        // selected all
        var $allblocks = this.get('first-level');
        var $focusedblocks = this.get('multiple');
        if ($allblocks.length === $focusedblocks.length) {
            this.unset();
            this.app.editor.setSelectedAll(true);
            this.get('first-level').addClass('arx-block-focus');
        }
    },
    unset: function() {
        this.get('first-level').removeClass(this.multipleClass + ' ' + this.multipleHoverClass);
    },
    unsetHover: function() {
        this.get('first-level').removeClass(this.multipleHoverClass);
    },
    get: function(type) {
        var selector = '[data-arx-type]';

        if (type === 'editable') {
            selector = '[contenteditable=true]';
        }
        else if (type === 'multiple') {
            selector = '.' + this.multipleClass;
        }
        else if (type === 'first-level') {
            selector = '[data-arx-first-level]';
        }
        else if (type === 'first') {
            return this.app.editor.$editor.find(selector).first();
        }

        return this.app.editor.$editor.find(selector);
    },

    // private
    _copy: function(e, $blocks) {
        var html = '';
        $blocks.each(function(node) {
            html += node.outerHTML + '\n';
        });

        this.content.copy(e, html);
    },
    _buildFirstLevel: function() {
        this.app.editor.$editor.children('[data-arx-type]').attr('data-arx-first-level', true);
    }
});
ArticleEditor.add('class', 'editor.content', {
    init: function() {
        // services
        this.content = this.app.create('content');
        this.utils = this.app.create('utils');
        this.insertion = this.app.create('insertion');
    },
    build: function(html) {
        var event = this.app.broadcast('editor.content.before.load', { html: html });
        var parsedHtml = this.content.parse(event.get('html'));
        event.set('html', parsedHtml);
        this.app.broadcast('editor.content.load', event);

        return event.get('html');
    },
    drop: function(html, e) {
        this._pasteDrop(html, e);
    },
    paste: function(e) {
        e.preventDefault();

        // clipboard
        var clipboard = (e.clipboardData  || e.originalEvent.clipboardData);
        if (this._pasteImageFromClipboard(clipboard)) {
            return;
        }

        // html / text
        var url = clipboard.getData('URL');
        var html = (this.content.isClipboardPlainText(clipboard)) ? clipboard.getData("text/plain") : clipboard.getData("text/html");

        // get safari anchor links
        html = (!url || url === '') ? html : url;

        this._paste(html);
    },
    insert: function(html) {
        this.app.block.insert(html);
    },
    copy: function(e) {
        e.preventDefault();
        this.content.copy(e, this.app.$element.val());
    },
    cut: function(e) {
        e.preventDefault();
        this.content.copy(e, this.app.$element.val());
        this.app.editor.empty();
    },
    get: function() {
        var html = this.app.$element.val();
        html = html.replace('&amp;', '&');

        return html;
    },
    set: function(html, load) {
        if (load) {
            // set content to the initial element
            this.app.$element.val(this.content.unparse(html));
        }
        else {
            html = this.content.parse(html);
        }

        this.app.editor.$editor.html(html);

        // first level & events
        this.app.editor.rebuild();
        this.app.editor.executeEmbed();

        if (!load) {
            this.utils.saveScroll();
            this.app.editor.$editor.focus();
            this.utils.restoreScroll();
            this.app.editor.setFocus();
            this.app.broadcast('editor.content.set');
        }
    },

    // private
    _pasteImageFromClipboard: function(clipboard) {
        var text = clipboard.getData("text/plain") || clipboard.getData("text/html");
        text = text.trim();

        if (text !== '') {
            return;
        }

        var items = clipboard.items;
        var blob = null;
        for (var i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") === 0) {
                blob = items[i].getAsFile();
            }
        }

        if (blob !== null) {
            this.app.image.paste(blob);
            return true;
        }
    },
    _pasteDrop: function(html, e) {
        var $target = this.dom(e.target).closest('[data-arx-type]');
        if ($target.length > 0) {
            this.app.block.set($target);
            this.insertion.insertPoint(e);

            html = this.content.clean(html);
            html = this.content.paragraphize(html);
            this.insert(html);
        }
    },
    _paste: function(html, e) {

        // clean
        html = this.content.clean(html);

        // get instance
        var instance = this.app.block.get();
        if (!instance) {
            html = this.content.paragraphize(html);
            var parsed = this.content.parse(html);

            // multiple
            if (this.app.editor.blocks.isMultiple()) {
                var $blocks = this.app.editor.blocks.get('multiple');
                $blocks.first().before(parsed);
                $blocks.remove();
            }
            // all selected
            else if (this.app.editor.isSelectedAll()) {
                this.app.editor.$editor.html(parsed);
            }

            // first level & events
            this.app.editor.rebuild();
            return;
        }

        var isLine = (instance.isEditable() && this.content.isLineText(html));
        var isPlainLine = (instance.getType() === 'text' && this.opts.plaintext.markup && this.content.isPlainLine(html));

        if (!isLine && !isPlainLine) {
            html = this.content.paragraphize(html);
            this.insert(html);
        }
        else {
            if (isPlainLine) {
                html = this.content.getPlainLine(html);
            }

            html = this.content.parse(html);
            this.insertion.insertNode(html, 'end');
        }
    }
});
ArticleEditor.add('class', 'editor.events', {
    init: function() {
        // services
        this.utils = this.app.create('utils');
        this.caret = this.app.create('caret');

        // local
        this.pressedCmd = false;
        this.mouseDownIn = false;
        this.dragoverEvent = false;
        this.events = {
            editor: ['click', 'dblclick', 'mouseover', 'mouseup', 'touchstart', 'contextmenu', 'drop', 'dragstart', 'dragover', 'dragleave'],
            doc: ['keydown', 'keyup', 'mousedown', 'paste', 'cut', 'copy', 'click'],
            block: ['focus']
        };
    },
    stop: function() {
        this.dragoverEvent = false;
        this._buildTargets();
        this._stopEvents();
        this.app.$doc.off('.arx-blur-event-' + this.uuid);
    },
    start: function() {
        this._buildTargets();
        this._startEvents();
    },
    pause: function(type) {
        if (type === 'multiple') {
            this.pressedCmd = false;
        }
    },
    build: function() {
        this._buildBlocks();
        this.stop();
        this.start();
    },
    onclick: function(e) {
        var $block = this._getBlockFromTarget(e);

        if (this.pressedCmd) {
            this._setMultipleBlock($block, e);
        }
        else {
            this._setBlock($block, e);
        }

        // buffer
        this.app.buffer.add(e);

        // prevent link click
        if (this._isPreventedLink(e))  {
            return e.preventDefault();
        }

        // focus
        this.app.editor.setFocus();

        // broadcast
        var event = this.app.broadcast('editor.click', { e: e });
        if (event.isStopped()) return e.preventDefault();

        // set after inline
        var instance = this.app.block.get();
        if (instance && instance.isEditable()) {
            var node = e.target;
            if (this.utils.isEmptyOrImageInline(node)) {
                this.caret.set('after', node);
            }
        }
    },
    onfocus: function(e) {
        var $block = this._getBlockFromTarget(e);

        if (this.pressedCmd) {
            return e.preventDefault();
        }
        else {
            this._setBlock($block, e);
        }
    },
    ondblclick: function(e) {
        var instance = this.app.block.get();
        if (instance && instance.getType() === 'image') {
            this.app.api('image.buildConfig');
        }
    },
    ontouchstart: function(e) {
        // buffer
        this.app.buffer.add(e);
    },
    onmouseup: function(e) {
        this.app.buffer.add(e);
    },
    onmouseover: function(e) {
        var instance = this.app.block.get();
        if (this.pressedCmd && instance) {
            var $block = this._getFirstBlockFromTarget(e);
            if ($block.length !== 0) {
                this._buildMultipleHover($block);
            }
        }

        // broadcast
        this.app.broadcast('editor.hover', { e: e });
    },


    ondocmousedown: function(e) {
        this.mouseDownIn = !(this._isOutsideEditor(e));
    },
    ondocclick: function(e) {
        if (!this.mouseDownIn && this._isOutsideEditor(e)) {
            this.app.editor.removeFocus();
        }
    },
    ondockeydown: function(e) {
        if (!this._isFocusEditor()) return;

        // listen undo & redo
        if (this.app.buffer.listen(e)) {
            this.pressedCmd = false;
            return;
        }

        // remove multiple blocks
        var key = e.which;
        var k = this.app.keycodes;
        var removeKey = (key === k.DELETE || key === k.BACKSPACE);
        if (removeKey && this.app.editor.blocks.isMultiple()) {
            this.app.editor.blocks.remove();
            return e.preventDefault();
        }

        // cmd
        this.pressedCmd = (this.opts.editor.multipleSelection) ? (e.ctrlKey || e.metaKey) : false;

        // broadcast
        var eventObj = this._buildEventKeysObj(e);
        var event = this.app.broadcast('editor.keydown', eventObj);
        if (event.isStopped()) return e.preventDefault();

        // handle shortcut
        if (this.app.shortcuts.handle(e)) {
            return;
        }

        // release keydown
        this.app.editor.input(event);
        this.app.block.input(event);
    },
    ondockeyup: function(e) {
        if (!this._isFocusEditor()) return;

        // cmd
        this.pressedCmd = false;
        this.app.editor.blocks.unsetHover();

        if (this._isOutsideEditor(e) && !this.app.editor.isSelectedAll()) {
            this.app.editor.removeFocus();
            return;
        }

        // focus
        this.app.editor.setFocus();

        // broadcast
        var eventObj = this._buildEventKeysObj(e);
        var event = this.app.broadcast('editor.keyup', eventObj);
        if (event.isStopped()) return e.preventDefault();
    },
    ondrop: function(e) {
        if (this._isEditorTarget(e)) {
            e.preventDefault();
            e.stopPropagation();

            var dt = e.dataTransfer;
            if (this.opts.image && this.opts.image.upload && dt.files !== null && dt.files.length > 0) {
                this.app.image.drop(e, dt);
            }
            else {
                var html = dt.getData("text/html");
                if (html.trim() === '') {
                    html = dt.getData('Text');
                }

                this.app.editor.content.drop(html, e);
            }
        }

        // broadcast
        this.app.broadcast('editor.drop', { e: e });
    },
    ondragstart: function(e) {
        // broadcast
        this.app.broadcast('editor.dragstart', { e: e });
    },
    ondragover: function(e) {
        e.preventDefault();
        this.dragoverEvent = true;

        // broadcast
        this.app.broadcast('editor.dragover', { e: e });
    },
    ondragleave: function(e) {
        e.preventDefault();
        this.dragoverEvent = false;

        // broadcast
        this.app.broadcast('editor.dragleave', { e: e });
    },
    oncontextmenu: function(e) {
        if (this.pressedCmd) {
            e.preventDefault();
            var $block = this._getBlockFromTarget(e);
            this._setMultipleBlock($block, e);
        }
    },
    ondoccut: function(e) {
        if (!this._isFocusEditor()) return;

        // multiple
        if (this.app.editor.blocks.isMultiple()) {
            this.app.editor.blocks.cut(e);
        }
        // block
        else if (this.app.block.is()) {
            this.app.block.cut(e);
        }
        else if (this.app.editor.isSelectedAll()) {
            this.app.editor.content.cut(e);
        }

        // broadcast
        this.app.broadcast('editor.cut', { e: e });
    },
    ondoccopy: function(e) {
        if (!this._isFocusEditor()) return;

        // multiple
        if (this.app.editor.blocks.isMultiple()) {
            this.app.editor.blocks.copy(e);
        }
        // block
        else if (this.app.block.is()) {
            this.app.block.copy(e);
        }
        else if (this.app.editor.isSelectedAll()) {
            this.app.editor.content.copy(e);
        }

        // broadcast
        this.app.broadcast('editor.copy', { e: e });
    },
    ondocpaste: function(e) {
        if (!this._isFocusEditor()) return;

        // broadcast
        var event = this.app.broadcast('editor.paste', { e: e });
        if (event.isStopped()) return e.preventDefault();

        // paste
        this.app.editor.content.paste(e);
    },

    // private
    _isOutsideEditor: function(e) {
        var $target = this.dom(e.target);
        return ($target.closest('.arx-container-' + this.uuid + ', .arx-popup-container-' + this.uuid + ', .arx-control-' + this.uuid).length === 0);
    },
    _isEditorTarget: function(e) {
        return (this.dom(e.target).closest('.arx-editor-' + this.uuid).length !== 0);
    },
    _isFocusEditor: function() {
        if (this.app.popup.isOpen() || this.app.editor.isSourceMode()) {
            return false;
        }
        else {
            return (this.app.block.is() || this.app.editor.isSelectedAll() || this.app.editor.hasFocus());
        }
    },
    _isPreventedLink: function(e) {
        return (e.target.tagName === 'A' || (e.target.parentNode && e.target.parentNode.tagName === 'A'));
    },
    _getBlockFromTarget: function(e) {
        return this.dom(e.target).closest('[data-arx-type]');
    },
    _getFirstBlockFromTarget: function(e) {
        return this.dom(e.target).closest('[data-arx-first-level]');
    },
    _buildMultipleHover: function($block) {
        this.$blocks.removeClass('arx-block-multiple-hover');
        if (!$block.hasClass('arx-block-multiple-focus')) {
            $block.addClass('arx-block-multiple-hover');
        }
    },
    _buildBlocks: function() {
        this.$blocks = this.app.editor.blocks.get();
        this.$blocksEditable = this.app.editor.blocks.get('editable');
    },
    _buildTargets: function() {
        this.eventTargets = {
            editor: this.app.editor.$editor,
            doc: this.app.$doc,
            block: this.$blocksEditable
        };
    },
    _buildEventKeysObj: function(e) {
        var key = e.which;
        var arrowKeys = [this.app.keycodes.UP, this.app.keycodes.DOWN, this.app.keycodes.LEFT, this.app.keycodes.RIGHT];
        var isAlphaKeys = ((!e.ctrlKey && !e.metaKey) && ((key >= 48 && key <= 57) || (key >= 65 && key <= 90)));
        var k = this.app.keycodes;

        return {
            'e': e,
            'key': key,
            'ctrl': (e.ctrlKey || e.metaKey),
            'shift': (e.shiftKey),
            'alt': (e.altKey),
            'select': ((e.ctrlKey || e.metaKey) && !e.altKey && key === 65),
            'enter': (key === k.ENTER),
            'space': (key === k.SPACE),
            'esc': (key === k.ESC),
            'tab': (key === k.TAB && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey),
            'delete': (key === k.DELETE),
            'backspace': (key === k.BACKSPACE),
            'alpha': isAlphaKeys,
            'arrow': (arrowKeys.indexOf(key) !== -1),
            'left': (key === k.LEFT),
            'right': (key === k.RIGHT),
            'up': (key === k.UP),
            'down': (key === k.DOWN),
            'left-right': (key === k.LEFT || key === k.RIGHT),
            'up-left': (key === k.UP || key === k.LEFT),
            'down-right': (key === k.DOWN || key === k.RIGHT)
        };
    },
    _setBlock: function($block, e) {
        if ($block.length !== 0) {
            this.app.block.set($block, false, e);
        }

        this.app.editor.blocks.unset();
    },
    _setMultipleBlock: function($block, e) {
        if ($block.length !== 0) {
            this.app.editor.blocks.set($block, e);
        }
    },
    _startEvents: function() {
        for (var key in this.events) {
            var events = this.events[key];
            var $target = this.eventTargets[key];
            for (var i = 0; i < events.length; i++) {
                var eventname = (key === 'doc') ? 'ondoc' + events[i] : 'on' + events[i];
                $target.on(events[i] + '.arx-block-events-' + this.uuid, this[eventname].bind(this));
            }
        }
    },
    _stopEvents: function() {
        for (var key in this.eventTargets) {
            this.eventTargets[key].off('.arx-block-events-' + this.uuid);
        }
    }
});
ArticleEditor.add('class', 'editor.sync', {
    init: function() {
        // local
        this.syncedHtml = '';

        // services
        this.content = this.app.create('content');
    },
    compose: function() {
        this.syncedHtml = this.app.$element.val();
    },
    build: function() {
        var self = this;
        var html = this.app.editor.$editor.html();

        // unparse
        html = this.content.unparse(html);
        if (this.is(html)) {
            if (this.timeout) clearTimeout(this.timeout);
            this.timeout = setTimeout(function() { self._sync(html); }, 200);
        }
    },
    invoke: function() {
        var html = this.app.editor.$editor.html();
        html = this.content.unparse(html);
        this.syncedHtml = html;
        this._sync(html);
    },
    is: function(html) {
        var sync = false;
        if (this.syncedHtml !== html) {
            this.syncedHtml = html;
            sync = true;
        }

        return sync;
    },

    // private
    _sync: function(html) {
        var event = this.app.broadcast('editor.content.before.change', { html: html });
        if (!event.isStopped()) {
            this.app.$element.val(event.get('html'));
            this.app.autosave.send();
            this.app.buffer.trigger();
            this.app.broadcast('editor.content.change', event);
        }
    }
});
ArticleEditor.add('class', 'editor.images', {
    init: function() {
        // local
        this.data = [];
    },
    observe: function() {
        this._find().each(this._add.bind(this));
    },
    get: function() {
        var $images = this._find();

        // check status
        for (var key in this.data) {
			var data = this.data[key];
			var status = $images.is('[data-image="' + data.id + '"]');
			this._set(data.id, status);
		}

        return this.data;
    },

    // private
    _find: function() {
        return this.app.editor.$editor.find('[data-image]');
    },
	_add: function(node) {
        var id = node.getAttribute('data-image');
        this.data[id] = { type: 'image', status: true, url: node.src, node: node, id: id };
	},
	_set: function(url, status) {
		this.data[url].status = status;
	}
});
ArticleEditor.add('module', 'focus', {
    init: function() {
    },
    start: function() {
        if (!this.opts.editor.focus) return;

        setTimeout(this.set.bind(this), 1);
    },
    set: function() {
        var $first = this.app.editor.blocks.get().first();
        if ($first.length !== 0) {
            this.app.block.set($first);
        }
    }
});
ArticleEditor.add('module', 'inline', {
    init: function() {
        // services
        this.utils = this.app.create('utils');
        this.caret = this.app.create('caret');
        this.insertion = this.app.create('insertion');
        this.selection = this.app.create('selection');
    },
    buildPopup: function() {
        var items = this.opts.inline;
        for (var key in items) {
            items[key].command = 'inline.format';
        }
        return items;
    },
    observe: function(obj) {
        return obj;
    },
    removeFormat: function() {
        this.app.popup.close();
        var instance = this.app.block.get();
        this.selection.save(instance.$block);

        var nodes = this.selection.getNodes({ type: 'inline' });
        for (var i = 0; i < nodes.length; i++) {
            this.dom(nodes[i]).unwrap();
        }

        this.selection.restore(instance.$block);
    },
    format: function(args) {
        this.app.popup.close();
        this.params = this._buildParams(args);

        var nodes = [];
        var sel = this.selection.get();
        if (sel.collapsed) {
            nodes = this.formatCollapsed();
        }
        else {
            nodes = this.formatUncollapsed();
        }

        this.app.broadcast('inline.format', { nodes: nodes });

        return nodes;
    },
    formatCollapsed: function() {
        var node;
        var nodes = [];
        var inline = this.selection.getInline();
        var $inline = this.dom(inline);
        var hasSameTag = (inline && inline.tagName.toLowerCase() === this.params.tag);

        // 1) not inline
        if (!inline) {
            node = this._insertInline(nodes, this.params.tag);
        }
        else {
            // 2) inline is empty
            if (this.utils.isEmptyHtml(inline.innerHTML)) {
                // 2.1) has same tag
                if (hasSameTag) {
                    this.caret.set('after', inline);
                    $inline.remove();
                }
                // 2.2) has a different tag
                else {
                    var $el = this.utils.replaceToTag(inline, this.params.tag);
                    this.caret.set('start', $el);
                }
            }
            // 3) inline isn't empty
            else {
                // 3.1) has same tag
                if (hasSameTag) {

                    var extractedContent = this.utils.extractHtmlFromCaret(inline);
                    var $secondPart = this.dom('<' + this.params.tag + ' />');
                    $secondPart = this.utils.cloneAttributes(inline, $secondPart);
                    $inline.after($secondPart.append(extractedContent));

                    this.caret.set('before', $secondPart);
                }
                // 3.2) has a different tag
                else {
                    node = this._insertInline(nodes, this.params.tag);
                }
            }
        }

        if (node) {
            nodes = [node];
        }

        return nodes;
    },
    formatUncollapsed: function() {

        var instance = this.app.block.get();
        var inlines = this.selection.getNodes({ type: 'inline' });

        // convert del / u
        this._convertTags('u', instance);

        // convert target tags
        this._convertToStrike(inlines, instance);

        // save selection
        this.selection.save(instance.$block);

        // apply strike
        document.execCommand('strikethrough');


        // revert to inlines
        var nodes = this._revertToInlines(instance);

        // restore selection
        this.selection.restore(instance.$block);

        // filter if node is not selected
        var finalNodes = [];
        var selected = this.selection.getText();
        for (var i = 0; i < nodes.length; i++) {
            if (this._isInSelection(nodes[i], selected)) {
                finalNodes.push(nodes[i]);
            }
        }

        // clear and normalize
        this._clearEmptyStyle();

        // apply attr
        if (typeof this.params.attr !== 'undefined') {
            for (var i = 0; i < finalNodes.length; i++) {
                for (var name in this.params.attr) {
                    finalNodes[i].setAttribute(name, this.params.attr[name]);
                }
            }
        }

        this.selection.save(instance.$block);
        instance.$block.get().normalize();
        this._revertTags('u', instance);
        this.selection.restore(instance.$block);

        return finalNodes;
    },

    // private
    _clearEmptyStyle: function() {
        var inlines = this.selection.getNodes({ type: 'inline' });
        for (var i = 0; i < inlines.length; i++) {
            this._clearEmptyStyleAttr(inlines[i]);

            var childNodes = inlines[i].childNodes;
            if (childNodes) {
                for (var z = 0; z < childNodes.length; z++) {
                    this._clearEmptyStyleAttr(childNodes[z]);
                }
            }
        }
    },
    _clearEmptyStyleAttr: function(node) {
        if (node.nodeType !== 3 && node.getAttribute('style') === '') {
            node.removeAttribute('style');
        }
    },
    _isInSelection: function(node, selected) {
        var text = this.utils.removeInvisibleChars(node.textContent);

        return (text.search(new RegExp(this.utils.escapeRegExp(selected))) !== -1);
    },
    _buildParams: function(args) {
        var params = true;
        var obj = {};
        var values = ['tag', 'classname', 'attr'];
        for (var i = 0; i < values.length; i++) {
            if (args.hasOwnProperty(values[i])) {
                obj[values[i]] = args[values[i]];
                params = false;
            }
        }

        return (params) ? args.params : obj;
    },
    _insertInline: function(nodes, tag) {
        var inserted = this.insertion.insertNode(document.createElement(tag), 'start');
        return [inserted];
    },
    _convertTags: function(tag, instance) {
        if (this.params.tag !== tag) {
            instance.$block.find(tag).each(function(node) {
                var $el = this.utils.replaceToTag(node, 'span');
                $el.addClass('arx-convertable-' + tag);
            }.bind(this));
        }
    },
    _revertTags: function(tag, instance) {
        instance.$block.find('span.arx-convertable-' + tag).each(function(node) {
            var $el = this.utils.replaceToTag(node, tag);
            $el.removeClass('arx-convertable-' + tag);
            if (this.utils.removeEmptyAttr($el, 'class')) $el.removeAttr('class');

        }.bind(this));
    },
    _convertToStrike: function(inlines, instance) {
        this.selection.save(instance.$block);
        for (var i = 0; i < inlines.length; i++) {
            var inline = inlines[i];
            var $inline = this.dom(inline);
            var tag = inlines[i].tagName.toLowerCase();

            if (tag === this.params.tag) {
                this._replaceToStrike($inline);
            }
        }
        this.selection.restore(instance.$block);
    },
    _removeAllAttr: function($elements) {
        $elements.each(function(node) {
            if (node.attributes.length > 0) {
                var attrs = node.attributes;
                for (var i = attrs.length - 1; i >= 0; i--) {
                    if (attrs[i].name !== 'class') {
                        node.removeAttribute(attrs[i].name);
                    }
                }
            }
        });
    },
    _replaceToStrike: function($el) {
        $el.replaceWith(function() { return this.dom('<strike>').append($el.contents()); }.bind(this));
    },
    _revertToInlines: function(instance) {
        var nodes = [];

        // strike
        instance.$block.find('strike').each(function(node)
        {
            var $node = this.utils.replaceToTag(node, this.params.tag);
            nodes.push($node.get());

        }.bind(this));


        return nodes;
    }
});
ArticleEditor.add('module', 'lang', {
    init: function() {
        this.langKey = this.app.setting.get('editor.lang');
        this.vars = this._build();
    },
    get: function(name) {
        var value = this._get(name, this.vars);
        if (typeof value === 'undefined' && this.langKey !== 'en') {
            value = this._get(name, ArticleEditor.lang['en']);
        }

        return (typeof value === 'undefined') ? '' : value;
    },
    parse: function(str) {
        if (typeof str !== 'string') return str;

        var matches = str.match(/## (.*?) ##/g);
        if (matches) {
            for (var i = 0; i < matches.length; i++) {
                var key = matches[i].replace(/^##\s/g, '').replace(/\s##$/g, '');
                str = str.replace(matches[i], this.get(key));
            }
        }

        return str;
    },

    // private
    _get: function(name, vars) {
        var value;
        var arr = name.split('.');

        if (arr.length === 1) value = vars[name];
        else value = (typeof vars[arr[0]] !== 'undefined') ? vars[arr[0]][arr[1]] : undefined;

        return value;
    },
    _build: function() {
        var vars = ArticleEditor.lang['en'];
        if (this.langKey !== 'en') {
            vars = (ArticleEditor.lang[this.langKey] !== 'undefined') ? ArticleEditor.lang[this.langKey] : vars;
        }

        return vars;
    }
});
ArticleEditor.add('module', 'link', {
    popups: {
        link: {
            "format": {
                title: '<span style="color: #448fff; text-decoration: underline;">## link.link ##</span>',
                command: 'link.format'
            },
            "edit": {
                title: '<span style="color: #448fff; text-decoration: underline;">## link.edit-link ##</span>',
                command: 'link.edit'
            },
            "unlink": {
                title: '<span style="color: #ff3366">## link.unlink ##</span>',
                command: 'link.unlink'
            }
        },
        edit: {
            name: 'link',
            width: '100%',
            form: {
                text: { type: 'input', label: '## link.text ##' },
                url: { type: 'input', label: '## link.url ##' },
                target: { type: 'checkbox', label: '## link.link-in-new-tab ##' }
            },
            header: 'Link',
            footer: {
                insert: { title: '## link.insert ##', command: 'link.insert', type: 'primary' },
                cancel: { title: '## link.cancel ##', command: 'popup.close' }
            }
        }
    },
    init: function() {
        // services
        this.content = this.app.create('content');
        this.selection = this.app.create('selection');
    },
    buildPopup: function() {
        return this.popups.link;
    },
    observe: function(obj) {
        var $link = this._getLink();

        if ($link.length === 0) {
            obj.format.hidden = false;
            obj.edit.hidden = true;
            obj.unlink.hidden = true;
        }
        else {
            obj.format.hidden = true;
            obj.edit.hidden = false;
            obj.unlink.hidden = false;
        }

        return obj;
    },
    format: function(args) {
        this.app.popup.build(this.popups.edit);
        this.app.popup.open();

        // set text
        var text = this.selection.getText();
        var $input = this.app.popup.getInput('text');
        $input.val(text);

        // set focus
        var $input = this.app.popup.getInput('url');
        $input.focus();
    },
    edit: function(args) {
        this.app.popup.build(this.popups.edit);
        this.app.popup.open();

        this.app.popup.setButton('insert', {
            name: 'save',
            title: '## link.save ##',
            command: 'link.save'
        });

        // get link
        var $link = this._getLink();

        // set text
        var $input = this.app.popup.getInput('text');
        $input.val($link.text());

        var url = $link.attr('href').replace('&amp;', '&');

        // set url
        var $input = this.app.popup.getInput('url');
        $input.val(url);
        $input.focus();

        // set new tab
        if ($link.attr('target') || this.opts.link.target) {
            var $checkbox = this.app.popup.getInput('target');
            $checkbox.attr('checked', true);
        }

    },
    insert: function() {
        // popup close
        this.app.popup.close();

        var instance = this.app.block.get();
        var data = this.app.popup.getData();

        this.selection.restore(instance.$block);

        data.url = this.content.escapeHtml(data.url);
        if (data.url.search(/^javascript:/i) !== -1) {
            data.url = '';
        }

        if (data.url !== '') {
            var nodes = this.app.inline.format({ tag: 'a' });
            var $link = this.dom(nodes[0]);

            data.url = data.url.replace('&amp;', '&');
            data.text = (data.text === '') ? data.url : data.text;

            $link.text(data.text);
            $link.attr('href', data.url);

            if (data.hasOwnProperty('target')) {
                $link.attr('target', '_blank');
            }

            this.app.broadcast('link.add', { url: data.url, text: data.text });
        }
    },
    save: function() {
        // popup close
        this.app.popup.close();

        var instance = this.app.block.get();
        var data = this.app.popup.getData();

        this.selection.restore(instance.$block);

        data.url = this.content.escapeHtml(data.url);
        if (data.url.search(/^javascript:/i) !== -1) {
            data.url = '';
        }

        if (data.url !== '') {

            // get link
            var $link = this._getLink();

            data.url = data.url.replace('&amp;', '&');
            data.text = (data.text === '') ? data.url : data.text;

            $link.text(data.text);
            $link.attr('href', data.url);

            if (data.hasOwnProperty('target')) {
                $link.attr('target', '_blank');
            }
            else {
                $link.removeAttr('target');
            }

            this.app.broadcast('link.change', { url: data.url, text: data.text });
        }
    },
    unlink: function() {
        this.app.popup.close();

        var links = this.selection.getNodes({ tags: ['a'] });
        if (links.length !== 0) {
            for (var i = 0; i < links.length; i++) {
                var $link = this.dom(links[i]);

                this.app.broadcast('link.remove', { url: $link.attr('href'), text: $link.text() });
                $link.unwrap();
            }
        }
    },

    // pribate
    _getLink: function() {
        var $link;
        var links = this.selection.getNodes({ tags: ['a'] });

        if (links.length !== 0) {
            $link = this.dom(links[0]);
        }
        else {
            $link = this.dom([]);
        }

        return $link;
    }
});
ArticleEditor.add('module', 'setting', {
    init: function() {
        // build
        this.opts = this._build();
    },
    dump: function() {
        return this.opts;
    },
    has: function(name) {
        var value;
        var arr = name.split('.');

        if (arr.length === 1) value = (typeof this.opts[name] !== 'undefined');
        else value = (typeof this.opts[arr[0]] !== 'undefined' && typeof this.opts[arr[1]] !== 'undefined');

        return value;
    },
    set: function(section, name, value) {
        if (typeof this.opts[section] === 'undefined') this.opts[section] = {};

        if (typeof value === 'undefined') this.opts[section] = name;
        else this.opts[section][name] = value;
    },
    get: function(name) {
        var value;
        var arr = name.split('.');

        if (arr.length === 1) value = this.opts[name];
        else value = (typeof this.opts[arr[0]] !== 'undefined') ? this.opts[arr[0]][arr[1]] : undefined;

        return value;
    },

    // private
    _build: function() {
        var opts = ArticleEditor.extend(true, {}, ArticleEditor.opts, this.app.initialSettings);
        opts = ArticleEditor.extend(true, opts, ArticleEditor.settings);

        return opts;
    }
});
ArticleEditor.add('module', 'source', {
    init: function() {
        // services
        this.utils = this.app.create('utils');

        // build
        this._build();
    },
    start: function() {
        this._buildStyles();
        this._appendToContainer();
    },
    stop: function() {
        this.$source.off('.arx-source-events');
        this.$source.remove();
    },
    toggle: function() {
        if (this.app.editor.isSourceMode()) {
            this.close();
        }
        else {
            this.open();
        }
    },
    open: function() {
        this.app.broadcast('source.before.open');

        var html = this.app.$element.val();
        html = html.replace('&amp;', '&');

        var height = this.app.container.$editor.height();

        this.$source.height(height);
        this.$source.val(html);
        this.$source.on('input.arx-source-events', this._handleChanges.bind(this));
        this.$source.on('keydown.arx-source-events', this._handleTab.bind(this));

        this.app.container.$editor.hide();
        this.app.container.$source.show();

        // codemirror
        this.utils.createCodemirror(this.$source, this.opts.source, height);

        var codemirror = this.utils.getCodemirror();
        if (codemirror) {
            codemirror.on('change', this._handleChanges.bind(this));
        }

        // ui
        this.app.path.disableAll();
        this.app.toolbar.disableAll();
        this.app.toolbar.disableSticky();
        this.app.toolbar.enable('html');
        this.app.toolbar.set('html');
        this.app.popup.close(false);

        // broadcast
        this.app.broadcast('source.open');
    },
    close: function() {
        this.app.broadcast('source.before.close');

        var html = this._getCode();

        this.app.editor.content.set(html);
        this.app.editor.sync.invoke();

        this.$source.off('.arx-source-events');

        this.app.container.$source.hide();
        this.app.container.$editor.show();

        // ui
        this.app.path.enableAll();
        this.app.toolbar.enableAll();
        this.app.toolbar.enableSticky();
        this.app.toolbar.unset('html');

        // broadcast
        this.app.broadcast('source.close');
    },

    // private
    _build: function() {
        this.$source = this.dom('<textarea>');
    },
    _buildStyles: function() {
        this.$source.addClass('arx-source');
        this.$source.attr('data-gramm_editor', false);
    },
    _getCode: function() {
        var html = this.$source.val();

        html = this.utils.getCodemirrorValue(html, this.opts.source);
        html = this.utils.sanitize(html);

        return html;
    },
    _getCodeSoft: function() {
        var html = this.$source.val();

        html = this.utils.getCodemirrorValueSoft(html, this.opts.source);
        html = this.utils.sanitize(html);

        return html;
    },
    _appendToContainer: function() {
        this.app.container.$source.append(this.$source);
    },
    _handleChanges: function(e) {
        var html = this._getCodeSoft();

        this.app.$element.val(html);
        this.app.broadcast('source.change', { e: e });
    },
    _handleTab: function(e) {
        if (e.keyCode !== 9) return true;

        e.preventDefault();

        var el = this.$source.get();
        var val = this.$source.val();
        var start = el.selectionStart;

        this.$source.val(val.substring(0, start) + "    " + val.substring(el.selectionEnd));
        el.selectionStart = el.selectionEnd = start + 4;
    }
});
ArticleEditor.add('module', 'parser', {
    init: function() {
        // services
        this.utils = this.app.create('utils');

        // local
        this.exclude = ['embed', 'image', 'figcaption'];
        this.items = this.opts.blocks;
    },
    register: function(name, props) {
        this.items[name] = props;
    },
    getProps: function(name) {
        if (typeof this.items[name] !== 'undefined') {
            return this.items[name];
        }
    },
    getProp: function(name, propname) {
        if (typeof this.items[name] !== 'undefined') {
            return this.items[name][propname];
        }
    },

    // parse
    parse: function($wrapper) {
        var selector, props;
        for (var key in this.items) {
            props = this.items[key];
            if (this.exclude.indexOf(key) !== -1 || key === 'noneditable') {
                continue;
            }
            else if (key === 'text') {
                selector = '.' + this.opts.plaintext.classname;
            }
            else if (key === 'snippet') {
                var snippets = [];
                for (var name in this.opts.snippets.items) {
                    snippets.push('.' + name);
                }

                selector = (snippets.length !== 0) ? snippets.join(', ') : false;
            }
            else if (key === 'column') {
                selector = (this.opts.grid) ? '.' + this.opts.grid.columns.classname : false;
            }
            else if (key === 'grid') {
                selector = (this.opts.grid) ? '.' + this.opts.grid.classname : false;
            }
            else {
                selector = props.selector;
            }

            if (selector) {
                $wrapper = this._parse($wrapper, selector, props, key);
            }
        }

        return $wrapper;
    },
    parseExclude: function($wrapper) {
        var selector, props;
        for (var key in this.items) {
            props = this.items[key];
            if (this.exclude.indexOf(key) === -1) {
                continue;
            }
            else {
                selector = props.selector;
            }

            if (selector) {
                $wrapper = this._parse($wrapper, selector, props, key);
            }
        }

        return $wrapper;
    },
    parseNoneditable: function($wrapper) {
        var selector = '.' + this.opts.noneditable.classname;
        var props = this.items['noneditable'];

        return this._parse($wrapper, selector, props, 'noneditable');
    },
    parseBlock: function($el, type) {
        if (type === 'grid' && this.opts.grid && this.opts.grid.overlay) {
            $el.addClass('arx-grid-overlay');
        }

        return $el;
    },
    parseLayer: function($el) {
        if ($el.attr('data-arx-type')) {
            return;
        }

        return $el;
    },
    parseTextBlock: function($el) {
        if ($el.closest('blockquote').length !== 0) {
            return;
        }

        if ($el.html().trim() === '') {
            $el.attr('data-placeholder', this.lang.get('placeholders.text'));
        }

        return $el;
    },
    parseList: function($el) {
        // is not root list
        if ($el.closest('li', this.app.editor.$editor).length !== 0) {
            return;
        }

        // blockquote
        if ($el.closest('blockquote').length !== 0) {
            return;
        }

        return $el;
    },
    parseQuote: function($el) {
        var $figure = $el.closest('figure');
        $el = ($figure.length !== 0) ? $figure : $el;

        return $el;
    },
    parseCode: function($el) {

        var $code = $el.find('code');
        var $target = ($code.length === 0) ? $el : $code;
        if ($target.html().trim() === '') {
            $target.attr('data-placeholder', this.lang.get('placeholders.code'));
        }

        var $figure = $el.closest('figure');
        $el = ($figure.length !== 0) ? $figure : $el;

        return $el;
    },
    parseImage: function($img) {
        var $link = $img.closest('a');
        var $el = ($link.length !== 0) ? $link : $img;
        var node = $el.get();

        var $parent = $el.closest('div, figure, p');
        var hasPrev = (node.previousSibling && node.previousSibling.nodeType === 3 && !this.utils.isEmpty(node.previousSibling));
        var hasNext = (node.nextSibling && node.nextSibling.nodeType === 3 && !this.utils.isEmpty(node.nextSibling));

        if ($parent.length !== 0 && !hasPrev && !hasNext) {

            // set data image
            var id = $img.attr('data-image');
            if (!id) $img.attr('data-image', this.utils.getRandomId());

            return $parent;
        }
    },
    parseEmbed: function($el) {
        if ($el.attr('data-arx-type')) {
            return;
        }

        var node = $el.get();
        var isIframe = ($el.closest('figure').length === 0 && node.tagName === 'IFRAME');
        if (isIframe) {
            $el = $el.wrap('<figure>');
        }

        var $clone = $el.clone();
        $clone.find('.' + this.opts.embed.responsive).unwrap();
        $clone.find('figcaption').remove();

        $el.attr('data-embed-code', encodeURI($clone.get().innerHTML.trim()));

        return $el;
    },
    parseProps: function($el, name, props) {

        if (!$el) {
            return;
        }

        $el.attr('data-arx-type', name);
        $el.removeAttr('contenteditable');
        $el.removeClass('arx-block-no-hover');

        if (props.editable) {
            $el.attr('contenteditable', true);
            if (!this.opts.editor.grammarly) $el.attr('data-gramm_editor', false);
        }

        if (!props.hover) {
            $el.addClass('arx-block-no-hover');
        }
    },

    // private
    _parse: function($wrapper, selector, props, key) {
        $wrapper.find(selector).each(function(node) {
            var $el = this.dom(node);
            if (props.command) {
                $el = this.app.api(props.command, $el, key);
            }
            this.parseProps($el, key, props);
        }.bind(this));

        return $wrapper;
    }
});
ArticleEditor.add('module', 'statusbar', {
    init: function() {
        // local
        this.items = {};
    },
    start: function() {
        this._build();
    },
    stop: function() {

    },
    add: function(name, html) {
        return this.update(name, html);
    },
    update: function(name, html) {
        var $item;
        if (typeof this.items[name] !== 'undefined') {
            $item = this.items[name];
        }
        else {
            $item = this.dom('<li>');
            this.$statusbar.append($item);
            this.items[name] = $item;
        }

        return $item.html(html);
    },
    get: function(name) {
        return (this.items[name]) ? this.items[name] : this.items;
    },
    remove: function(name) {
        if (this.items[name]) {
            this.items[name].remove();
            delete this.items[name];
        }
    },
    clear: function() {
        this.items = {};
        this.$statusbar.html('');
    },


    // private
    _build: function() {
        this.$statusbar = this.dom('<ul>');
        this.$statusbar.addClass('arx-statusbar arx-statusbar-' + this.uuid);
        this.$statusbar.attr('dir', this.opts.editor.direction);

        this.app.container.$statusbar.append(this.$statusbar);
    }
});
ArticleEditor.add('module', 'toolbar', {
    subscribe: {
        'app.start': function() {
            this._buildEditorButtons();
        },
        'editor.content.set': function() {
            this._checkSticky();
        },
        'editor.content.change': function() {
            this._checkSticky();
        }
    },
    init: function() {
        // local
        this.customButtons = {};
        this.toolbarButtons = this.opts.buttons.toolbar;
        this.editorButtons = this.opts.buttons.editor;
        this.addbarButtons = this.opts.addbar;

        // services
        this.utils = this.app.create('utils');
        this.button = this.app.create('button');
    },
    start: function() {
        this._build();
        this.enableSticky();
    },
    stop: function() {
        var $target = this.utils.getScrollTarget();

        this.app.$doc.off('.arx-toolbar-' + this.uuid);
        this.app.$win.off('.arx-toolbar-' + this.uuid);
        $target.off('.arx-toolbar-' + this.uuid);

        this.app.$body.find('.arx-tooltip').remove();
    },
    build: function() {
        if (!this.app.block.is()) {
            this._buildEditorButtons();
            return;
        }

        this._clear();

        var instance = this.app.block.get();
        var buttons = instance.buttons;

        // add button
        if (instance.isControls()) {
            this._createButton('add', this.toolbarButtons.add);
        }

        // default buttons
        for (var key in buttons) {
            this._createButton(key, buttons[key]);
        }

        // custom buttons
        for (var key in this.customButtons) {
            if (instance.isAllowedButton(this.customButtons[key], 'toolbar')) {
                this._createButton(key, this.customButtons[key]);
            }
        }

        // undo / redo
        if (this.opts.editor.undoredo) {
            this._createButton('undo', this.toolbarButtons.undo);
            this._createButton('redo', this.toolbarButtons.redo);
        }
    },
    addbar: function() {
        if (this.addbarButtons === false) {
            return false;
        }

        var items = this.addbarButtons;
        for (var key in items) {
            items[key].text = true;
        }

        return items;
    },
    disable: function(name) {
        this.enableAll();
        this.get(name).addClass('disable');
    },
    disableSticky: function() {
        this.app.container.$toolbar.removeClass('arx-top-sticky');
        this.app.container.$toolbar.css('top', '');
    },
    disableAll: function() {
        this._getAll().addClass('disable');
    },
    enable: function(name) {
        this.get(name).removeClass('disable');
    },
    enableSticky: function() {
        if (this.opts.toolbar.sticky) {
            this.app.container.$toolbar.addClass('arx-top-sticky');
            this.app.container.$toolbar.css('top', this.opts.toolbar.stickyTopOffset + 'px');
        }
    },
    enableAll: function() {
        this._getAll().removeClass('disable');
    },
    set: function(name) {
        this._getAll().removeClass('active');
        this.get(name).addClass('active');
    },
    unset: function(name) {
        this.get(name).removeClass('active')
    },
    get: function(name) {
        return this.app.container.$toolbar.find('[data-name=' + name + ']');
    },
    add: function(name, obj) {
        this.customButtons[name] = obj;
    },
    addTo: function(type, name, obj) {
        if (type === 'addbar') {
            this.addbarButtons[name] = obj;
        }
        else if (type === 'editor') {
            this.editorButtons[name] = obj;
        }
    },
    remove: function(name) {
        this.get(name).remove();
    },
    removeFrom: function() {

    },
    change: function(name, obj) {
        var $btn = this.get(name);
    },
    popup: function(args) {

        var popup = args.button.popup;

        this.app.popup.build(popup);
        var $popup = this.app.popup.getBody();

        // popup builder
        if (popup.hasOwnProperty('builder')) {
            this._createBuilderButtons(popup, $popup);
        }
        // buttons
        else {
            for (var name in popup) {
                var button = popup[name];
                if (typeof button !== 'object') continue;
                var isStructure = (button.type === 'list' || button.type === 'group');

                // list or group observer
                if (button.hasOwnProperty('observer') && isStructure) {
                    var res = this.app.api(button.observer, button.buttons, name);
                    if (typeof res !== 'undefined') {
                        button.buttons = res;
                    }
                }

                // create button
                if (button.hasOwnProperty('builder')) {
                    var $target = this._createButtonTarget(button, $popup);
                    if (!$target) {
                        continue;
                    }

                    for (var index in button.buttons) {
                        this._createPopupButton(index, button.buttons[index], button.type, $target);
                    }
                }
                else {
                    this._createPopupButton(name, button, false, $popup);
                }

            }
        }

        this.app.popup.open(args.$btn);
    },

    // private
    _getAll: function() {
        return this.app.container.$toolbar.find('[data-name]');
    },
    _clear: function() {
        this.$toolbar.find('.arx-button').off('.arx-button-' + this.uuid);
        this.$toolbar.html('');
    },
    _createButtonTarget: function(button, $popup) {
        var $target = $popup;
        var len = Object.keys(button.buttons).length;
        if (len === 0) {
            return false;
        }

        if (button.type === 'list') {
            $target = this._buildPopupList($popup);
        }
        else if (button.type === 'group') {
            $target = this._buildPopupGroup($popup, button);
        }

        return $target;
    },
    _createBuilderButtons: function(popup, $popup) {
        for (var name in popup.buttons) {
            this.button.create(name, popup.buttons[name], $popup, 'popup');
        }
    },
    _createPopupButton: function(name, button, type, $popup) {
        this.button.create(name, this._buildPopupButton(button, type), $popup, 'popup');
    },
    _createButton: function(key, obj) {
        this.button.create(key, obj, this.$toolbar);
    },
    _buildPopupButton: function(button, type) {
        button.text = (button.hasOwnProperty('text')) ? button.text : (type !== 'group');
        button.icon = (button.hasOwnProperty('icon')) ? button.icon : (type === 'group');

        return button;
    },
    _buildPopupList: function($popup) {
        var $target = this.dom('<div>');
        $target.addClass('arx-popup-tool arx-popup-buttons-list');
        $popup.append($target);

        return $target;
    },
    _buildPopupGroup: function($popup, button) {
        var $container = this.dom('<div>');
        $container.addClass('arx-popup-tool');

        if (button.hasOwnProperty('title')) {
            this._buildPopupGroupTitle($container, button);
        }

        var $target = this.dom('<div>');
        $target.addClass('arx-popup-buttons-group');
        $container.append($target);
        $popup.append($container);

        return $target;
    },
    _buildPopupGroupTitle: function($container, button) {
        var title = this.lang.parse(button.title);
        var $title = this.dom('<div>');
        $title.addClass('arx-popup-buttons-group-title');
        $title.html(title);
        $container.append($title);
    },
    _buildEditorButtons: function() {
        this._clear();

        for (var key in this.editorButtons) {
            if (key === 'html' && !this.opts.source) continue;
            if (key === 'templates' && !this.opts.templates.json) continue;
            this._createButton(key, this.editorButtons[key]);
        }
    },
    _build: function() {
        this.$toolbar = this.dom('<div>');
        this.$toolbar.addClass('arx-toolbar');

        this.app.container.$toolbar.append(this.$toolbar);
    },
    _checkSticky: function() {
        var editorHeight = this.app.editor.$editor.height();
        if ((editorHeight < this.opts.toolbar.stickyMinHeight) || this.app.editor.isEmpty()) {
            this.disableSticky();
        }
        else {
            this.enableSticky();
        }
    }
});
ArticleEditor.add('module', 'control', {
    init: function() {
        // local
        if (this.opts.editor.control) {
            this.buttons = this.opts.buttons.control;
        }
        else {
            this.buttons = {};
        }

        this.customButtons = {};

        // services
        this.utils = this.app.create('utils');
        this.button = this.app.create('button');
    },
    start: function() {
        this._build();
    },
    stop: function() {
        this._stopResize();
        this.$control.remove();
    },
    open: function() {
        var instance = this.app.block.get();

        if (!instance.isControls() && Object.keys(this.customButtons).length === 0) {
            this._stopResize();
            this.close();
            return;
        }

        this._clear();

        if (Object.keys(this.buttons).length > 0) {
            this._buildButtons(instance);
            this._updatePosition(false, instance);
            this._startResize();
            this.$control.show();
        }
    },
    close: function() {
        this.$control.hide();
    },
    add: function(name, obj) {
        this.buttons[name] = obj;
        this.customButtons[name] = true;
    },
    get: function(name) {
        var $btn = this.$control.find('[data-name=' + name + ']');
        if ($btn.length === 0) {
            $btn = this.dom([]);
        }

        return $btn;
    },
    remove: function(name) {
        delete this.buttons[name];
    },
    rebuild: function() {
        this._updatePosition(false);
    },
    hasButtons: function(instance) {
        var res = 0;
        for (var key in this.buttons) {
            if (instance.isAllowedButton(this.buttons[key], 'control')) {
                res++;
            }
        }

        return (res !== 0);
    },

    // private
    _clear: function() {
        this.$control.html('');
    },
    _startResize: function() {
        this.app.$win.on('resize.arx-control', this._updatePosition.bind(this));
    },
    _stopResize: function() {
        this.app.$win.off('.arx-control');
    },
    _updatePosition: function(e, instance) {
        instance = (instance) ? instance : this.app.block.get();
        if (!instance) {
            return;
        }

        // block
        var offset = instance.$block.offset();
        var top = offset.top;
        var left = offset.left;
        if (this.utils.isScrollTarget()) {
            var $target = this.utils.getScrollTarget();
            var targetOffset = $target.offset();
            var borderTop = parseInt($target.css('border-top-width'));
            var borderLeft = parseInt($target.css('border-left-width'));
            top = offset.top - targetOffset.top - borderTop + $target.scrollTop();
            left = offset.left - targetOffset.left - borderLeft;
        }

        var topOutlineFix = -3;
        var leftOutlineFix = -33;
        if (this.opts.editor.direction === 'rtl') {
            left =  offset.left + instance.$block.width();
            leftOutlineFix = 4;
            if (this.utils.isScrollTarget()) {
                left = left - targetOffset.left - borderLeft;
            }
        }

        this.$control.css({
            top: (top + topOutlineFix) + 'px',
            left: (left + leftOutlineFix) + 'px'
        });
    },
    _build: function() {
        this.$control = this.dom('<div>');
        this.$control.addClass('arx-control arx-control-' + this.uuid);
        this.$control.hide();

        // bs modal
        if (this.opts.bsmodal) {
            this.$control.css('z-index', 1051);
        }

        var $target = (this.utils.isScrollTarget()) ? this.utils.getScrollTarget() : this.app.$body;
        $target.append(this.$control);
    },
    _buildButtons: function(instance) {
        for (var key in this.buttons) {
            if (!instance.isControls() && !this.customButtons.hasOwnProperty(key)) {
                continue;
            }

            if (instance.isAllowedButton(this.buttons[key], 'control')) {
                this.button.create(key, this.buttons[key], this.$control, 'control');
            }
        }
    }
});
ArticleEditor.add('module', 'path', {
    start: function() {
        this._build();
        this._buildRoot();
        this._buildActive();
    },
    build: function() {
        this._clear();
        this._buildRoot();

        // path
        var current = this.app.block.get();

        if (current) {
            // parents
            var $parents = current.$block.parents('[data-arx-type]');
            $parents.nodes.reverse();
            $parents.each(this._buildParentItem.bind(this));

            // current
            this._buildItem(current);
        }

        // active
        this._buildActive();
    },
    buildMultiple: function() {
        this._clear();
        this._buildRoot();

        var $item = this.dom('<a>');
        $item.addClass('arx-path-item');
        $item.attr('href', '#');
        $item.addClass('active');
        $item.html(this.lang.get('editor.multiple'));

        this.$path.append($item);
    },
    disableAll: function() {
        this._getAll().addClass('disable');
    },
    enableAll: function() {
        this._getAll().removeClass('disable');
    },

    // private
    _clear: function() {
        this.$path.find('.arx-path-item').off('.arx-path-' + this.uuid);
        this.$path.html('');
    },
    _getAll: function() {
        return this.$path.find('.arx-path-item');
    },
    _selectItem: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var $item = this.dom(e.target);
        if ($item.hasClass('disable')) return;

        var instance = $item.dataget('instance');
        this.app.block.set(instance.$block);
    },
    _selectRoot: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var $item = this.dom(e.target);
        if ($item.hasClass('disable')) return;

        this._clear();
        this._buildRoot();
        this._buildActive();
        this.app.block.unset();
    },
    _build: function() {
        this.$path = this.dom('<div>');
        this.$path.addClass('arx-path');

        // append
        this.app.container.$toolbar.append(this.$path);
    },
    _buildParentItem: function(node) {
        var $el = this.dom(node);
        var type = $el.attr('data-arx-type');
        var instance = this.app.create('block.' + type, $el);

        this._buildItem(instance);
    },
    _buildActive: function() {
        var $items = this.$path.find('a');
        $items.removeClass('active');
        $items.last().addClass('active');
    },
    _buildItem: function(instance, root) {
        var $item = this.dom('<a>');
        $item.addClass('arx-path-item');
        $item.attr('href', '#');
        $item.html(root || instance.getName());

        if (root) {
            $item.on('click.arx-path-' + this.uuid, this._selectRoot.bind(this));
        }
        else {
            $item.dataset('instance', instance);
            $item.on('click.arx-path-' + this.uuid, this._selectItem.bind(this));
        }

        this.$path.append($item);
    },
    _buildRoot: function() {
        this._buildItem(false, this.lang.parse(this.opts.path.title));
    }
});




ArticleEditor.add('module', 'popup', {
    init: function() {
        // services
        this.utils = this.app.create('utils');
        this.selection = this.app.create('selection');

        // local
        this.$scrollTarget = this.utils.getScrollTarget();
    },
    start: function() {
        this.$container = this.dom('<div>');
        this.$container.addClass('arx-popup-hide arx-popup-container arx-popup-container-' + this.uuid);

        var $target = (this.utils.isScrollTarget()) ? this.utils.getScrollTarget() : this.app.$body;
        $target.append(this.$container);
    },
    stop: function() {
        this.close();
        this.$container.remove();
    },

    // is
    isOpen: function() {
        return (this.$container && !this.$container.hasClass('arx-popup-hide'));
    },
    isForm: function() {
        return (this.$popup && this.$popup.hasClass('arx-popup-aform'));
    },

    // get
    getContainer: function() {
        return this.$container;
    },
    getPopup: function() {
        return this.$popup;
    },
    getBody: function() {
        return this.$popupBody;
    },
    getForm: function() {
        return this.$popupBody;
    },
    getHeader: function() {
        return this.$popupHeader;
    },
    getFooter: function() {
        return this.$popupFooter;
    },
    getButton: function(name) {
        if (this.isForm() && this.$popupFooter) {
            return this.$popupFooter.find('[data-name=' + name + ']');
        }
    },
    getInput: function(name) {
        if (this.isForm()) {
            return this.$popupBody.find('[name=' + name + ']');
        }
    },
    getData: function(name) {
        if (this.isForm() && typeof name === 'undefined') {
            return this.$popupBody.serialize(true);
        }

        var $input = this.getInput(name);
        if ($input) {
            return $input.val().trim();
        }
    },

    // set
    setData: function(name, value) {
        var $input = this.getInput(name);
        if ($input) {
            $input.val(value);
        }
    },
    setButton: function(name, obj) {
        var $btn = this.getButton(name);
        if ($btn) {
            if (obj.hasOwnProperty('command')) $btn.attr('data-command', obj.command);
            if (obj.hasOwnProperty('name')) $btn.attr('data-name', obj.name);
            if (obj.hasOwnProperty('title')) $btn.html(this.lang.parse(obj.title));
        }
    },
    setFocus: function(name) {
        var $input = this.getInput(name);
        if ($input) {
            $input.focus();
        }
    },
    setDark: function() {
        this.$popup.addClass('arx-popup-dark');
    },
    setLight: function() {
        this.$popup.removeClass('arx-popup-dark');
    },

    // build
    build: function(params) {

        var defaults = {
            name: false,
            dark: false,
            form: false,
            header: false,
            footer: false,
            list: false,
            width: false
        };

        // params
        this.params = ArticleEditor.extend(true, defaults, params);

        // clear
        this.$container.html('');

        // bs modal
        if (this.opts.bsmodal) {
            this.$container.css('z-index', 1052);
        }

        // build
        this._buildPopup();
        this._buildBody();
        this._buildForm();
        this._buildDark();
        this._buildList();
        this._buildClassname();
        this._buildWidth();
        this._buildHeader();
        this._buildFooter();
    },

    // open
    open: function($btn) {

        // btn
        if ($btn) {
            var popupName = $btn.attr('data-popup-name');
            if (this.isOpen() && popupName && popupName === this.params.name) {
                this.close(false);
                return;
            }

            this.app.$body.find('.arx-popup-in-' + this.uuid).removeClass('arx-popup-in arx-popup-in-' + this.uuid).removeAttr('data-popup-name');
            $btn.addClass('arx-popup-in arx-popup-in-' + this.uuid);

            if (this.params.name) {
                $btn.attr('data-popup-name', this.params.name);
            }
        }

        // close all popups (multiple editors)
        this.app.$body.find('.arx-popup-container').not('.arx-popup-container-' + this.uuid).addClass('arx-popup-hide');
        this._stopEvents();

        this.updatePosition();
        this.$container.removeClass('arx-popup-hide');

        // animate
        this.$container.addClass('arx-popup-fade-in');
        this.$container.one('animationend webkitAnimationEnd', function(e) {
            this.$container.removeClass('arx-popup-fade-in');
        }.bind(this));


        // selection
        var instance = this.app.block.get();
        if (instance && instance.isEditable()) {
            this.selection.save(instance.$block);
        }

        // events
        this.app.$doc.on('keydown.arx-popup-container-' + this.uuid, this._handleKeyboard.bind(this));
        this.app.$doc.on('click.arx-popup-container-' + this.uuid, this._handleClick.bind(this));
        this.app.$win.on('resize.arx-popup-container-' + this.uuid, this._handleResize.bind(this));
        this.$scrollTarget.on('scroll.arx-popup-container-' + this.uuid, this._handleResize.bind(this));
        this.$scrollTarget.on('scroll.arx-popup-container-' + this.uuid, this.updatePosition.bind(this));
        this.$popup.find('input[type=text],input[type=url],input[type=email]').on('keydown.arx-popup-' + this.uuid, this._handleEnter.bind(this));

        // adjust height
        this._handleResize();
    },

    // close
    close: function(animate) {

        if (this.$container.hasClass('arx-popup-hide')) {
            return;
        }

        // events
        this.app.$body.find('.arx-popup-in-' + this.uuid).removeClass('arx-popup-in arx-popup-in-' + this.uuid).removeAttr('data-popup-name');
        this._stopEvents();

        // animate
        if (animate !== false)  {
            this.$container.addClass('arx-popup-fade-out');
            this.$container.one('animationend webkitAnimationEnd', function(e) {
                this.$container.removeClass('arx-popup-fade-out');
                this.$container.addClass('arx-popup-hide');
            }.bind(this));
        }
        else {
            this.$container.addClass('arx-popup-hide');
        }

        this.$popup.find('.arx-popup-footer-btn').off('.arx-popup-footer-btn-' + this.uuid);
        this.$popup.find('.arx-button').off('.arx-button-' + this.uuid);
        this.$popup.find('.arx-popup-event').off('.arx-popup-event-' + this.uuid);
        this.$popup.find('input[type=text],input[type=url],input[type=email]').off('.arx-popup-' + this.uuid);

        // selection
        this.selection.restore();
    },

    // update
    updatePosition: function() {
        var $toolbar = this.app.container.$toolbar;
        var offset = $toolbar.offset();
        if (this.utils.isScrollTarget()) {
            var $target = this.utils.getScrollTarget();
            var targetOffset = $target.offset();
            var containerOffset = this.app.container.$main.position();
            var borderTop = parseInt($target.css('border-top-width'));

            offset.left = containerOffset.left;
            offset.top = offset.top - targetOffset.top + $target.scrollTop() - borderTop;

        }

        var height = $toolbar.height();
        var positionTop = 5;
        var positionLeft = 5;

        this.$container.css({
            top: (offset.top + height + positionTop) + 'px',
            left: (offset.left + positionLeft) + 'px'
        });
    },

    // private
    _stopEvents: function() {
        this.app.$doc.off('.arx-popup-container-' + this.uuid);
        this.app.$win.off('.arx-popup-container-' + this.uuid);
        this.$scrollTarget.off('.arx-popup-container-' + this.uuid);
    },
    _handleResize: function() {

        var heightTolerance = 10;
        var widthTolerance = 10;

        this.$popup.css('min-width', '');

        var isWidth = false;
        if (this.params.width) {
            var width = this.app.container.$main.width();
            var value = (width - widthTolerance);

            if (this.$popup.hasClass('arx-popup-adaptive')) {
                isWidth = true;
            }
            else {
                var popupWidth = this._buildRelativeWidth(this.params.width);
                if (popupWidth > value) {
                    isWidth = true;
                }
                else {
                    isWidth = true;
                    value = popupWidth;
                }
            }
        }

        if (isWidth) {
            this.$popup.css({
                'min-width': value + 'px',
                'max-width': value + 'px'
            });
        }

        var $target = this.utils.getScrollTarget();
        var offset = (this.utils.isScrollTarget()) ? this.$popup.position() : this.$popup.offset();
        var top = offset.top - $target.scrollTop();
        var winHeight = this.app.$win.height();
        if (this.utils.isScrollTarget()) {

            var borderTop = parseInt($target.css('border-top-width'));
            var borderBottom = parseInt($target.css('border-bottom-width'));
            winHeight = $target.height() - borderTop - borderBottom;

        }

        var cropHeight = winHeight - top - heightTolerance;

        this.$popup.css('max-height', cropHeight + 'px');
    },
    _handleClick: function(e) {
        var $el = this.dom(e.target);
        var isPopup = ($el.closest('.arx-popup-container-' + this.uuid).length !== 0);

        if (!isPopup) {
            this.close();
        }
    },
    _handleEnter: function(e) {
        if (e.which === 13) {
            e.preventDefault();
        }
    },
    _handleKeyboard: function(e) {
        if (e.which === 27) {
            this.close();
        }
    },
    _buildPopup: function() {
        this.$popup = this.dom('<div>').addClass('arx-popup');
        this.$popup.attr('dir', this.opts.editor.direction);

        this.$container.append(this.$popup);
    },
    _buildBody: function() {
        if (this.params.form) {
            this.$popupBody = this.dom('<form>');

            this.$popupBody.addClass('arx-form arx-popup-body-aform');
            this.$popup.addClass('arx-popup-aform');
        }
        else {
            this.$popupBody = this.dom('<div>');
            this.$popup.removeClass('arx-popup-aform');
        }

        this.$popupBody.addClass('arx-popup-body');
        this.$popup.append(this.$popupBody);
    },
    _buildHeader: function() {
        if (this.params.header) {
            this.$popupHeader = this.dom('<header>');
            this.$popupHeader.addClass('arx-popup-header');
            this.$popupHeader.html(this.lang.parse(this.params.header));

            this.$popup.prepend(this.$popupHeader);
        }
    },
    _buildFooter: function() {
        if (this.params.footer) {
            this.$popupFooter = this.dom('<footer>');
            this.$popupFooter.addClass('arx-popup-footer');

            // buttons
            for (var key in this.params.footer) {
                var button = this.params.footer[key];
                var $btn = this.dom('<button>');
                $btn.addClass('arx-popup-footer-btn arx-form-button');
                $btn.attr('data-command', button.command);
                $btn.attr('data-name', key);
                $btn.html(this.lang.parse(button.title));
                $btn.on('click.arx-popup-footer-btn-' + this.uuid, this._catch.bind(this));

                if (button.hasOwnProperty('type')) {
                    $btn.addClass('arx-form-button-' + button.type);
                }

                this.$popupFooter.append($btn);
            }

            this.$popup.append(this.$popupFooter);
        }
    },
    _buildWidth: function() {
        if (this.params.width && this.params.width === '100%') {
            this.$popup.addClass('arx-popup-adaptive');
        }
    },
    _buildList: function() {
        if (this.params.list) {
            this.$popup.addClass('arx-popup-alist');
            this.$popupBody.addClass('arx-popup-body-alist');
        }
    },
    _buildClassname: function() {
        if (this.params.name) {
            this.$popup.addClass('arx-popup-' + this.params.name);
            this.$popupBody.addClass('arx-popup-body-' + this.params.name);
        }
    },
    _buildDark: function() {
        if (this.params.dark) {
            this.setDark();
        }
    },
    _buildForm: function() {
        if (!this.params.form) {
            return;
        }

        for (var key in this.params.form) {
            var data = this.params.form[key];

            var $item = this._createFormItem();
            this._buildInput($item, data, key);

            // append
            this.$popupBody.append($item);
        }
    },
    _buildInput: function($item, data, key) {

        if (data.type === 'checkbox') {
            // label
            var $label = this.dom('<label>');
            $label.addClass('arx-form-checkbox');

            // checkbox
            var $checkbox = this.dom('<input>');
            $checkbox.attr('type', 'checkbox');
            $checkbox.attr('name', key);
            $label.append($checkbox);

            // checkbox text
            if (data.hasOwnProperty('label')) {
                var $span = this.dom('<span>');
                $span.html(this.lang.parse(data.label));
                $label.append($span);
            }

            // append
            $item.append($label);
        }
        else {
            // label
            if (data.hasOwnProperty('label')) {
                var $label = this._buildInputLabel(data);
                $item.append($label);
            }

            // input
            var $input = this.dom('<' + data.type + '>');
            $input.attr('name', key);
            $input.addClass('arx-form-input');

            if (data.type === 'input') {
                $input.attr('type', 'text');
            }

            if (data.type === 'textarea') {
                $input.attr('data-gramm_editor', false);
            }

            // attrs
            if (data.hasOwnProperty('attr')) {
                $input.attr(data.attr);
            }

            // append
            $item.append($input);

        }

    },
    _buildInputLabel: function(data) {
        return this.dom('<label>').html(this.lang.parse(data.label));
    },
    _buildRelativeWidth: function(width) {
        return parseInt(this.params.width) + parseInt(this.$popup.css('padding-left')) + parseInt(this.$popup.css('padding-right'));
    },
    _createFormItem: function() {
        return this.dom('<div>').addClass('arx-form-item');
    },
    _catch: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var $el = this.dom(e.target);
        var command = $el.attr('data-command');
        var name = $el.attr('data-name');

        // command
        this.app.api(command, e, name);
    }
});
ArticleEditor.add('module', 'template', {
    init: function() {
        // local
        this.key = false;
        this.json = {};

        // services
        this.button = this.app.create('button');
        this.content = this.app.create('content');
    },
    observe: function(obj, name) {
        return (this._is()) ? obj : false;
    },
    buildPopup: function(args) {
        if (this._isJson()) {
            this._buildPopupPreview(args);
        }
        else {
            this._buildPopupList(args);
        }
    },
    insert: function(e) {
        var $trigger = this.dom(e.target).closest('.arx-template-trigger');
        var key = $trigger.attr('data-template-key');

        if (this.json.hasOwnProperty(key)) {
            this.app.popup.close();

            var html = this.json[key].html;
            this.app.editor.content.set(html);
            this.app.editor.sync.invoke();
        }
    },

    // private
    _buildPopupList: function(args) {

        this.app.popup.build({
            name: 'template-list',
            list: true
        });
        this.app.popup.open(args.$btn);

        var $popup = this.app.popup.getBody();
        var templates = this.opts.templates.items;

        for (var key in templates) {
            var obj = {
                title: templates[key],
                text: true,
                icon: false,
                command: 'template._insertOld'
            };

            this.button.create(key, obj, $popup, 'popup');
        }
    },
    _buildPopupPreview: function(args) {
        // items
        if (this.opts.templates.hasOwnProperty('items')) {
            this._buildPopupList(args);
        }
        else {
            // json url
            if (typeof this.opts.templates.json === 'string') {
                this.ajax.get({
                    url: this.opts.templates.json,
                    data: { d: new Date().getTime() },
                    success: function(data) {
                        this._buildPreview(args, data);
                    }.bind(this)
                });
            }
            // json object
            else {
                this._buildPreview(args, this.opts.templates.json);
            }
        }
    },
    _buildPreview: function(args, data) {
        this.app.popup.build({
            name: 'template',
            header: '## templates.templates ##',
            width: '100%'
        });
        this.app.popup.open(args.$btn);

        var $popup = this.app.popup.getBody();
        this.json = data;
        if (typeof data === 'string') {
            this.json = JSON.parse(data);
        }

        for (var key in this.json) {

            var $container = this.dom('<div>');
            $container.addClass('arx-template-preview-container arx-template-trigger');
            $container.attr('data-template-key', key);
            $container.on('click.arx-templates', this.insert.bind(this));

            var $div = this.dom('<div>');
            $div.html(this.json[key].html);
            $div.addClass('arx-reset arx-content arx-template-preview');
            $container.append($div);

            if (this.json[key].hasOwnProperty('name')) {
                var $span = this.dom('<div>');
                $span.addClass('arx-template-preview-name');
                $span.text(this.json[key].name);
                $container.append($span);
            }

            $popup.append($container);
        }

    },
    _is: function() {
        return (this.opts.templates.url || this.opts.templates.json);
    },
    _isJson: function() {
        return (this.opts.templates.json && this.opts.templates.json !== true);
    },
    _getUrl: function() {
        var url = this.opts.templates.url;
        if (!this.opts.templates.json) {
            url = url + this.key + '.html';
        }
        return url;
    },
    _request: function() {
        this.ajax.get({
            url: this._getUrl(),
            data: { d: new Date().getTime() },
            success: this._insert.bind(this)
        });
    },
    _insertOld: function(args) {
        this.app.popup.close();

        // template key
        this.key = args.name;

        if (typeof this.opts.templates.json === 'object') {
            this._insert(this.opts.templates.json);
        }
        else {
            this._request();
        }
    },
    _insert: function(data) {
        var html = false;
        if (this.opts.templates.json) {
            for (var key in data) {
                if (key === this.key) {
                    html = data[key].html;
                    break;
                }
            }
        }
        else {
            html = data;
        }

        if (html !== false) {
            this.app.editor.content.set(html);
            this.app.editor.sync.invoke();
        }
        this.key = false;
    }
});
ArticleEditor.add('module', 'shortcuts', {
    init: function() {
        // services
        this.button = this.app.create('button');
        this.content = this.app.create('content');

        // local
        this.shortcuts = this.opts.shortcuts;

        // based on https://github.com/jeresig/jquery.hotkeys
        this.hotkeys = {
            8: "backspace", 9: "tab", 10: "return", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
            20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
            37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del", 59: ";", 61: "=",
            96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
            104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/",
            112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",
            120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 173: "-", 186: ";", 187: "=",
            188: ",", 189: "-", 190: ".", 191: "/", 192: "`", 219: "[", 220: "\\", 221: "]", 222: "'"
        };

        this.hotkeysShiftNums = {
            "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
            "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",
            ".": ">",  "/": "?",  "\\": "|"
        };

        if (this.opts.editor.multipleSelection === false) {
            this.remove('meta+click');
        }

    },
    add: function(keys, obj) {
        this.shortcuts[keys] = obj;
    },
    remove: function(keys) {
        this.opts.shortcutsBase = this._remove(keys, this.opts.shortcutsBase);
        this.opts.shortcuts = this._remove(keys, this.opts.shortcuts);
    },
    handle: function(e) {
        this.triggered = false;

        // disable browser's hot keys for bold and italic if shortcuts off
        if (this.shortcuts === false) {
            if ((e.ctrlKey || e.metaKey) && (e.which === 66 || e.which === 73)) {
                e.preventDefault();
            }
            return true;
        }

        // build
        if (e.ctrlKey || e.metaKey || e.shoftKey || e.altKey) {
            for (var key in this.shortcuts) {
                this._build(e, key, this.shortcuts[key]);
            }
        }

        return (this.triggered);
    },
    observePopup: function(obj, name) {
        return (this.opts.editor.shortcutsPopup) ? obj : false;
    },
    buildPopup: function(args) {

        // popup
        this.app.popup.build({
            name: 'shortcuts',
            width: '360px'
        });

        var meta = (/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)) ? '<b>&#8984;</b>' : 'ctrl';

        // items
        this._buildPopupItems(this.opts.shortcutsBase, meta, 'base');
        this._buildPopupItems(this.opts.shortcuts, meta);

        // open
        this.app.popup.open(args.$btn);
    },

    // private
    _buildPopupItems: function(items, meta, type) {
        for (var key in items) {
            var $item = this.dom('<div>');
            var title = (type === 'base') ? items[key] : items[key].title;

            var $span = this.dom('<span class="arx-shortcut-title">');
            $span.html(this.lang.parse(title));

            var $kbd = this.dom('<span class="arx-shortcut-kbd">')
            var name = (type === 'base') ? key.replace('meta', meta) : items[key].name.replace('meta', meta);
            var arr = name.split('+');
            for (var i = 0; i < arr.length; i++) {
                arr[i] = '<span>' + arr[i] + '</span>';
            }
            $kbd.html(arr.join('+'));

            $item.append($span);
            $item.append($kbd);

            var $popup = this.app.popup.getBody();
            $popup.append($item);
        }
    },
    _build: function(e, str, obj) {
        var keys = str.split(',');
        var len = keys.length;
        for (var i = 0; i < len; i++) {
            if (typeof keys[i] === 'string' && !obj.hasOwnProperty('trigger')) {
                this._handler(e, keys[i].trim(), obj);
            }
        }
    },
    _handler: function(e, keys, obj) {
        keys = keys.toLowerCase().split(" ");

        var special = this.hotkeys[e.keyCode];
        var character = (e.which !== 91) ? String.fromCharCode(e.which).toLowerCase() : false;
        var modif = "", possible = {};
        var cmdKeys = ["meta", "ctrl", "alt", "shift"];

        for (var i = 0; i < cmdKeys.length; i++) {
            var specialKey = cmdKeys[i];
            if (e[specialKey + 'Key'] && special !== specialKey) {
                modif += specialKey + '+';
            }
        }

        if (special) possible[modif + special] = true;
        if (character) {
            possible[modif + character] = true;
            possible[modif + this.hotkeysShiftNums[character]] = true;

            // "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
            if (modif === "shift+") {
                possible[this.hotkeysShiftNums[character]] = true;
            }
        }

        var len = keys.length;
        for (var i = 0; i < len; i++) {
            if (possible[keys[i]]) {

                e.preventDefault();
                this.triggered = true;
                this.app.api(obj.command, { e: e, params: obj.params });
                return;
            }
        }
    },
    _remove: function(keys, obj) {
        return Object.keys(obj).reduce(function(object, key) {
            if (key !== keys) { object[key] = obj[key] };
            return object
        }, {});
    }
});
ArticleEditor.add('module', 'list', {
    init: function() {
        // services
        this.selection = this.app.create('selection');
    },
    indent: function() {
        var sel = this.selection.get();
        var item = this.selection.getBlock();
        var $item = this.dom(item);
        var $prev = $item.prevElement();
        var prev = $prev.get();
        var isIndent = (sel.collapsed && item && prev && prev.tagName === 'LI');

        this.selection.save(item);

        if (isIndent) {
            $prev = this.dom(prev);
            var $prevChild = $prev.children('ul, ol');
            var $list = $item.closest('ul, ol');

            if ($prevChild.length !== 0) {
                $prevChild.append($item);
            }
            else {
                var listTag = $list.get().tagName.toLowerCase();
                var $newList = this.dom('<' + listTag + '>');

                $newList.append($item);
                $prev.append($newList);
            }
        }

        this.selection.restore(item);
    },
    outdent: function() {
        var sel = this.selection.get();
        var item = this.selection.getBlock();
        var $item = this.dom(item);

        if (sel.collapsed && item) {

            var $listItem = $item.parent();
            var $liItem = $listItem.closest('li', '.arx-editor');
            var $prev = $item.prevElement();
            var $next = $item.nextElement();
            var prev = $prev.get();
            var next = $next.get();
            var nextItems, nextList, $newList, $nextList;
            var isTop = (prev === false);
            var isMiddle = (prev !== false && next !== false);
            var isBottom = (!isTop && next === false);

            this.selection.save(item);

            // out
            if ($liItem.length !== 0) {
                if (isMiddle) {
                    nextItems = this._getAllNext($item.get());
                    $newList = this.dom('<' + $listItem.get().tagName.toLowerCase() + '>');

                    for (var i = 0; i < nextItems.length; i++) {
                        $newList.append(nextItems[i]);
                    }

                    $liItem.after($item);
                    $item.append($newList);
                }
                else {
                    $liItem.after($item);

                    if ($listItem.children().length === 0) {
                        $listItem.remove();
                    }
                    else {
                        if (isTop) $item.append($listItem);
                    }
                }
            }

            this.selection.restore(item);
        }
    },

    // private
    _getAllNext: function(next) {
        var nodes = [];

        while (next) {
            var $next = this.dom(next).nextElement();
            next = $next.get();

            if (next) nodes.push(next);
            else return nodes;
        }

        return nodes;
    }
});
ArticleEditor.add('module', 'table', {
    popups: {
        config: {
            name: 'table',
            width: '100%',
            form: {
                width: { type: 'input', label: '## table.width ##' },
                nowrap: { type: 'checkbox', label: '## table.nowrap ##' }
            },
            header: 'Table Cell',
            footer: {
                insert: { title: '## table.save ##', command: 'table.save', type: 'primary' },
                cancel: { title: '## table.cancel ##', command: 'popup.close' }
            }
        },
        head: {
            'add-head': { title: '', icon: true, command: 'table.addHead' },
            'remove-head': { title: '', icon: true, command: 'table.removeHead' }
        },
        row: {
            'row-below': { title: '', icon: true, command: 'table.addRow' },
            'row-above': { title: '', icon: true, command: 'table.addRow' },
            'remove-row': { title: '', icon: true, command: 'table.removeRow' },
        },
        cell: {
            'column-after': { title: '', icon: true, command: 'table.addColumn' },
            'column-before': { title: '', icon: true, command: 'table.addColumn' },
            'remove-column': { title: '', icon: true, command: 'table.removeColumn' },
        }
    },
    init: function() {
        // services
        this.content = this.app.create('content');
    },
    buildPopup: function(name) {
        return this.popups[name];
    },
    observeAdd: function(obj, name) {
        return (this.opts.table) ? obj : false;
    },
    buildConfig: function(args) {
        // popup build
        this.app.popup.build(this.popups.config);
        this.app.popup.open(args.$btn);

        // instance
        var instance = this.app.block.get();

        // width
        var val = instance.getWidth();
        var $input = this.app.popup.getInput('width');
        $input.css('max-width', '120px');
        $input.val(val);
        $input.focus();

        // nowrap
        var nowrap = instance.getNowrap();
        if (nowrap) {
            var $checkbox = this.app.popup.getInput('nowrap');
            $checkbox.attr('checked', true);
        }
    },
    save: function() {
        // popup close
        this.app.popup.close();

        var data = this.app.popup.getData();
        var instance = this.app.block.get();

        if (data.width !== '') {
            instance.setWidth(data.width);
        }

        instance.setNowrap(data.hasOwnProperty('nowrap'));
    },
    addBlock: function() {
        var template = this.content.parse(this.opts.table.template);
        var instance = this.app.create('block.table', template);

        this.app.block.add(instance);
        this.app.popup.close();
    },
    addHead: function() {
        this.removeHead();

        var instance = this.app.block.get();
		var columns = instance.$block.find('tr').first().children('td, th').length;
		var $head = this.dom('<thead>');
        var $row = this._buildRow(columns, '<th>');

        $head.append($row);
        instance.$block.prepend($head);

        // set
        this.app.block.set($row.children('td, th').first());

        // rebuild
        this.app.editor.rebuild();
    },
    addRow: function(args) {
        this.app.popup.close();

        var name = args.name;
        var position = (name === 'row-below') ? 'after' : 'before';
        var instance = this.app.block.get();
        var $row = instance.$block.closest('tr');
        var $head = instance.$block.closest('thead');

        var columns = $row.children('td, th').length;
        var $newRow = this._buildRow(columns, '<td>');
        if ($head.length !== 0) {
            $head.after($newRow);
        }
        else {
            $row[position]($newRow);
        }

        // set focus
        this.app.block.set($newRow.find('td, th').first());

        // rebuild
        this.app.editor.rebuild();
    },
    addColumn: function(args) {
        this.app.popup.close();

        var name = args.name;
        var instance = this.app.block.get();
        var $table = instance.$block.closest('table');
        var $row = instance.$block.closest('tr');

        var index = 0;
        $row.find('td, th').each(function(node, i) {
			if (node === instance.$block.get()) index = i;
		});

		var rowIndex = 0;
        $table.find('tr').each(function(node, i) {
			if (node === $row.get()) rowIndex = i;
		});

        var $newCell;
		$table.find('tr').each(function(node, i) {
			var $node = this.dom(node);
			var cell = $node.find('td, th').get(index);
			var $cell = this.dom(cell);

			var $td = $cell.clone();
			$td.html('');

			if (rowIndex === i) {
    			$newCell = $td;
			}

			if (name === 'column-after') {
    			$cell.after($td);
            }
			else {
    			$cell.before($td);
            }
		}.bind(this));

		// set focus
		if ($newCell) {
    		this.app.block.set($newCell);
		}

        // rebuild
        this.app.editor.rebuild();
    },
    removeHead: function() {
        this.app.popup.close();
        var instance = this.app.block.get();
        var $head = instance.$block.find('thead');
        if ($head.length !== 0) {
            $head.remove();
        }
    },
    removeRow: function() {
        this.app.popup.close();
        var instance = this.app.block.get();
        var $row = instance.$block.closest('tr');
        var rowInstance = this.app.create('block.row', $row);

        rowInstance.remove();
    },
    removeColumn: function() {
        this.app.popup.close();
        var instance = this.app.block.get();
        var $table = instance.$block.closest('table');
        var $row = instance.$block.closest('tr');

        var index = 0;
        $row.find('td, th').each(function(node, i) {
			if (node === instance.$block.get()) index = i;
		});

		$table.find('tr').each(function(node) {
			var $node = this.dom(node);
			var cell = $node.find('td, th').get(index);
			var $cell = this.dom(cell);
            $cell.remove();
		}.bind(this))
    },

    // private
    _buildRow: function(columns, tag) {
        var $row = this.dom('<tr>');
        $row.attr('data-arx-type', 'row');
        for (var i = 0; i < columns; i++) {
            var $cell = this.dom(tag);
            $cell.attr('data-arx-type', 'cell');
            $cell.attr('contenteditable', true);
            $row.append($cell);
        }

        return $row;
    }
});
ArticleEditor.add('module', 'image', {
    popups: {
        config: {
            name: 'image-config',
            width: '100%',
            form: {
                alt: { type: 'input', label: '## image.alt-text ##' },
                url: { type: 'input', label: '## image.link ##' },
                target: { type: 'checkbox', label: '## image.link-in-new-tab ##' }
            },
            header: 'Image',
            footer: {
                'insert': { title: '## image.save ##', command: 'image.save', type: 'primary' },
                'delete': { title: '## image.delete ##', command: 'image.remove', type: 'danger' },
                'cancel': { title: '## image.cancel ##', command: 'popup.close' }
            }
        }
    },
    init: function() {
        // services
        this.utils = this.app.create('utils');
        this.upload = this.app.create('upload');
        this.selection = this.app.create('selection');
        this.insertion = this.app.create('insertion');
    },
    drop: function(e, dt) {
        var files = [];
        for (var i = 0; i < dt.files.length; i++) {
            var file = dt.files[i] || dt.items[i].getAsFile();
            if (file) {
                files.push(file);
            }
        }

        var params = {
            url: this.opts.image.upload,
            name: this.opts.image.name,
            data: this.opts.image.data,
            multiple: this.opts.image.multiple,
            success: 'image.insertByDrop',
            error: 'image.error'
        };

        if (files.length > 0) {

            var $block = this.dom(e.target).closest('[data-arx-type]');
            if ($block.length !== 0) {
                this.app.block.set($block);
            }

            this.upload.send(e, files, params);
        }
    },
    paste: function(blob, e) {
        var params = {
            url: this.opts.image.upload,
            name: this.opts.image.name,
            data: this.opts.image.data,
            multiple: false,
            success: 'image.insertFromBlob',
            error: 'image.error'
        };

        this.upload.send(e, [blob], params);
    },
    observeAdd: function(obj, name) {
        var o = this.opts.image;
        if (!o.select && !o.url && !o.upload) {
            return false;
        }
        else {
            return obj;
        }
    },
    buildConfig: function(args) {

        var $btn = (args) ? args.$btn : false;
        var instance = this.app.block.get();
        var isFocus = true;

        // build popup
        this.app.popup.build(this.popups.config);
        this.app.popup.open($btn);

        // upload
        if (this.opts.image.upload) {
            isFocus = false;

            // form item
            var $formitem = this.dom('<div>');
            $formitem.addClass('form-item form-item-image-upload');

            // image
            var $imageclone = instance.getImage().clone();
            var $imageitem = this.dom('<div>');
            $imageitem.addClass('form-item-image');
            $imageitem.append($imageclone);
            $formitem.append($imageitem);

            // upload item
            this.$uploaditem = this.dom('<div>');
            this.$uploaditem.addClass('arx-popup-upload');
            $formitem.append(this.$uploaditem);

            // append to popup
            var $popup = this.app.popup.getBody();
            $popup.prepend($formitem);

            // build upload
            this._buildUpload(this.$uploaditem, 'image.change');
            this.upload.setPlaceholder(this.lang.get('image.upload-new-placeholder'));
        }

        // set alt
        var alt = instance.getAlt();
        var $input = this.app.popup.getInput('alt');
        $input.val(alt);
        if (isFocus) {
            $input.focus();
        }

        // set link
        var link = instance.getLink();
        if (link) {
            var $input = this.app.popup.getInput('url');
            $input.val(link.url);

            if (link.target) {
                var $checkbox = this.app.popup.getInput('target');
                $checkbox.attr('checked', true);
            }
        }

    },
    save: function() {
        // popup close
        this.app.popup.close();

        var data = this.app.popup.getData();
        var instance = this.app.block.get();

        if (data.alt !== '') {
            instance.setAlt(data.alt);
        }

        if (data.url !== '') {
            var link = {
                url: data.url,
                target: (data.hasOwnProperty('target'))
            };

            instance.setLink(link);
        }
        else {
            instance.removeLink();
        }

    },
    remove: function() {
        // popup close
        this.app.popup.close();
        this.app.block.remove();
    },
    buildPopup: function(args) {
        // build popup
        this.app.popup.build({ name: 'image', type: 'box', dark: true, width: '100%', });
        this.app.popup.open(args.$btn);

        var $popup = this.app.popup.getBody();

        if (this.opts.image.url) {
            // url input
            this.$urlinput = this.dom('<input>');
            this.$urlinput.addClass('arx-form-input arx-form-input-on-dark');
            this.$urlinput.attr('placeholder', this.lang.get('image.url-placeholder'));

            this.$urlbutton = this.dom('<button>');
            this.$urlbutton.addClass('arx-form-button arx-form-button-secondary');
            this.$urlbutton.html(this.lang.get('image.insert'));
            this.$urlbutton.one('click', this.insertByUrl.bind(this));

            var $formitem = this.dom('<div>');
            $formitem.addClass('arx-form-item-flex');

            $formitem.append(this.$urlinput);
            $formitem.append(this.$urlbutton);


            $popup.append($formitem);
            this.$urlinput.focus();
        }

        if (this.opts.image.url && (this.opts.image.upload || this.opts.image.select)) {
            // section or
            var $section = this.dom('<div>');
            $section.addClass('arx-form-section-or');
            $section.html(this.lang.get('image.or'));
            $popup.append($section);
        }

        if (this.opts.image.upload) {
            // upload item
            this.$uploaditem = this.dom('<div>');
            this.$uploaditem.addClass('arx-popup-upload');
            $popup.append(this.$uploaditem);
        }

        // list of images
        if (this.opts.image.select) {

            // images box
            this.$box = this.dom('<div>');
            this.$box.addClass('arx-popup-images-box');
            $popup.append(this.$box);

            if (typeof this.opts.image.select === 'object') {
                this._parseList(this.opts.image.select);
            }
            else {
                this.ajax.get({
                	url: this.opts.image.select,
                	data: { d: new Date().getTime() },
                    success: this._parseList.bind(this)
                });
            }

        }

        // build upload
        this._buildUpload(this.$uploaditem, 'image.insert');
    },
    insertByUrl: function(e) {
        e.preventDefault();

        var instance = this.app.block.get();
        var str = this.$urlinput.val();
        if (str.trim() === '') {
            this.app.popup.close();
            return;
        }

        var response = {
            file: {
                url: str
            }
        };

        this.selection.restore(instance.$block);
        this.insert(response);
    },
    insertByDrop: function(response, e) {
        var position;
        if (this.app.block.is()) {
            position = false;
            var instance = this.app.block.get();
            if (e && instance.isEditable()) {
                this.insertion.insertPoint(e);
            }
            else if (instance.getType() === 'image') {
                return this.change(response);
            }
        }
        else {
            position = 'start';
        }

        this.insert(response, e, position);
    },
    insertFromBlob: function(response) {
        var instance = this.app.block.get();
        this.selection.restore(instance.$block);
        this.insert(response);
    },
    insertFromSelect: function(e) {
        e.preventDefault();

        var instance = this.app.block.get();
        var $el = this.dom(e.target);
        var str = $el.attr('data-url');
        var response = {
            file: {
                url: str
            }
        };

        this.selection.restore(instance.$block);
        this.insert(response);

    },
    change: function(response) {
        // popup close
        this.app.popup.close();

        var instance = this.app.block.get();
        for (var key in response) {
            instance.setImage(response[key]);
            this.app.broadcast('image.change', { response: response });
            return;
        }
    },
    insert: function(response, e, position) {
        // popup close
        this.app.popup.close();

        // insert
        this.imageslen = 0;
        this.imagescount = 0;
        var tag = this.opts.image.tag;
        for (var key in response) {

            var $figure = this.dom('<' + tag + '>');

            if (tag === 'figure') {
                var $figcaption = this.dom('<figcaption>');
                $figcaption.attr('data-arx-type', 'figcaption');
                $figcaption.attr('contenteditable', true);
                $figcaption.attr('data-placeholder', this.lang.get('placeholders.figcaption'));
            }

            var $image = this.dom('<img>');
            $image.attr('src', response[key].url);
            if (response[key].hasOwnProperty('id')) {
                $image.attr('data-image', response[key].id);
            }
            $image.one('load', this._checkLoad.bind(this));

            $figure.append($image);

            if (tag === 'figure') {
                $figure.append($figcaption);
            }

            var instance = this.app.create('block.image', $figure);
            this.app.block.add(instance, position);
            this.$last = instance.$block;
            this.imageslen++;
        }
    },
    error: function(response) {
        this.app.broadcast('image.upload.error', { response: response });
    },

    // private
    _buildUpload: function($item, callback, sendCallback) {
        if (this.opts.image.upload) {
            var params = {
                url: this.opts.image.upload,
                name: this.opts.image.name,
                data: this.opts.image.data,
                multiple: this.opts.image.multiple,
                success: callback,
                error: 'image.error'
            };

            this.upload.build($item, params);
        }
    },
    _checkLoad: function() {
        this.imagescount++;
        if (this.imagescount === this.imageslen) {
            this.app.block.unset();
            this.app.block.set(this.$last);
            if (this.imagescount > 1) {
                this.utils.scrollToElement(this.$last);
            }
        }
    },
    _parseList: function(data) {
        for (var key in data) {
            var obj = data[key];
            if (typeof obj !== 'object') continue;

            var $img = this.dom('<img>');
            var url = (obj.thumb) ? obj.thumb : obj.url;

            $img.addClass('arx-popup-event');
            $img.attr('src', url);
            $img.attr('data-url', obj.url);
            $img.on('click.arx-popup-event-' + this.uuid, this.insertFromSelect.bind(this));

			this.$box.append($img);
        }
	}
});
ArticleEditor.add('module', 'embed', {
    popups: {
        edit: {
            name: 'embed',
            width: '100%',
            form: {
                embed: { type: 'textarea', label: '## embed.description ##', attr: { rows: 6 } },
                responsive: { type: 'checkbox', label: '## embed.responsive-video ##' }
            },
            header: '## embed.embed ##',
            footer: {
                insert: { title: '## embed.insert ##', command: 'embed.insert', type: 'primary' },
                cancel: { title: '## embed.cancel ##', command: 'popup.close' }
            }
        }
    },
    init: function() {
        // services
        this.utils = this.app.create('utils');
        this.content = this.app.create('content');
    },
    start: function() {
        this.app.control.add('editembed', { iconname: 'edit', command: 'embed.edit', title: '## command.edit ##', blocks: ['embed'] });
    },
    observeAdd: function(obj, name) {
        return (this.opts.embed) ? obj : false;
    },
    buildPopup: function() {
        // build popup
        this.app.popup.build(this.popups.edit);
        this.app.popup.open();

        // set focus
        var $input = this.app.popup.getInput('embed');
        $input.focus();

        // codemirror
        this.utils.createCodemirror($input);
    },
    edit: function() {
        // build popup
        this.app.popup.build(this.popups.edit);
        this.app.popup.open();

        this.app.popup.setButton('insert', {
            name: 'save',
            title: '## embed.save ##',
            command: 'embed.save'
        });

        var instance = this.app.block.get();
        var code = decodeURI(instance.$block.attr('data-embed-code'));
        var $responsive = instance.$block.find('.' + this.opts.embed.responsive);
        var isResponsive = ($responsive.length !== 0);

        if (isResponsive) {
            var $checkbox = this.app.popup.getInput('responsive');
            $checkbox.attr('checked', true);
        }

        var $input = this.app.popup.getInput('embed');
        $input.val(code);
        $input.focus();

        // codemirror
        this.utils.createCodemirror($input);

    },
    save: function() {
        this._insert(true);
    },
    insert: function() {
        this._insert();
    },

    // private
    _insert: function(change) {
        this.app.popup.close();

        var data = this.app.popup.getData();
        var str = data.embed;

        str = this.utils.sanitize(str);

        // codemirror
        str = this.utils.getCodemirrorValue(str);

        if (str === '') {
            if (change) {
                this.app.block.remove();
            }
            return;
        }

        var current = this.app.block.get();
        var parsed = (this._isHtmlString(str)) ? this._parseUrl(str) : str;

        if (parsed) {
            // responsive
            if (data.hasOwnProperty('responsive')) {
                parsed = '<div class="' + this.opts.embed.responsive + '">' + parsed + '</div>'
            }

            // figcaption
            if (change && current) {
                var $figcaption;
                var $el = current.$block.find('figcaption');
                if ($el.length !== 0) {
                    $figcaption = $el.clone();
                }

                if ($figcaption) {
                    parsed = parsed + $figcaption.get().outerHTML;
                }
            }

            parsed = '<figure>' + parsed + '</figure>'

            this._addBlock(data, parsed, change);
        }
    },
    _addBlock: function(data, parsed, change) {
        var template = this.content.parse(parsed);
        var instance = this.app.create('block.embed', template);

        if (change) {
            this.app.block.change(instance);
        }
        else {
            this.app.block.add(instance);
        }

        this.app.editor.executeEmbed();
    },
    _parseUrl: function(str) {
        var iframeStart = '<iframe width="560" height="315" src="';
        var iframeEnd = '" frameborder="0" allowfullscreen></iframe>';
        var parsed;

        if (str.match(this.opts.regex.youtube)) {
            parsed = str.replace(this.opts.regex.youtube, '//www.youtube.com/embed/$1');
            return iframeStart + parsed + iframeEnd;
        }
        else if (str.match(this.opts.regex.vimeo)) {
            parsed = str.replace(this.opts.regex.vimeo, '//player.vimeo.com/video/$2');
            return iframeStart + parsed + iframeEnd;
        }

    },
    _isHtmlString: function(str) {
        return !/^\s*<(\w+|!)[^>]*>/.test(str);
    },
    _isFigure: function(str) {
        return /^<figure/.test(str);
    }
});
ArticleEditor.add('module', 'grid', {
    init: function() {
        // services
        this.utils = this.app.create('utils');
        this.button = this.app.create('button');
    },
    observeAdd: function(obj, name) {
        return (this.opts.grid) ? obj : false;
    },
    buildPopup: function() {
        // build popup
        this.app.popup.build({
            name: 'grid',
            type: 'tile',
            box: true,
            width: '294px',
            header: '## blocks.grid ##'
        });

        this.app.popup.open();

        // create patterns
        var $popup = this.app.popup.getBody();
        var patterns = this.opts.grid.patterns;
        for (var i = 0; i < patterns.length; i++) {

            var obj = {
                command: 'grid.insert',
                icon: '<span class="arx-popup-s-grid">' + this._createPattern(patterns[i]) + '</span>',
                params: { pattern: patterns[i] }
            };

            this.button.create(i, obj, $popup, 'popup');
        }
    },
    transform: function() {
        this.app.popup.close();

        var instance = this.app.block.get();
        var $columns = instance.$block.find('[data-arx-type=column]');
        $columns.nodes.reverse();
        $columns.each(function(node) {
            var $node = this.dom(node);
            instance.$block.after($node.contents());
        }.bind(this));

        var next = this.app.block.next();

        // rebuild
        this.app.editor.rebuild();

        // remove
        instance.$block.remove();

        // set
        if (next) {
            this.app.block.set(next.$block);
        }

    },
    insert: function(args) {
        var pattern = args.params.pattern;
        var columns = pattern.split('|');

        // grid
        var $grid = this.dom('<div>');
        $grid.attr('data-arx-type', 'grid');
        $grid.addClass(this.opts.grid.classname);

        // columns
        for (var i = 0; i < columns.length; i++) {
            var $column = this.dom('<div>');
            $column.addClass(this.opts.grid.columns.classname);
            $column.addClass(this.opts.grid.columns.prefix + columns[i]);
            $column.attr('data-arx-type', 'column');

            $grid.append($column);
        }

        // insert
        var instance = this.app.create('block.grid', $grid);
        this.app.block.add(instance);

        this.app.popup.close();
    },

    // private
    _createPattern: function(pattern) {
        var $item = this.dom('<div>');
        var columns = pattern.split('|');
        var sum = this.utils.sumOfArray(columns);
        var unit = 100/sum;

        for (var i = 0; i < columns.length; i++) {
            var $column = this.dom('<span>');
            $column.addClass('arx-popup-s-column');
            $column.css('width', (columns[i] * unit) + '%');

            $item.append($column);
        }

        return $item.html();
    }
});
ArticleEditor.add('module', 'code', {
    popups: {
        edit: {
            name: 'code',
            width: '100%',
            form: {
                code: { type: 'textarea', attr: { rows: 8 } }
            },
            header: '## code.code ##',
            footer: {
                insert: { title: '## code.insert ##', command: 'code.insert', type: 'primary' },
                cancel: { title: '## code.cancel ##', command: 'popup.close' }
            }
        }
    },
    init: function() {
        // services
        this.utils = this.app.create('utils');
        this.content = this.app.create('content');
    },
    start: function() {
        this.app.control.add('editcode', { iconname: 'edit', command: 'code.edit', title: '## command.edit ##', blocks: ['code'] });
    },
    observeAdd: function(obj, name) {
        return (this.opts.code) ? obj : false;
    },
    buildPopup: function() {
        // build popup
        this.app.popup.build(this.popups.edit);
        this.app.popup.open();

        var $input = this.app.popup.getInput('code');
        $input.addClass('arx-popup-event');
        $input.on('keydown.arx-popup-event-' + this.uuid, this._handleTab.bind(this));
        $input.focus();

        // codemirror
        this.utils.createCodemirror($input, this.opts.code);
    },
    edit: function() {
        // build popup
        this.app.popup.build(this.popups.edit);
        this.app.popup.open();

        this.app.popup.setButton('insert', {
            name: 'save',
            title: '## code.save ##',
            command: 'code.save'
        });

        var instance = this.app.block.get();
        var $code = instance.$block.find('code');
        var code = ($code.length === 0) ? instance.$block.html() : $code.html();

        code = this.content.decodeEntities(code);

        var $input = this.app.popup.getInput('code');
        $input.addClass('arx-popup-event');
        $input.on('keydown.arx-popup-event-' + this.uuid, this._handleTab.bind(this));
        $input.val(code);
        $input.focus();

        // codemirror
        this.utils.createCodemirror($input, this.opts.code);
    },
    save: function() {
        this._insert(true);
    },
    insert: function() {
        this._insert();
    },

    // private
    _insert: function(change) {
        this.app.popup.close();

        var data = this.app.popup.getData();
        var str = data.code;

        // codemirror
        str = this.utils.getCodemirrorValue(str, this.opts.code);

        if (str === '') {
            if (change) {
                var instance = this.app.block.get();
                var $code = instance.$block.find('code');
                var $target = ($code.length === 0) ? instance.$block : $code;
                $target.attr('data-placeholder', this.lang.get('placeholders.code'));
                $target.html('');
                this.app.popup.close();

                return;
            }
        }

        var $el = this.dom(this.opts.code.template);
        var $code = $el.find('code');
        $code = ($code.length === 0) ? $el : $code;

        // encode
        str = this.content.encodeEntities(str);
        $code.html(str);

        var instance = this.app.create('block.code', $el);

        if (change) {
            this.app.block.change(instance);
        }
        else {
            this.app.block.add(instance);
        }
    },
    _handleTab: function(e) {
        if (e.keyCode !== 9) return true;

        e.preventDefault();

        var el = e.target;
        var val = el.value;
        var start = el.selectionStart;

        el.value = val.substring(0, start) + "    " + val.substring(el.selectionEnd);
        el.selectionStart = el.selectionEnd = start + 4;
    }
});
ArticleEditor.add('module', 'snippet', {
    init: function() {
        // local
        this.key = false;
        this.json = {};

        // services
        this.button = this.app.create('button');
        this.content = this.app.create('content');
    },
    observeAdd: function(obj, name) {
        return (this._is()) ? obj : false;
    },
    buildPopup: function(args) {
        if (this._isJson()) {
            this._buildPopupPreview(args);
        }
        else {
            this._buildPopupList(args);
        }
    },
    insert: function(e) {
        var $trigger = this.dom(e.target).closest('.arx-snippet-trigger');
        var key = $trigger.attr('data-snippet-key');

        if (this.json.hasOwnProperty(key)) {
            this.app.popup.close();

            var html = this.json[key].html;
            var snippet = this.content.parse(html);
            var instance = this.app.create('block.snippet', snippet);
            this.app.block.add(instance);
        }
    },

    // private
    _buildPopupList: function(args) {

        this.app.popup.build({
            name: 'snippet-list',
            list: true
        });
        this.app.popup.open(args.$btn);

        var $popup = this.app.popup.getBody();
        var snippets = this.opts.snippets.items;

        for (var key in snippets) {
            var obj = {
                title: snippets[key],
                text: true,
                icon: false,
                command: 'snippet._insertOld'
            };

            this.button.create(key, obj, $popup, 'popup');
        }
    },
    _buildPopupPreview: function(args) {
        // items
        if (this.opts.snippets.hasOwnProperty('items')) {
            this._buildPopupList(args);
        }
        else {
            // json url
            if (typeof this.opts.snippets.json === 'string') {
                this.ajax.get({
                    url: this.opts.snippets.json,
                    data: { d: new Date().getTime() },
                    success: function(data) {
                        this._buildPreview(args, data);
                    }.bind(this)
                });
            }
            // json object
            else {
                this._buildPreview(args, this.opts.snippets.json);
            }
        }
    },
    _buildPreview: function(args, data) {
        this.app.popup.build({
            name: 'snippet',
            header: '## snippets.snippets ##',
            width: '100%'
        });
        this.app.popup.open(args.$btn);

        var $popup = this.app.popup.getBody();
        this.json = data;
        if (typeof data === 'string') {
            this.json = JSON.parse(data);
        }

        for (var key in this.json) {

            var $container = this.dom('<div>');
            $container.addClass('arx-snippet-preview-container arx-snippet-trigger');
            $container.attr('data-snippet-key', key);
            $container.on('click.arx-snippets', this.insert.bind(this));

            var $div = this.dom('<div>');
            var html = this.json[key].html;
            $div.html(html);
            $div.addClass('arx-reset arx-content arx-snippet-preview');
            $container.append($div);

            if (this.json[key].hasOwnProperty('name')) {
                var $span = this.dom('<div>');
                $span.addClass('arx-snippet-preview-name');
                $span.text(this.json[key].name);
                $container.append($span);
            }

            $popup.append($container);
        }

    },
    _is: function() {
        return (this.opts.snippets.url || this.opts.snippets.json);
    },
    _isJson: function() {
        return (this.opts.snippets.json && this.opts.snippets.json !== true);
    },
    _getUrl: function() {
        var url = this.opts.snippets.url;
        if (!this.opts.snippets.json) {
            url = url + this.key + '.html';
        }
        return url;
    },
    _request: function() {
        this.ajax.get({
            url: this._getUrl(),
            data: { d: new Date().getTime() },
            success: this._insert.bind(this)
        });
    },
    _insertOld: function(args) {
        this.app.popup.close();

        // snippet key
        this.key = args.name;

        if (typeof this.opts.snippets.json === 'object') {
            this._insert(this.opts.snippets.json);
        }
        else {
            this._request();
        }
    },
    _insert: function(data) {
        var html = false;
        if (this.opts.snippets.json) {
            for (var key in data) {
                if (key === this.key) {
                    html = data[key].html;
                    break;
                }
            }
        }
        else {
            html = data;
        }

        if (html !== false) {
            var snippet = this.content.parse(html);
            var instance = this.app.create('block.snippet', snippet);
            this.app.block.add(instance);
        }

        this.key = false;
    }
});
ArticleEditor.add('service', 'button', {
    create: function(name, obj, $container, type) {
        obj = this._build(obj);
        if (obj) {
            this.type = type || 'toolbar';

            return this._create(name, obj, $container);
        }
    },
    set: function($el, name, obj, type) {
        obj = this._build(obj);
        if (obj) {
            this.type = type;

            return this._create(name, obj, false, $el);
        }
    },

    // private
    _build: function(obj) {
        if (obj.hasOwnProperty('popup')) {
            obj = this._buildPopupButtons(obj);
        }

        return obj;
    },
    _buildPopupButtons: function(obj) {
        var counter = 0;
        obj.command = 'toolbar.popup';

        // popup builder
        if (obj.popup.hasOwnProperty('builder')) {
            obj.popup.buttons = this.app.api(obj.popup.builder);
            counter += Object.keys(obj.popup.buttons).length;
        }
        // buttons
        else {
            for (var name in obj.popup) {
                var button = obj.popup[name];
                if (typeof button !== 'object') continue;

                if (button.hasOwnProperty('builder')) {
                    obj.popup[name].buttons = this.app.api(button.builder, name);
                    if (obj.popup[name].buttons) {
                        counter += Object.keys(obj.popup[name].buttons).length;
                    }
                }
                else {
                    counter++;
                }
            }
        }

        return (counter === 0) ? false : obj;
    },
    _create: function(name, obj, $container, $el) {
        // observe
        var res = this._observe(obj, name);
        if (res === false) {
            return;
        }
        else if (typeof res === 'undefined') {
            this.obj = obj;
        }
        else {
            this.obj = res;
        }

        // name
        this.name = name;

        // build
        this._buildTitle();
        this._buildElement($el);

        this.$button.attr({
            'data-name': this.name,
            'data-command': this.obj.command || false
        });

        // button obj
        this.$button.dataset('button', this.obj);

        // params
        if (this._has('params')) {
            this.$button.dataset('params', this.obj.params);
        }

        // disable dragging
        this.$button.on('dragstart.arx-button-' + this.uuid, function(e) { e.preventDefault(); return; });

        // click
        var func = (this._has('command')) ? '_catch' : '_stop';
        this.$button.on('click.arx-button-' + this.uuid, this[func].bind(this));

        if ($container) {
            this._buildTooltip();
            this._buildHidden();
            this._buildDivider();
            this._buildSize();
            this._buildIcon();
            this._buildText();
            this._buildPosition($container);
            this._buildActive();
        }

        return this.$button;
    },
    _buildTitle: function() {
        this.title = (typeof this.obj.title !== 'undefined') ? this.lang.parse(this.obj.title) : '';
    },
    _buildElement: function($el) {
        if ($el) {
            this.$button = $el;
        }
        else {
            this.$button = this.dom('<a href="#"></a>');
            this.$button.addClass('arx-button');
            this.$button.addClass('arx-button-' + this.type);
        }

        this.$button.addClass('arx-button-target');
    },
    _buildHidden: function() {
        var isHidden = (this._has('hidden') && this.obj.hidden === true);
        var func = (isHidden) ? 'addClass' : 'removeClass';

        this.$button[func]('arx-button-hidden');
    },
    _buildTooltip: function() {
        var tooltip = (this.title) ? this.title.replace(/(<([^>]+)>)/gi, '') : false;

        if (tooltip && this.type === 'toolbar') {
            this.$button.attr('data-tooltip', tooltip);
            this.$button.on('mouseover.arx-button-' + this.uuid, this._showTooltip.bind(this));
            this.$button.on('mouseout.arx-button-' + this.uuid, this._hideTooltip.bind(this));
        }
    },
    _buildDivider: function() {
        if (this._has('topdivider')) {
            this.$button.addClass('arx-button-top-divider');
        }
        if (this._has('bottomdivider')) {
            this.$button.addClass('arx-button-bottom-divider');
        }
    },
    _buildSize: function() {
        if (this._has('size')) {
            this.$button.css('font-size', this.obj.size + 'px');
        }
    },
    _buildIconElement: function() {
        return this.dom('<span>').addClass('arx-button-icon');
    },
    _buildIcon: function() {
        var $icon;
        var isIcon = this._has('icon');

        if (!isIcon || isIcon && this.obj.icon === true) {

            var iconname = (this._has('iconname')) ? this.obj.iconname : this.name;

            $icon = this._buildIconElement();
            $icon.append('<span class="arx-icon-' + iconname + '"></span>');
        }
        else if (isIcon) {
            if (this.obj.icon === false) {
                return;
            }
            else {
                $icon = this._buildIconElement();
                $icon.append(this.obj.icon);
            }
        }


        this.$button.append($icon);
    },
    _buildText: function() {
        var isText = (this._has('text') && this.obj.text !== false);
        if (isText) {
            var $title = this.dom('<span>').addClass('arx-button-title').html(this.title);
            this.$button.append($title);
        }
    },
    _buildPosition: function($container) {
        if (this._has('position')) {
            if (this.obj.position === 'first') {
                $container.prepend(this.$button);
            }
            else if (typeof this.obj.position === 'object') {
                var type = (this.obj.position.hasOwnProperty('after')) ? 'after' : 'before';
                var button = this.obj.position[type];
                var $el = $container.find('[data-name=' + button + ']');
                if ($el.length !== 0) {
                    $el[type](this.$button);
                }
                else {
                    $container.append(this.$button);
                }
            }
        }
        else {
            $container.append(this.$button);
        }
    },
    _buildActive: function() {
        if (this.obj.active) {
            this.$button.addClass('active');
        }
    },
    _showTooltip: function(e) {
        if (this.app.popup.isOpen()) {
            return;
        }

        var $btn = this.dom(e.target).closest('.arx-button-target');
        var isControl = $btn.hasClass('arx-button-control');
        var offset = $btn.offset();
        var height = $btn.height();
        var width = $btn.width();

        var $tooltip = this.dom('<span>');
        $tooltip.addClass('arx-tooltip');
        $tooltip.html($btn.attr('data-tooltip'));

        if (isControl) {
            height = 0;
        }
        else {
            width = 0;
        }

        $tooltip.css({
            top: (offset.top + height) + 'px',
            left: (offset.left + width) + 'px'
        });

        // bs modal
        if (this.opts.bsmodal) {
            $tooltip.css('z-index', 1051);
        }

        this.app.$body.append($tooltip);

    },
    _hideTooltip: function() {
        this.app.$body.find('.arx-tooltip').remove();
    },
    _observe: function(obj, name) {
        if (obj.hasOwnProperty('observer')) {
            obj = this.app.api(obj.observer, obj, name);
        }

        return obj;
    },
    _stop: function(e) {
        e.preventDefault();
        e.stopPropagation();
    },
    _catch: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var $btn = this.dom(e.target).closest('.arx-button-target');
        if ($btn.hasClass('disable')) return;

        var command = $btn.attr('data-command');
        var name = $btn.attr('data-name');
        var params = $btn.dataget('params');
        var button = $btn.dataget('button');

        // command
        this._hideTooltip();
        this.app.buffer.add();
        this.app.api(command, { e: e, name: name, $btn: $btn, button: button, params: params });
    },
    _has: function(name) {
        return this.obj.hasOwnProperty(name);
    }
});
ArticleEditor.add('service', 'caret', {
    init: function(element) {
    },
    set: function(type, el) {
        var $el = this.dom(el);
        var node = $el.get();
        if (!node) return false;

        this._apply(type, node);
    },
    is: function(type, el) {
        var $el = this.dom(el);
        var node = $el.get();
        if (!node) return false;

        var selection = window.getSelection();
        if (!selection.isCollapsed) return false;

        var parent = selection.anchorNode.parentNode;
        var position = this._getCaretPosition(node);
        var size = this._getNodeSize(node);


        if (type === 'end') {
            return (position === size);
        }
        else if (type === 'start') {
            var utils = this.app.create('utils');
            if (position === 1 && parent && utils.isInline(parent)) {
                position = 0;
            }

            return (position === 0);
        }

        return false;
    },

    // private
    _apply: function(type, node) {
        if (!this._isInPage(node)) return;

        var range = document.createRange();
        var tag = (node.nodeType !== 3) ? node.tagName.toLowerCase() : false;

        if (type === 'start') {
            range.setStart(node, 0);
            range.collapse(true);

            var utils = this.app.create('utils');
            if (utils.isInline(node)) { // || utils.isEmpty(node))
                var textNode = utils.createInvisibleChar();
                range.insertNode(textNode);
                range.selectNodeContents(textNode);
                range.collapse(false);
            }
        }
        else if (type === 'end') {
            range.selectNodeContents(node);
            range.collapse(false);
        }
        else if (type === 'before') {
            range.setStartBefore(node);
            range.collapse(true);

            var utils = this.app.create('utils');
            if (utils.isInline(node)) {
                var textNode = utils.createInvisibleChar();
                node.parentNode.insertBefore(textNode, node);
                range.selectNodeContents(textNode);
                range.collapse(false);
            }
        }
        else if (type === 'after') {

            range.setStartAfter(node);
            range.collapse(true);

            if (tag === 'br' || tag === 'svg' || tag === 'span') {
                var utils = this.app.create('utils');
                var textNode = utils.createInvisibleChar();
                range.insertNode(textNode);
                range.selectNodeContents(textNode);
                range.collapse(false);
            }
        }

        var selection = this.app.create('selection');
        selection.setRange(range);
    },
    _getNodeSize: function(node) {
        var str = (node.nodeType === 3) ? node.textContent : node.innerHTML;
        return this._getTrimmedString(str).length;
    },
    _getCaretPosition: function(node) {
        var range = window.getSelection().getRangeAt(0);
        var preCaretRange = range.cloneRange();
        var tmp = document.createElement("div");

        preCaretRange.selectNodeContents(node);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        tmp.appendChild(preCaretRange.cloneContents());

        var str = tmp.innerHTML;
        str = this._getTrimmedString(str);

        return str.length;
    },
    _getTrimmedString: function(str) {

        var inline = this.opts.tags.inline.join('|');

        str = str.replace(/\xA0|\u00A0|\u2028|\u2029/g, '1');
        str = str.replace(new RegExp('<[' + inline + '][^>]*><\/[' + inline + ']>', 'gi'), '1');
        str = str.replace(/<[^\/>][^>]*><\/[^>]+>/gi, '');
        str = str.replace(/<\/?br\s?\/?>/g, '1');
        str = str.replace(/<img(.*?)>/g, '1');
        str = str.replace(/<[^\/>][^>]*>/gi, '');
        str = str.replace(/<\/[^>]+>/gi, '');
        str = str.replace(/&nbsp;/gi, '1');
        str = str.replace(/\s+/g, ' ');
        str = str.replace(/\t/g, ' ');
        str = str.replace(/\n/g, '1');
        str = str.trim();

        return str;
    },
    _isInPage: function(node) {
        if (node && node.nodeType) {
            return (node === document.body) ? false : document.body.contains(node);
        }

        return false;
    }
});
ArticleEditor.add('service', 'content', {
    init: function() {
        // local
        this.blockTags = this._buildBlockTags();
        this.blockListTags = this._buildBlockListTags();
        this._stored = {};
        this._storedIndex = 0;
    },
    isLineText: function(html) {
        var element = document.createElement("div");
        element.innerHTML = html;

        return (this.dom(element).find(this.opts.tags.block.join(',')).length === 0);
    },
    isPlainLine: function(html) {
        var element = document.createElement("div");
        element.innerHTML = html;

        var $wrapper = this.dom(element);
        $wrapper.find('p, div.' + this.opts.plaintext.classname).unwrap();

        return ($wrapper.find(this.opts.tags.block.join(',')).length === 0);
    },
    getPlainLine: function(html) {
        html = html.replace(/<\/div>|<\/li>|<\/td>|<\/p>|<\/H[1-6]>/gi, '<br><br>');
        html = this.removeTags(html, this.opts.tags.block);

        return '<br>' + html;
    },
    isClipboardPlainText: function(clipboard) {
        var text = clipboard.getData("text/plain");
        var html = clipboard.getData("text/html");

        if (text && html) {
            var element = document.createElement("div");
            element.innerHTML = html;

            if (element.textContent === text) {
                return !element.querySelector(":not(meta)");
            }
        }
        else {
            return (text !== null);
        }
    },
    paragraphize: function(html) {
        var paragraphize = this.app.create('paragraphize');

        return paragraphize.parse(html);
    },
    autolink: function(html) {

        if (!this.opts.paste.autolink) {
            return html;
        }

        var tags = ['figure', 'form', 'pre', 'iframe', 'code', 'a', 'img'];
        var stored = [];
        var z = 0;


        // store tags
        for (var i = 0; i < tags.length; i++) {
            var reTags = (tags[i] === 'img') ? '<' + tags[i] + '[^>]*>' : '<' + tags[i] + '[^>]*>([\\w\\W]*?)</' + tags[i] + '>';
            var matched = html.match(new RegExp(reTags, 'gi'));

            if (matched !== null) {
                for (var y = 0; y < matched.length; y++) {
                    html = html.replace(matched[y], '#####replaceparse' + z + '#####');
                    stored.push(matched[y]);
                    z++;
                }
            }
        }

        // links
        html = html.replace('&amp;', '&');
        if (html.match(this.opts.regex.url) && !html.match(this.opts.regex.imageurl)) {
            html = this._formatLinks(html);
        }

        // restore
        html = this._restoreReplaced(stored, html);

        // repeat for nested tags
        html = this._restoreReplaced(stored, html);

        return html;
    },
    clean: function(html) {

        // gdocs & word
        var isMsWord = this._isHtmlMsWord(html);
        var isPages = this._isPages(html);

        html = this.storeComponents(html);

        // remove doctype tag
        html = html.replace(new RegExp("<\!doctype[^>]*>", 'gi'), '');

        // remove denied
        html = this.removeTags(html, this.opts.tags.denied);

        // remove style tag
        html = html.replace(new RegExp("<style([\\s\\S]+?)</style>", 'gi'), '');

        html = this._cleanGDocs(html);
        html = (isMsWord) ? this._cleanMsWord(html) : html;
        html = (isPages) ? this._cleanPages(html) : html;

        // do not clean
        if (!this.opts.paste.clean) {
            html = this.restoreComponents(html);
            return html;
        }

        // plain text
        if (this.opts.paste.plaintext) {
            html = this.restoreComponents(html);
            return this.parsePlainText(html);
        }

        // remove tags
        var exceptedTags = this.opts.paste.blockTags.concat(this.opts.paste.inlineTags).concat(this.opts.paste.formTags);
        html = this.removeTagsExcept(html, exceptedTags);

        // links & images
        html = (this.opts.paste.links) ? html : this.removeTags(html, ['a']);
        html = (this.opts.paste.images) ? html : this.removeTags(html, ['img']);

        // build wrapper
        var utils = this.app.create('utils');
        var $wrapper = utils.createWrapper(html);

        // clean attrs
        var $elms = $wrapper.find('*');

        // remove style
        var filterStyle = (this.opts.paste.keepStyle.length !== 0) ? ',' + this.opts.paste.keepStyle.join(',') : '';
        $elms.not('[data-arx-style-cache]' + filterStyle).removeAttr('style');


        // paste link target
        if (this.opts.paste.links && this.opts.paste.linkTarget !== false) {
            $wrapper.find('a').attr('target', this.opts.paste.linkTarget);
        }

        // keep style
        $wrapper.find('[data-arx-style-cache]').each(function(node) {
            var style = node.getAttribute('data-arx-style-cache');
            node.setAttribute('style', style);
        });

        // remove empty span
        $wrapper.find('span').each(this.removeEmptySpan.bind(this));

        // remove empty inline
        $wrapper.find(this.opts.tags.inline.join(',')).each(function(node) {
            if (node.attributes.length === 0 && utils.isEmptyHtml(node.innerHTML)) {
                this.dom(node).unwrap();
            }
        }.bind(this));

        // place ul/ol into li
        $wrapper.find('ul, ol').each(function(node) {
            var prev = node.previousSibling;
            if (prev && prev.tagName === 'LI') {
                var $li = this.dom(prev);
                $li.find('p').unwrap();
                $li.append(node);
            }
        }.bind(this));

        // remove p in li
        $wrapper.find('li p').unwrap();

        // get wrapper
        html = utils.getWrapperHtml($wrapper);

        // autolink
        html = this.autolink(html);

        // remove br between
        //html = html.replace(new RegExp("</p><br\\s?/?><p", 'gi'), '</p><p');
        //html = html.replace(new RegExp("</p><br\\s?/?><ul", 'gi'), '</p><ul');
        //html = html.replace(new RegExp("</p><br\\s?/?><ol", 'gi'), '</p><ol');

        // clean empty p
        html = html.replace(/<p>&nbsp;<\/p>/gi, '<p></p>');
        html = html.replace(/<p><br\s?\/?><\/p>/gi, '<p></p>');

        if (isMsWord) {
            html = html.replace(/<p><\/p>/gi, '');
            html = html.replace(/<p>\s<\/p>/gi, '');
        }

        html = this.restoreComponents(html);

        // create wrapper
        var $wrapper = utils.createWrapper(html);

        // remove image attributes
        var imageattrs = ['alt', 'title', 'src', 'class', 'width', 'height', 'srcset', 'style'];
        $wrapper.find('img').each(function(node) {
            if (node.attributes.length > 0) {
                var attrs = node.attributes;
                for (var i = attrs.length - 1; i >= 0; i--) {
                    if (attrs[i].name.search(/^data\-/) === -1 && imageattrs.indexOf(attrs[i].name) === -1) {
                        node.removeAttribute(attrs[i].name);
                    }
                }
            }
        });

        // get wrapper
        html = utils.getWrapperHtml($wrapper);
        html = html.trim();

        return html;
    },
    parse: function(html, convertPlainText, pasteMarker) {

        // trim
        html = html.trim();

        // broadcast
        var event = this.app.broadcast('editor.content.before.parse', { html: html });
        html = event.get('html');

        // check empty
        if (this.isEmptyHtml(html)) {
            var instance = this.app.block.create();
            return instance.$block.get().outerHTML;
        }

        // utils
        var utils = this.app.create('utils');

        // encode pre/code
        html = this.encodeCode(html);

        // encode script
        html = this.encodeScript(html);

        // sanitize
        html = utils.sanitize(html);

        // trim links
        html = this._trimLinks(html);

        // store noneditable
        html = this.storeMatched(html, 'noteditable', ['.' + this.opts.noneditable.classname]);
        html = this.storeMatched(html, 'embedded', ['figure', 'iframe']);

        // remove denied tags
        html = this.removeTags(html, this.opts.tags.denied);

        // create wrapper
        var $wrapper = utils.createWrapper(html);

        // remove script tag
        $wrapper.find('script').remove();

        // remove empty span
        $wrapper.find('span').each(this.removeEmptySpan.bind(this));

        // remove block tags from th/td/li
        $wrapper.find('th, td, li').each(this.removeBlockTags.bind(this));

        // cache styles
        var selectorCache = this.opts.tags.block.join(',') + ',a,img,' + this.opts.tags.form.join(',');
        $wrapper.find(selectorCache).each(this.cacheBlocksStyle.bind(this));

        // remove inline style
        var inlinesArr = utils.removeFromArrayByValue(this.opts.tags.inline, 'a');
        $wrapper.find(inlinesArr.join(',')).removeAttr('style');

        // parse blocks
        $wrapper = this.app.parser.parse($wrapper);

        // get wrapper html
        html = utils.getWrapperHtml($wrapper);

        // restore embedded
        html = this.restoreMatched(html, 'embedded');

        // create wrapper again
        $wrapper = utils.createWrapper(html);

        // parse
        $wrapper = this.app.parser.parseExclude($wrapper);

        // get wrapper html
        html = utils.getWrapperHtml($wrapper);

        // restore noneditable
        html = this.restoreMatched(html, 'noteditable');

        // create wrapper again
        $wrapper = utils.createWrapper(html);

        // parse noneditable
        $wrapper = this.app.parser.parseNoneditable($wrapper);

        // add figcaption
        $wrapper.find('figure').each(function(node) {
            var $node = this.dom(node);
            var $figcaption = $node.find('figcaption');
            if ($figcaption.length === 0) {
                $figcaption = this.dom('<figcaption>');
                $figcaption.attr('data-arx-type', 'figcaption');
                $figcaption.attr('contenteditable', true);
                $node.append($figcaption);
            }

            $figcaption.attr('data-placeholder', this.lang.get('placeholders.figcaption'));

        }.bind(this));

        // paste/insert marker
        if (pasteMarker) {
            $wrapper.find('[data-arx-type]').attr('data-arx-inserted', true);
        }

        // plaintext convert
        if (convertPlainText && this.opts.plaintext.markup) {
            $wrapper.find('[data-arx-type=paragraph]').each(function(node) {
                var $node = this.dom(node);
                $node.attr('data-arx-type', 'text');
                $node.addClass(this.opts.plaintext.classname);

                utils.replaceToTag($node, 'div');

            }.bind(this));
        }

        html = utils.getWrapperHtml($wrapper);

        // broadcast
        var event = this.app.broadcast('editor.content.parse', { html: html });

        return event.get('html');
    },
    unparse: function(html, paste) {
        // trim
        html = html.trim();

        // broadcast
        var event = this.app.broadcast('editor.content.before.unparse', { html: html });
        html = event.get('html');

        // empty
        if (this.isEmptyHtml(html)) {
            return '';
        }

        // create wrapper
        var utils = this.app.create('utils');
        var $wrapper = utils.createWrapper(html);

        // decode embeded
        $wrapper.find('[data-arx-type=embed]').each(function(node){
            var $node = this.dom(node);
            var code = decodeURI($node.attr('data-embed-code'));
            var $responsive = $node.find('.' + this.opts.embed.responsive);
            var $el = $node.find('figcaption');
            var $figcaption;
            if ($el.length !== 0) {
                $figcaption = $el.clone();
                $el.remove();
            }

            if ($responsive.length === 0) {
                $node.html(code);
            }
            else {
                $responsive.html(code);
            }

            if ($figcaption) {
                $node.append($figcaption);
            }

        }.bind(this));

        // remove plus empty
        $wrapper.find('.arx-plus-button').remove();

        // find blocks
        var $blocks = $wrapper.find('[data-arx-type]');

        // remove attrs & classes
        $blocks.removeAttr('data-arx-type data-arx-first-level data-arx-tmp-tag data-placeholder data-embed-code contenteditable data-gramm_editor tabindex');
        $blocks.removeClass(this.opts.arxclasses);

        var $links = $wrapper.find('a');
        if (this.opts.link && this.opts.link.nofollow) {
            $links.attr('rel', 'nofollow');
        }

        // normalize blocks
        $blocks.each(function(node) {
            var $el = this.dom(node);

            if (node.tagName === 'FIGCAPTION' && node.innerHTML.trim() === '') {
                $el.remove();
            }

            if ($el.attr('class') === '') {
                $el.removeAttr('class');
            }
        }.bind(this));

        // release style cache
        $wrapper.find('[data-arx-style-cache]').each(function(node) {
            var value = node.getAttribute('data-arx-style-cache');
            node.setAttribute('style', value);
            node.removeAttribute('data-arx-style-cache');
        });

        // get wrapper html
        html = utils.getWrapperHtml($wrapper);

        // decode script
        html = this.encodeScript(html, true);

        // broadcast
        var event = this.app.broadcast('editor.content.unparse', { html: html });

        return event.get('html');
    },
    copy: function(e, $el, parse) {
        var clipboard = e.clipboardData;

        // html
        var html = (typeof $el === 'string') ? $el : $el.clone().get().outerHTML;
        var content = (parse === false) ? html : this.unparse(html);

        clipboard.setData('text/html', content);
        clipboard.setData('text/plain', this.removeHtml(content).replace(/\n$/, ""));

    },
    parsePlainText: function(html) {
        html = (this.opts.paste.links) ? this.storeLinks(html) : html;
        html = (this.opts.paste.images) ? this.storeImages(html) : html;

        html = this.getPlainText(html);
        html = this._replaceNlToBr(html);

        html = (this.opts.paste.links) ? this.restoreLinks(html) : html;
        html = (this.opts.paste.images) ? this.restoreImages(html) : html;

        return html;
    },
	getPlainText: function(html) {
		html = html.replace(/<!--[\s\S]*?-->/gi, '');
		html = html.replace(/<style[\s\S]*?style>/gi, '');
        html = html.replace(/<p><\/p>/g, '');
		html = html.replace(/<\/div>|<\/li>|<\/td>/gi, '\n');
		html = html.replace(/<\/p>/gi, '\n\n');
		html = html.replace(/<\/H[1-6]>/gi, '\n\n');

		var tmp = document.createElement('div');
		tmp.innerHTML = html;

		html = tmp.textContent || tmp.innerText;

		return html.trim();
	},
    storeComponents: function(html) {
        return this.storeMatched(html, 'components', ['svg', 'figure', '.noneditable'])
    },
    storeLinks: function(html) {
        return this.storeMatched(html, 'links', ['a'])
    },
    storeImages: function(html) {
        return this.storeMatched(html, 'images', ['img'])
    },
    restoreComponents: function(html) {
        return this.restoreMatched(html, 'components');
    },
    restoreLinks: function(html) {
        return this.restoreMatched(html, 'links');
    },
    restoreImages: function(html) {
        return this.restoreMatched(html, 'images');
    },

    // store
	storeMatched: function(html, name, selectors) {
      for (var i = 0; i < selectors.length; i++) {
            var matched = this._getElementsFromHtml(html, selectors[i]);
            html = this._storeMatched(html, name, matched);
        }

    	return html;
	},
	restoreMatched: function(html, name) {
    	if (typeof this._stored[name] !== 'undefined') {
            for (var i = 0; i < this._stored[name].length; i++) {
                html = html.replace('####_' + name + i + '_####', this._stored[name][i]);
            }
        }

        return html;
	},
    _storeMatched: function(html, name, matched) {
        if (matched) {

            if (typeof this._stored[name] === 'undefined') {
                this._stored[name] = [];
            }

            for (var i = 0; i < matched.length; i++) {
                this._stored[name][this._storedIndex] = matched[i];
                html = html.replace(matched[i], '####_' + name + this._storedIndex + '_####');
                this._storedIndex++;
            }
        }

        return html;
    },

    // is
    isEmptyHtml: function(html) {
        return (html === '' || html === '<p></p>' || html === '<div></div>');
    },

    // remove
    removeEmptySpan: function(node) {
        if (node.attributes.length === 0) {
            this.dom(node).unwrap();
        }
    },
    removeHtml: function(str) {
        var tmp = document.createElement('div');
        tmp.innerHTML = str;
        return tmp.textContent || tmp.innerText || "";
    },
    escapeHtml: function(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    },
    removeTags: function(input, denied) {
        var re = (denied) ? /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi : /(<([^>]+)>)/gi;
        var replacer = (!denied) ? '' : function ($0, $1) {
            return denied.indexOf($1.toLowerCase()) === -1 ? $0 : '';
        };

        return input.replace(re, replacer);
    },
    removeBlockTags: function(node) {
        var tags = (node.tagName === 'LI') ? this.blockListTags : this.blockTags;
        this.dom(node).find(tags.join(',')).append('<br>').unwrap();
    },
    removeTagsExcept: function(input, except) {
        if (except === undefined) return input.replace(/(<([^>]+)>)/gi, '');

        var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
        return input.replace(tags, function($0, $1) {
            return except.indexOf($1.toLowerCase()) === -1 ? '' : $0;
        });
    },

    // cache
    cacheBlocksStyle: function(node) {
        var $el = this.dom(node);
        var style = $el.attr('style');
        if (style) {
            $el.attr('data-arx-style-cache', style);
        }
        else if (!style || style === '') {
            $el.removeAttr('data-arx-style-cache');
        }
    },

    // encode
    encodeScript: function(html, decode) {
        var matches = html.match(/<script(|\\s+[^>]*)>([\w\W]*?)<\/script>/g);
        if (matches !== null) {
            for (var i = 0; i < matches.length; i++) {
                var arr = matches[i].match(new RegExp('<script(.*?)>([\\w\\W]*?)</script>', 'i'));
                var str = (decode) ? decodeURI(arr[2]) : encodeURI(arr[2]);
                html = html.replace(arr[0], '<script' + arr[1] + '>' + str + '</script>');
            }
        }

        return html;
    },
    encodeCode: function(html) {

        // store comments
        var storeComments = [];
        var commentsMatch = html.match(new RegExp('<!--([\\w\\W]*?)-->', 'gi'));
        if (commentsMatch !== null) {
            for (var i = 0; i < commentsMatch.length; i++) {
                html = html.replace(commentsMatch[i], '#####xstarthtmlcommentzz' + i + 'xendhtmlcommentzz#####');
                storeComments.push(commentsMatch[i]);
            }
        }

        // replace all tags
        html = html.replace(/<(.*?)>/gi, 'xtagstartz$1xtagendz');

        // revert pre / code
        html = html.replace(/xtagstartzpre(.*?)xtagendz/g, '<pre$1>');
        html = html.replace(/xtagstartzcode(.*?)xtagendz/g, '<code$1>');
        html = html.replace(/xtagstartz\/codextagendz/g, '</code>');
        html = html.replace(/xtagstartz\/prextagendz/g, '</pre>');

        // encode
        var utils = this.app.create('utils');
        var $wrapper = utils.createWrapper(html);
        $wrapper.find('pre code, pre, code').each(this._encodeNode.bind(this));
        html = utils.getWrapperHtml($wrapper);

        // revert all tags
        html = html.replace(/xtagstartz(.*?)xtagendz/g, '<$1>');
        html = html.replace(/xtagstartz\/(.*?)xtagendz/g, '</$1>');

        // restore comments
        for (var i = 0; i < storeComments.length; i++) {
            html = html.replace('#####xstarthtmlcommentzz' + i + 'xendhtmlcommentzz#####', storeComments[i]);
        }

        return html;
    },
    encodeEntities: function(str) {
        return this.decodeEntities(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },
    decodeEntities: function(str) {
        return String(str).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    },

    // private
    _encodeNode: function(node) {

        var first = node.firstChild;
        var html = node.innerHTML;
        if (node.tagName === 'PRE' && first && first.tagName === 'CODE') {
            return;
        }

        html = html.replace(/xtagstartz/g, '<');
        html = html.replace(/xtagendz/g, '>');

        var encoded = this.decodeEntities(html);
        encoded = encoded.replace(/&nbsp;/g, ' ').replace(/<br\s?\/?>/g, '\n');
        encoded = (this.opts.pre.spaces) ? encoded.replace(/\t/g, new Array(this.opts.pre.spaces + 1).join(' ')) : encoded;

        node.textContent = encoded;
    },

    _buildBlockTags: function() {
        return this.opts.tags.block;
    },
    _buildBlockListTags: function() {
        var tags = this.opts.tags.block.concat();
        var utils = this.app.create('utils');

        return utils.removeFromArrayByValue(tags, ['ul', 'ol', 'li']);
    },
    _formatLinks: function(content) {

        var matches = content.match(this.opts.regex.url);

        var obj = {};
        for (var i = 0; i < matches.length; i++)
        {
            var href = matches[i], text = href;
            var linkProtocol = (href.match(/(https?|ftp):\/\//i) !== null) ? '' : 'http://';
            var regexB = (["/", "&", "="].indexOf(href.slice(-1)) !== -1) ? '' : '\\b';
            var target = (this.opts.paste.linkTarget !== false) ? ' target="' + this.opts.paste.linkTarget + '"' : '';

            text = (text.length > this.opts.link.size) ? text.substring(0, this.opts.link.size) + '...' : text;
            text = (text.search('%') === -1) ? decodeURIComponent(text) : text;

            // escaping url
            var regexp = '(' + href.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&') + regexB + ')';
            obj[regexp] = '<a href="' + linkProtocol + href.trim() + '"' + target + '>' + text.trim() + '</a>';
        }

        // replace
        for (var key in obj) {
            content = content.replace(new RegExp(key, 'g'), obj[key]);
        }

        return content;
    },
    _restoreReplaced: function(stored, html) {
        for (var i = 0; i < stored.length; i++) {
            html = html.replace('#####replaceparse' + i + '#####', stored[i]);
        }

        return html;
    },
    _getKeepClasses: function() {
        var arr = [];

        if (this.opts.plaintext) {
            arr.push('.' + this.opts.plaintext.classname);
        }

        if (this.opts.grid) {
            arr.push('.' + this.opts.grid.columns.classname);
            arr.push('.' + this.opts.grid.classname);
        }

        for (var name in this.opts.snippets.items) {
            arr.push('.' + name);
        }

        if (arr.length !== 0) {
            return ', ' + arr.join(', ')
        }

        return '';
    },
    _getElementsFromHtml: function(html, selector) {
        var div = document.createElement("div");
        div.innerHTML = html;

        var elems = div.querySelectorAll(selector);

        // array map polyfill
        var mapping = function(callback, thisArg) {
            if (typeof this.length !== 'number') return;
            if (typeof callback !== 'function') return;

            var newArr = [];
            if (typeof this == 'object') {
                for (var i = 0; i < this.length; i++) {
                    if (i in this) newArr[i] = callback.call(thisArg || this, this[i], i, this);
                    else return;
                }
            }

            return newArr;
        };

        return mapping.call(elems, function(el) {
            return el.outerHTML;
        });
    },
	_replaceNlToBr: function(html) {
		return html.replace(/\n/g, '<br />');
	},
    _trimLinks: function(html) {
        var utils = this.app.create('utils');
        var $wrapper = utils.createWrapper(html);
        $wrapper.find('a').each(function(node) {
            var $node = this.dom(node);
            $node.html($node.html().trim());
        }.bind(this));

        return utils.getWrapperHtml($wrapper);
    },
    _isHtmlMsWord: function(html) {
        return html.match(/class="?Mso|style="[^"]*\bmso-|style='[^'']*\bmso-|w:WordDocument/i);
    },
    _isPages: function(html) {
        return html.match(/name="Generator"\scontent="Cocoa\sHTML\sWriter"/i);
    },
    _cleanPages: function(html) {

        html = html.replace(/\sclass="s[0-9]"/gi, '');
        html = html.replace(/\sclass="p[0-9]"/gi, '');

        // build wrapper
        var utils = this.app.create('utils');
        var $wrapper = utils.createWrapper(html);

        $wrapper.find('.Apple-converted-space').remove();

        // get wrapper
        html = utils.getWrapperHtml($wrapper);

        return html;
    },
    _cleanGDocs: function(html) {
        // remove google docs markers
        html = html.replace(/<b\sid="internal-source-marker(.*?)">([\w\W]*?)<\/b>/gi, "$2");
        html = html.replace(/<b(.*?)id="docs-internal-guid(.*?)">([\w\W]*?)<\/b>/gi, "$3");
        html = html.replace(/<br[^>]*>/gi, '<br>');

        html = html.replace(/<span[^>]*(font-style:\s?italic;\s?font-weight:\s?bold|font-weight:\s?bold;\s?font-style:\s?italic)[^>]*>([\w\W]*?)<\/span>/gi, '<b><i>$2</i></b>');
        html = html.replace(/<span[^>]*(font-style:\s?italic;\s?font-weight:\s?600|font-weight:\s?600;\s?font-style:\s?italic)[^>]*>([\w\W]*?)<\/span>/gi, '<b><i>$2</i></b>');
        html = html.replace(/<span[^>]*(font-style:\s?italic;\s?font-weight:\s?700|font-weight:\s?700;\s?font-style:\s?italic)[^>]*>([\w\W]*?)<\/span>/gi, '<b><i>$2</i></b>');
        html = html.replace(/<span[^>]*font-style:\s?italic[^>]*>([\w\W]*?)<\/span>/gi, '<i>$1</i>');
        html = html.replace(/<span[^>]*font-weight:\s?bold[^>]*>([\w\W]*?)<\/span>/gi, '<b>$1</b>');
        html = html.replace(/<span[^>]*font-weight:\s?700[^>]*>([\w\W]*?)<\/span>/gi, '<b>$1</b>');
        html = html.replace(/<span[^>]*font-weight:\s?600[^>]*>([\w\W]*?)<\/span>/gi, '<b>$1</b>');

        html = html.replace(/<p[^>]*>\s<\/p>/gi, '');

        return html;
    },
    _cleanMsWord: function(html) {
        html = html.replace(/<!--[\s\S]+?-->/gi, '');
        html = html.replace(/<(!|script[^>]*>.*?<\/script(?=[>\s])|\/?(\?xml(:\w+)?|img|meta|link|style|\w:\w+)(?=[\s\/>]))[^>]*>/gi, '');
        html = html.replace(/<(\/?)s>/gi, "<$1strike>");
        html = html.replace(/&nbsp;/gi, ' ');
        html = html.replace(/<span\s+style\s*=\s*"\s*mso-spacerun\s*:\s*yes\s*;?\s*"\s*>([\s\u00a0]*)<\/span>/gi, function(str, spaces) {
            return (spaces.length > 0) ? spaces.replace(/./, " ").slice(Math.floor(spaces.length/2)).split("").join("\u00a0") : '';
        });

        // build wrapper
        var utils = this.app.create('utils');
        var $wrapper = utils.createWrapper(html);

        $wrapper.find('p').each(function(node) {
            var $node = this.dom(node);
            var str = $node.attr('style');
            var matches = /mso-list:\w+ \w+([0-9]+)/.exec(str);
            if (matches) {
                $node.attr('data-listLevel',  parseInt(matches[1], 10));
            }
        }.bind(this));

        // parse Lists
        this._parseWordLists($wrapper);

        $wrapper.find('[align]').removeAttr('align');
        $wrapper.find('[name]').removeAttr('name');
        $wrapper.find('span').each(function(node) {
            var $node = this.dom(node);
            var str = $node.attr('style');
            var matches = /mso-list:Ignore/.exec(str);

            if (matches) $node.remove();
            else $node.unwrap();

        }.bind(this));
        $wrapper.find('[style]').removeAttr('style');
        $wrapper.find("[class^='Mso']").removeAttr('class');
        $wrapper.find('a').filter(function(node) { return !node.hasAttribute('href'); }).unwrap();

        // get wrapper
        html = utils.getWrapperHtml($wrapper);
        html = html.replace(/<p[^>]*><\/p>/gi, '');
        html = html.replace(/<li>·/gi, '<li>');
        html = html.trim();

        // remove spaces between
        html = html.replace(/\/(p|ul|ol|h1|h2|h3|h4|h5|h6|blockquote)>\s+<(p|ul|ol|h1|h2|h3|h4|h5|h6|blockquote)/gi, '/$1>\n<$2');

        var result = '';
        var lines = html.split(/\n/);
        for (var i = 0; i < lines.length; i++) {
            var space = (lines[i] !== '' && lines[i].search(/>$/) === -1) ? ' ' : '\n';
            result += lines[i] + space;
        }

        return result;
    },
    _parseWordLists: function($wrapper) {
        var lastLevel = 0;
        var $item = null;
        var $list = null;
        var $listChild = null;

        $wrapper.find('p').each(function(node) {
            var $node = this.dom(node);
            var level = $node.attr('data-listLevel');
            if (level === null && $node.hasClass('MsoListParagraphCxSpMiddle')) {
                level = 1;
            }

            if (level !== null) {
                var txt = $node.text();
                var listTag = (/^\s*\w+\./.test(txt)) ? '<ol></ol>' : '<ul></ul>';

                // new parent list
                if ($node.hasClass('MsoListParagraphCxSpFirst') || $node.hasClass('MsoNormal')) {
                    $list = this.dom(listTag);
                    $node.before($list);
                }
                // new child list
                else if (level > lastLevel && lastLevel !== 0) {
                    $listChild = this.dom(listTag);
                    $item.append($listChild);
                    $list = $listChild;
                }
                // level up
                if (level < lastLevel) {
                    var len = lastLevel - level + 1;
                    for (var i = 0; i < len; i++) {
                        $list = $list.parent();
                    }
                }

                // create item
                $node.find('span').first().unwrap();
                $item = this.dom('<li>' + $node.html().trim() + '</li>');
                if ($list === null) {
                    $node.before(listTag);
                    $list = $node.prev();
                }

                // append
                $list.append($item);
                $node.remove();

                lastLevel = level;
            }
            else {
                $list = null;
                lastLevel = 0;
            }
        }.bind(this));
    }
});
ArticleEditor.add('service', 'offset', {
    init: function(element) {
    },
    get: function(el) {
        el = (el) ? this.dom(el).get() : this.app.editor.$editor.get();

        var selection = window.getSelection();
        var offset = false;

        if (selection.rangeCount > 0) {

            var range = selection.getRangeAt(0);
            var isInEditor = (this.dom(range.startContainer).closest('.arx-editor').length === 1);
            var isIn = el.contains(selection.anchorNode);

            if (!isIn || !isInEditor) {
                offset = false;
            }
            else if (isIn) {
                var clonedRange = range.cloneRange();
                clonedRange.selectNodeContents(el);
                clonedRange.setEnd(range.startContainer, range.startOffset);

                var start = clonedRange.toString().length;
                offset = {
                    start: start,
                    end: start + range.toString().length
                };
            }
        }

        return offset;
    },
    set: function(offset, el) {
        el = (el) ? this.dom(el).get() : this.app.editor.$editor.get();

        var charIndex = 0, range = document.createRange();
        var nodeStack = [el], node, foundStart = false, stop = false;

        range.setStart(el, 0);
        range.collapse(true);

        while (!stop && (node = nodeStack.pop())) {
            if (node.nodeType == 3) {
                var nextCharIndex = charIndex + node.length;

                if (!foundStart && offset.start >= charIndex && offset.start <= nextCharIndex) {
                    range.setStart(node, offset.start - charIndex);
                    foundStart = true;
                }

                if (foundStart && offset.end >= charIndex && offset.end <= nextCharIndex) {
                    range.setEnd(node, offset.end - charIndex);
                    stop = true;
                }

                charIndex = nextCharIndex;
            }
            else {
                var i = node.childNodes.length;
                while (i--) {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }

        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
});
ArticleEditor.add('service', 'insertion', {
    init: function() {
    },
    insertBreakline: function(caret) {
        return this.insertNode(document.createElement('br'), (caret) ? caret : 'after');
    },
    insertChar: function(charhtml, caret) {
        return this.insertNode(charhtml, (caret) ? caret : 'after');
    },
    insertHtml: function(html, caret) {
        return this.insertNode(html, (caret) ? caret : 'after');
    },
    insertNode: function(node, caret) {
        var fragment = this._buildFragment(node);

        this._insertFragment(fragment);
        this._setCaretToFragment(fragment, caret);

        return fragment.nodes[0];
    },
    insertPoint: function(e) {
        var range, data;
        var caret = this.app.create('caret');
        var utils = this.app.create('utils');
        var marker = utils.createInvisibleChar();
        var x = e.clientX, y = e.clientY;

        if (document.caretPositionFromPoint) {
            var pos = document.caretPositionFromPoint(x, y);
            var sel = document.getSelection();
            range = sel.getRangeAt(0);
            range.setStart(pos.offsetNode, pos.offset);
            range.collapse(true);
            range.insertNode(marker);
        }
        else if (document.caretRangeFromPoint) {
            range = document.caretRangeFromPoint(x, y);
            range.insertNode(marker);
        }

        caret.set('after', marker);
    },

    // private
    _setCaretToFragment: function(fragment, position) {
        if (position) {
            var caret = this.app.create('caret');
            caret.set(position, fragment.last);
        }
    },
    _buildFragment: function(node) {
        var utils = this.app.create('utils');
        return (utils.isFragment(node)) ? node : utils.createFragment(node);
    },
    _insertFragment: function(fragment) {
        var selection = this.app.create('selection');
        var sel = selection.get();
        if (sel.range) {
            if (sel.collapsed) {
                var startNode = sel.range.startContainer;
                if (startNode.nodeType !== 3 && startNode.tagName === 'BR') {
                    startNode.parentNode.removeChild(startNode);
                }
            }
            else {
                sel.range.deleteContents();
            }

            sel.range.insertNode(fragment.frag);
        }
    }
});
ArticleEditor.add('service', 'selection', {
    init: function() {
    },

    // get
    get: function() {
        var selection = this._getSelection();
        var range = this._getRange(selection);
        var current = this._getCurrent(selection);
        var is = (this._isInEditor(current) || this.app.editor.is(current));

        return {
            is: is,
            selection: (is) ? selection : false,
            range: range,
            collapsed: this._getCollapsed(selection, range),
            current: current,
            parent: this._getParent(current)
        };
    },
    getNodes: function(data) {
        var selection = this._getSelection();
        var range = this._getRange(selection);
        var nodes = (selection && range) ? this._getRangeNodes(range) : [];
        var utils = this.app.create('utils');

        // filter
        var finalNodes = [];
        var pushNode, isTagName;
        for (var i = 0; i < nodes.length; i++) {

            pushNode = true;

            if (data) {
                // by type
                if (data.type) {
                    if (data.type === 'inline' && !utils.isInlineTag(nodes[i].tagName)) {
                        pushNode = false;
                    }
                }
                // by tag
                if (data.tags) {
                    isTagName = (typeof nodes[i].tagName !== 'undefined');
                    if (!isTagName) {
                        pushNode = false;
                    }

                    if (isTagName && data.tags.indexOf(nodes[i].tagName.toLowerCase()) === -1) {
                        pushNode = false;
                    }
                }
            }

            if (pushNode) {
                finalNodes.push(nodes[i]);
            }
        }

        return finalNodes;
    },
    getElement: function(el) {
        return this._getElement(el, 'isElement');
    },
    getInline: function(el) {
        return this._getElement(el, 'isInline');
    },
    getBlock: function(el) {
        return this._getElement(el, 'isBlock');
    },
    getText: function(type, num) {
        var sel = this.get();
        var text = false;

        if (!sel.is) return false;
        if (type && sel.range) {
            num = (typeof num === 'undefined') ? 1 : num;

            var el = this.app.editor.$editor.get();
            var clonedRange = sel.range.cloneRange();

            if (type === 'before') {
                clonedRange.collapse(true);
                clonedRange.setStart(el, 0);

                text = clonedRange.toString().slice(-num);
            }
            else if (type === 'after') {
                clonedRange.selectNodeContents(el);
                clonedRange.setStart(sel.range.endContainer, sel.range.endOffset);

                text = clonedRange.toString().slice(0, num);
            }
        }
        else {
            text = (sel.selection) ? sel.selection.toString() : '';
        }

        return text;
    },
    getHtml: function(clean) {
        var html = '';
        var sel = this.get();

        if (!sel.is) return false;
        if (sel.selection) {
            var clonedRange = sel.range.cloneContents();
            var div = document.createElement('div');
            div.appendChild(clonedRange);
            html = div.innerHTML;
            html = html.replace(/<p><\/p>$/i, '');
        }

        return html;
    },

    // set
    set: function(sel) {
        if (sel.selection) {
            sel.selection.removeAllRanges();
            sel.selection.addRange(sel.range);
        }
    },
    setRange: function(range) {
        this.set({ selection: window.getSelection(), range: range });
    },

    // is
    is: function(el) {
        if (typeof el !== 'undefined') {
            var node = this.dom(el).get();
            var nodes = this.getNodes();

            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i] === node) return true;
            }
        }
        else {
            return this.get().is;
        }

        return false;
    },
    isAll: function(el) {
        var node = this.dom(el).get();
        var selection = window.getSelection();
        var range = this._getRange(selection);

        if (selection.isCollapsed) return false;

        if (this.is(node)) {
            return ((typeof node.textContent !== 'undefined') && (node.textContent.trim().length === range.toString().trim().length))
        }
        else {
            return false;
        }
    },

    // collapse
    collapse: function(type) {
        type = type || 'start';

        var sel = this.get();
        if (sel.selection && !sel.collapsed) {
            if (type === 'start') sel.selection.collapseToStart();
            else sel.selection.collapseToEnd();
        }
    },

    // save & restore
    save: function(el) {
        var offset = this.app.create('offset');
        this.app.editor.savedSelection = { offset: offset.get(el), el: el };
    },
    restore: function(el) {
        if (!this.app.editor.savedSelection) return;

        el = el || this.app.editor.savedSelection.el;
        var offset = this.app.create('offset');
        offset.set(this.app.editor.savedSelection.offset, el);
        this.app.editor.savedSelection = false;
    },


    // private
    _getSelection: function() {
        var sel = window.getSelection();
        return (sel.rangeCount > 0) ? sel : false;
    },
    _getRange: function(selection) {
        return (selection) ? ((selection.rangeCount > 0) ? selection.getRangeAt(0) : false) : false
    },
    _getCurrent: function(selection) {
        return (selection) ? selection.anchorNode : false;
    },
    _getParent: function(current) {
        var node = (current) ? current.parentNode : false;

        return node = (this.app.editor.is(node)) ? false : node;
    },
    _getElement: function(el, func) {
        var sel = this._getSelection();
        var utils = this.app.create('utils');
        if (sel) {
            var node = el || this._getCurrent(sel);
            node = this.dom(node).get();
            while (node) {
                if (utils[func](node) && this._isInEditor(node)) {
                    return node;
                }

                node = node.parentNode;
            }
        }

        return false;
    },
    _getCollapsed: function(selection, range) {
        var collapsed = false;
        if (selection && selection.isCollapsed) collapsed = true;
        else if (range && range.toString().length === 0) collapsed = true;

        return collapsed;
    },
    _getNextNode: function(node) {
        if (node.firstChild) return node.firstChild;

        while (node) {
            if (node.nextSibling) return node.nextSibling;
            node = node.parentNode;
        }
    },
    _getRangeNodes: function(range) {
        var start = range.startContainer.childNodes[range.startOffset] || range.startContainer;
        var end = range.endContainer.childNodes[range.endOffset] || range.endContainer;
        var commonAncestor = range.commonAncestorContainer;
        var nodes = [];
        var node;

        for (node = start.parentNode; node; node = node.parentNode) {
            if (this.app.editor.is(node)) break;
            nodes.push(node);
            if (node == commonAncestor) break;
        }

        nodes.reverse();

        for (node = start; node; node = this._getNextNode(node)) {
            if (node.nodeType !== 3 && this.dom(node.parentNode).closest(commonAncestor).length === 0) break;

            nodes.push(node);
            if (node == end) break;
        }

        return nodes;
    },
    _isInEditor: function(node) {
        return (this.dom(node).closest('.arx-editor-' + this.uuid).length !== 0);
    }
});
ArticleEditor.add('service', 'input', {
    traverseTab: function(e, event, instance) {
        var caret = this.app.create('caret');
        var selection = this.app.create('selection');
        var insertion = this.app.create('insertion');
        var item = selection.getBlock();
        var isList = (instance.getType() === 'list');
        var isItemStart = (isList && item.tagName === 'LI' && caret.is('start', item));
        var isTabSpaces = (this.opts.tab.spaces !== false);
        if (!isItemStart && isTabSpaces) {
             var node = document.createTextNode(Array(this.opts.tab.spaces + 1).join('\u00a0'));
             insertion.insertNode(node, 'end');
             return true;
        }
        else if (isList && !instance.isStart()) {
            this.app.api('list.indent');
            return true;
        }
    },
    trimInvisibleChar: function(e, type, remove) {
        var utils = this.app.create('utils');
        var offset = this.app.create('offset');
        var selection = this.app.create('selection');
        var direction = (type === 'before') ? 'left' : 'right';
        var el;
        var sel = selection.get();
        if (!sel.is) {
            return;
        }

        var text = selection.getText(type);
        var isSpace = (sel.current && sel.current.nodeType === 3 && utils.searchInvisibleChars(text) === 0);

        if (isSpace && direction === 'left') {
            el = sel.current;
            this.dom(el).replaceWith(el.textContent.replace(/\s+$/,""));
        }
        else if (isSpace && remove && sel.current && sel.current.nextSibling) {
            el = sel.current.nextSibling;
            this.dom(el).replaceWith(el.textContent.replace(/^\s+/,""));
        }
        else if (isSpace && direction === 'right') {
            e.preventDefault();
            var data = offset.get();
            offset.set({ start: data.start + 1, end: data.end + 1 });
            return true;
        }
    },
    trimEmptyInlines: function(e) {
        var utils = this.app.create('utils');
        var selection = this.app.create('selection');
        var sel = selection.get();
        if (sel.collapsed && document.getSelection().anchorOffset === 0 && sel.current && sel.current.previousSibling) {
            if (utils.isInline(sel.current.previousSibling) && sel.current.previousSibling.innerHTML === '') {
                e.preventDefault();
                this.dom(sel.current.previousSibling).remove();
                return true;
            }
        }
    },
    removeUnwantedStyles: function(instance) {
        if (!instance.isEditable()) return;

        setTimeout(function() {
            var $tags = instance.$block.find('*[style]');
            $tags.not('img, figure, iframe, [data-arx-style-cache], [data-arx-span]').removeAttr('style');

        }, 0);
    },
    removeEmptySpans: function(instance) {
        if (!instance.isEditable()) return;

        var self = this;
        setTimeout(function() {
            instance.$block.find('span').each(function(node) {
                if (node.attributes.length === 0) {
                    self.dom(node).replaceWith(node.childNodes);
                }
            });
        }, 0);
    },
    insertNonBreakSpace: function() {
        var insertion = this.app.create('insertion');
        insertion.insertChar('&nbsp;');
        return true;
    },
    insertBreakline: function() {
        var insertion = this.app.create('insertion');
        insertion.insertBreakline();
        return true;
    },
    replaceToParagraph: function(instance) {
        var type = instance.getType();
        var types = ['column', 'layer'];
        var newinstance = this.app.block.create();

        // append
        if (types.indexOf(type) !== -1 && instance.$block.hasClass('arx-empty-layer')) {
            instance.$block.removeClass('arx-empty-layer');
            instance.$block.html('');
            this.app.block.add(newinstance, 'append');
            return true;
        }

        // replace to new paragraph
        if (type !== 'column') {
            this.app.block.add(newinstance, 'after', false);
            instance.remove(false);
            this.app.block.set(newinstance.$block);
        }

        return true;
    },
    deleteContents: function(range) {
        range.deleteContents();
        return true;
    },
    deleteContentsAndCollapse: function(range) {
        this.deleteContents(range);
        var selection = this.app.create('selection');
        selection.collapse('end');
        return true;
    },
    makeEmpty: function(instance) {
        var el = instance.empty();
        var caret = this.app.create('caret');
        caret.set('start', el);
        return true;
    },
    createBefore: function(active) {
        var instance = this.app.block.create();
        this.app.block.add(instance, 'before', active);
        this.app.control.rebuild();
        return true;
    },
    createAfter: function(active) {
        var instance = this.app.block.create();
        this.app.block.add(instance, 'after', active);
        return true;
    }
});
ArticleEditor.add('service', 'paragraphize', {
    init: function() {
        // local
        this.stored = [];
        this.remStart = '#####replace';
        this.remEnd = '#####';
        this.paragraphizeTags = ['table', 'div', 'pre', 'form', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'dl', 'blockquote', 'figcaption',
                'address', 'section', 'header', 'footer', 'aside', 'article', 'object', 'style', 'script', 'iframe', 'select', 'input', 'textarea',
                'button', 'option', 'map', 'area', 'math', 'hr', 'fieldset', 'legend', 'hgroup', 'nav', 'figure', 'details', 'menu', 'summary', 'p'];
    },
    parse: function(html) {
        var value = this._isConverted(html);
        return (value === true) ? this._convert(html) : value;
    },

    // private
    _convert: function(html) {
        // build markup tag
        var markupTag = 'p';

        // store tags
        html = this._storeTags(html);

        // store comments
        var storeComments = [];
        var commentsMatch = html.match(new RegExp('<!--([\\w\\W]*?)-->', 'gi'));
        if (commentsMatch !== null) {
            for (var i = 0; i < commentsMatch.length; i++) {
                html = html.replace(commentsMatch[i], '#####xstarthtmlcommentzz' + i + 'xendhtmlcommentzz#####');
                storeComments.push(commentsMatch[i]);
            }
        }

        // remove new lines
        html = html.trim();
        html = html.replace(/[\n]+/g, "\n");
        html = this._trimEmptyLines(html);

        // paragraph and break markers
        html = html.replace(/(?:\r\n|\r|\n)/g, "xparagraphmarkerz");

        // replace markers
        html = html.replace(/xparagraphmarkerz/gi, '</' + markupTag + '>\n<' + markupTag + '>');

        // wrap all
        html = '<' + markupTag + '>' + html + '</' + markupTag + '>';

        // clean
        html = html.replace(new RegExp('<' + markupTag + '>#####', 'gi'), '#####');
        html = html.replace(new RegExp('#####</' + markupTag + '>', 'gi'), '#####');

        // restore tags
        html = this._restoreTags(html);

        // restore comments
        for (var i = 0; i < storeComments.length; i++) {
            html = html.replace('#####xstarthtmlcommentzz' + i + 'xendhtmlcommentzz#####', storeComments[i]);
        }

        return html;
    },
    _storeTags: function(html) {
        var self = this;
        var utils = this.app.create('utils');
        var $wrapper = utils.createWrapper(html);

        $wrapper.find(this.paragraphizeTags.join(', ')).each(function(node, i) {
            var replacement = document.createTextNode("\n" + self.remStart + i + self.remEnd + "\n");
            self.stored.push(node.outerHTML);
            node.parentNode.replaceChild(replacement, node);
        });

        return utils.getWrapperHtml($wrapper);
    },
    _restoreTags: function(html) {
        for (var i = 0; i < this.stored.length; i++) {
            this.stored[i] = this.stored[i].replace(/\$/g, '&#36;');
            html = html.replace(this.remStart + i + this.remEnd, this.stored[i]);
        }

        return html;
    },
    _trimEmptyLines: function(html) {
        var str = '';
        var arr = html.split("\n");
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].trim() !== '') {
                str += arr[i] + "\n";
            }
        }

        return str.replace(/\n$/, '');
    },
    _isConverted: function(html) {
        if (this.opts.paste.paragraphize === false || this._isEmptyHtml(html)) {
            return html;
        }

        return true;
    },
    _isEmptyHtml: function(html) {
        return (html === '' || html === '<p></p>' || html === '<div></div>');
    }
});
ArticleEditor.add('service', 'upload', {
    init: function() {
        this.defaults = {
            url: false,
            type: 'image',
            name: 'file',
            data: false,
            multiple: true,
            success: false,
            error: false
        };
    },
    stop: function() {
        this._hideProgress();
    },
    build: function($el, params) {

        this.$element = this.dom($el);
        this.params = ArticleEditor.extend(true, this.defaults, params);

        // build
        this._buildInput();
        this._buildPlaceholder();
        this._buildEvents();
    },
    send: function(e, files, params) {
        this.params = ArticleEditor.extend(true, this.defaults, params);

        this._send(e, files);
    },
    setPlaceholder: function(text) {
    	this.$placeholder.html(this.lang.parse(text));
    },
    complete: function(response, e) {
        this._complete(response, e);
    },

    // build
    _buildInput: function() {
        this.$input = this.dom('<input>');
        this.$input.attr('type', 'file');
        this.$input.attr('name', this._getUploadParam());
        this.$input.hide();

        if (this.params.multiple) {
            this.$input.attr('multiple', 'multiple');
        }

        if (this.params.type === 'image') {
            this.$input.attr('accept', 'image/*');
        }

        this.$element.before(this.$input);
    },
    _buildPlaceholder: function() {
        this.$placeholder = this.dom('<span>');
    	this.$placeholder.addClass('arx-popup-upload-placeholder');
    	this.$placeholder.html(this.lang.get('upload.placeholder'));

    	this.$element.append(this.$placeholder);
    },
    _buildEvents: function() {
        this.$input.on('change.arx-upload-' + this.uuid, this._change.bind(this));
        this.$element.on('click.arx-upload-' + this.uuid, this._click.bind(this));
        this.$element.on('drop.arx-upload-' + this.uuid, this._drop.bind(this));
        this.$element.on('dragover.arx-upload-' + this.uuid, this._dragover.bind(this));
        this.$element.on('dragleave.arx-upload-' + this.uuid, this._dragleave.bind(this));
    },

    // events
    _click: function(e) {
        e.preventDefault();
        this.$input.click();
    },
    _change: function(e) {
        this._send(e, this.$input.get().files);
    },
    _drop: function(e) {
        e.preventDefault();
        this._send(e);
    },
    _dragover: function(e) {
        e.preventDefault();
        this._setStatus('hover');
        return false;
    },
    _dragleave: function(e) {
        e.preventDefault();
        this._removeStatus();
        return false;
    },

    // status
    _setStatus: function(status) {
        this._removeStatus();
        this.$element.addClass('arx-upload-' + status);
    },
    _removeStatus: function() {
        var status = ['hover', 'error'];
        for (var i = 0; i < status.length; i++) {
            this.$element.removeClass('arx-upload-' + status);
        }
    },

    // send
    _getUploadParam: function() {
        return this.params.name;
    },
    _send: function(e, files) {
        files =  files || e.dataTransfer.files;

        var data = new FormData();
        var name = this._getUploadParam();
        var utils = this.app.create('utils');

        data = this._buildData(name, files, data);
        data = utils.extendData(data, this.params.data);

        // send data
        this._sendData(e, files, data);
    },
    _sendData: function(e, files, data) {

        if (typeof this.params.url === 'function') {
            this.params.url.call(this.app, this, { data: data, files: files, e: e });
        }
        else {
            this._showProgress();
            this.ajax.post({
                url: this.params.url,
                data: data,
                before: function(xhr) {
                    var event = this.app.broadcast('upload.before.send', { xhr: xhr, data: data, files: files, e: e });
                    if (event.isStopped()) {
                        this._hideProgress();
                        return false;
                    }
                }.bind(this),
                success: function(response) {
                    this._complete(response, e);
                }.bind(this)
            });
        }
    },
    _buildData: function(name, files, data) {
        if (files.length === 1) {
            data.append(name + '[]', files[0]);
        }
        else if (files.length > 1 && this.params.multiple) {
            for (var i = 0; i < files.length; i++) {
                data.append(name + '[]', files[i]);
            }
        }

        return data;
    },
    _complete: function(response, e) {
        if (response && response.error) {
            if (this.params.error) {
                this.app.broadcast('upload.error', { response: response });
                this.app.api(this.params.error, response, e);
            }
        }
        else {
            if (this.params.success) {
                this.app.broadcast('upload.complete', { response: response });
                this.app.api(this.params.success, response, e);
            }
        }

        setTimeout(this._hideProgress.bind(this), 500);

        if (this.$element) {
            this.$input.off('.arx-upload-' + this.uuid);
            this.$element.off('.arx-upload-' + this.uuid);
        }
    },
    _showProgress: function(settings) {
        this._hideProgress();

        this.$progress = this.dom('<div>');
        this.$progress.attr('id', 'article-progress');
        this.$progress.addClass('article-editor-progress');

        this.$progressBar = this.dom('<span>');
        this.$progress.append(this.$progressBar);
        this.app.$body.append(this.$progress);
    },
    _hideProgress: function(settings) {
        this.app.$body.find('#article-progress').remove();
    }
});
ArticleEditor.add('service', 'utils', {
    init: function() {
        // local
        this.scrolltop = false;
        this.codemirror = false;
    },

    // detect
	isMobile: function() {
		return /(iPhone|iPod|Android)/.test(navigator.userAgent);
	},

	// codemirror
	getCodemirror: function() {
        return this.codemirror;
	},
	createCodemirror: function($input, options, height) {
        var opts = this._isCodemirror(options);

        if (opts) {
            this.codemirror = CodeMirror.fromTextArea($input.get(), opts);
            if (height) {
                this.codemirror.setSize(null, height);
            }
        }
	},
    getCodemirrorValue: function(html, options) {
        if (this._isCodemirror(options)) {
            html = this.codemirror.getValue();
            this.codemirror.toTextArea();
        }

        return html;
    },
    getCodemirrorValueSoft: function(html, options) {
        if (this._isCodemirror(options)) {
            html = this.codemirror.getValue();
        }

        return html;
    },


	// placeholder
    createPlaceholder: function($el) {
        var button = this.app.create('button');
        var $plus = this.dom('<span>');
        $plus.addClass('arx-plus-button');
        $el.addClass('arx-empty-layer');
        $el.append($plus);

        var obj = {
            popup: {
                name: 'addbar',
                width: '400px',
                builder: 'toolbar.addbar'
            }
        };

        $plus.on('click.arx-button-plus-' + this.uuid, function(e) {
            e.preventDefault();
            this.app.block.set($el);
        }.bind(this));

        button.set($plus, 'addempty', obj, 'popup');
    },

    // scroll
    saveScroll: function() {
        this.scrolltop = this.getScrollTarget().scrollTop();
    },
    restoreScroll: function() {
        if (this.scrolltop !== false) {
            this.getScrollTarget().scrollTop(this.scrolltop);
            this.scrolltop = false;
        }
    },
    isScrollTarget: function() {
        return (this.opts.editor.scrollTarget !== document);
    },
    getScrollTarget: function() {
        return this.dom(this.opts.editor.scrollTarget);
    },
    scrollToElement: function($el, tolerance) {
        if (!this.isElementVisible($el)) {
            tolerance = tolerance || 60;
            var offset = $el.offset();
            var $target = this.getScrollTarget();
            var value = offset.top - tolerance;
            $target.scrollTop(value);

            setTimeout(function() {
                $target.scrollTop(value);
            }.bind(this), 1);

        }
    },

    // visibility
    isElementVisible: function(el, tolerance) {
        var $el = this.dom(el);
        var docViewTop = this.app.$win.scrollTop();
        var docViewBottom = docViewTop + this.app.$win.height();
        var elemTop = $el.offset().top;
        var elemBottom = elemTop + $el.height();
        tolerance = tolerance || 0;

        return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom) && (elemBottom <= (docViewBottom + tolerance)) &&  (elemTop >= docViewTop));
    },

    // empty
    isEmpty: function(el) {

        el = this.dom(el).get();

        if (el) {
            return (el.nodeType === 3) ? (el.textContent.trim().replace(/\n/, '') === '') : (el.innerHTML === '');
        }
        else {
            return false;
        }
    },
    isEmptyHtml: function(html, keepbr) {
        html = this.removeInvisibleChars(html);
        html = html.replace(/&nbsp;/gi, '');
        html = html.replace(/<\/?br\s?\/?>/g, ((keepbr) ? 'br' : ''));
        html = html.replace(/\s/g, '');
        html = html.replace(/^<p>[^\W\w\D\d]*?<\/p>$/i, '');
        html = html.replace(/^<div>[^\W\w\D\d]*?<\/div>$/i, '');
        html = html.replace(/<hr(.*?[^>])>$/i, 'hr');
        html = html.replace(/<iframe(.*?[^>])>$/i, 'iframe');
        html = html.replace(/<source(.*?[^>])>$/i, 'source');

        // remove empty tags
        html = html.replace(/<[^\/>][^>]*><\/[^>]+>/gi, '');
        html = html.replace(/<[^\/>][^>]*><\/[^>]+>/gi, '');

        // trim
        html = html.trim();

        return (html === '');
    },


    // tags & elements
    isEmptyOrImageInline: function(el) {
        var node = this.dom(el).get();
        if (!node || node.nodeType === 3) {
            return false;
        }

        var tag = node.tagName.toLowerCase();
        var tags = ['svg', 'img'];
        var noeditattr = (node.getAttribute('contenteditable') === 'false');
        var isInline = this.isInline(node);
        if (
                (isInline && this.isEmpty(node)) ||
                (isInline && noeditattr) ||
                (tags.indexOf(tag) !== -1)
            ) {
            return true;
        }

        return false;
    },
    isInlineTag: function(tag, extend) {
        return (this._isTag(tag) && this._isInlineTag(tag, extend));
    },
    isBlockTag: function(tag, extend) {
        return (this._isTag(tag) && this._isBlockTag(tag, extend));
    },
    isListTag: function(tag) {
        return (['ul', 'ol'].indexOf(tag.toLowerCase()) !== -1);
    },
    isHeadingTag: function(tag) {
        return (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].indexOf(tag.toLowerCase()) !== -1);
    },
    isText: function(el) {
        return (typeof el === 'string' && !/^\s*<(\w+|!)[^>]*>/.test(el)) ? true : this.isTextNode(el);
    },
    isTextNode: function(el) {
        var node = this.dom(el).get();

        return (node && node.nodeType && node.nodeType === 3);
    },
    isElement: function(el) {
        var node = this.dom(el).get();

        return this._isElement(node);
    },
    isInline: function(el) {
        var node = this.dom(el).get();

        return (this._isElement(node) && this._isInlineTag(node.tagName));
    },
    isBlock: function(el) {
        var node = this.dom(el).get();

        return (this._isElement(node) && this._isBlockTag(node.tagName));
    },

    // invisible chars
    createInvisibleChar: function() {
        return document.createTextNode(this.opts.markerChar);
    },
    searchInvisibleChars: function(str) {
        return str.search(/^\uFEFF$/g);
    },
    removeInvisibleChars: function(html) {
        return html.replace(/\uFEFF/g, '');
    },

    // string
    capitalize: function(str) {
        str = str.toLowerCase();

        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // escape
    escapeRegExp: function(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    },

    // random
    getRandomId: function() {
        var id = '';
        var possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

        for (var i = 0; i < 12; i++) {
            id += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return id;
    },

    // wrapper
    createWrapper: function(html) {
        var $wrapper = this.dom('<div>');
        $wrapper.html(html);

        return $wrapper;
    },
    getWrapperHtml: function($wrapper) {
        var html = $wrapper.html();
        $wrapper.remove();

        return html;
    },

    // fragment
    createTmpContainer: function(html) {
        var $div = this.dom('<div>');

        if (typeof html === 'string') $div.html(html);
        else $div.append(this.dom(html).clone(true));

        return $div.get();
    },
    createFragment: function(html) {
        var el = this.createTmpContainer(html);
        var frag = document.createDocumentFragment(), node, firstNode, lastNode;
        var nodes = [];
        var i = 0;
        while ((node = el.firstChild)) {
            i++;
            var n = frag.appendChild(node);
            if (i === 1) firstNode = n;

            nodes.push(n);
            lastNode = n;
        }

        return { frag: frag, first: firstNode, last: lastNode, nodes: nodes };
    },
    isFragment: function(obj) {
        return (typeof obj === 'object' && obj.frag);
    },

    // attributes
    removeEmptyAttr: function(el, attr) {
        var $el = this.dom(el);

        if (typeof $el.attr(attr) === 'undefined' || $el.attr(attr) === null) {
            return true;
        }
        else if ($el.attr(attr) === '') {
            $el.removeAttr(attr);
            return true;
        }

        return false;
    },
    cloneAttributes: function(elFrom, elTo) {

        elFrom = this.dom(elFrom).get();
        elTo = this.dom(elTo);

        var attrs = elFrom.attributes;
        var len = attrs.length;
        while (len--) {
            var attr = attrs[len];
            elTo.attr(attr.name, attr.value);
        }

        return elTo;
    },

    // replace
    replaceToTag: function(node, tag) {
        var self = this;
        var $node = this.dom(node);
        return $node.replaceWith(function(node) {
            var $replaced = self.dom('<' + tag + '>').append(self.dom(node).contents());
            if (node.attributes) {
                var attrs = node.attributes;
                for (var i = 0; i < attrs.length; i++) {
                    $replaced.attr(attrs[i].nodeName, attrs[i].value);
                }
            }

            return $replaced;
        });
    },

    // split node
    splitNode: function(el) {
        var selection = this.app.create('selection');
        var sel = selection.get();
        if (!sel.collapsed) {
            sel.range.deleteContents();
        }

        var $element = this.dom(el);
        var element = $element.get();
        var tag = element.tagName.toLowerCase();
        var extractedContent = this.extractHtmlFromCaret(element);
        var $secondPart = this.dom('<' + tag + ' />');
        $secondPart = this.cloneAttributes(element, $secondPart);
        $element.after($secondPart.append(extractedContent));

        return $secondPart;
    },
    extractHtmlFromCaret: function(el) {
        var element = this.dom(el).get();
        var selection = this.app.create('selection');
        var sel = selection.get();
        if (sel.range) {
            var clonedRange = sel.range.cloneRange();
            clonedRange.selectNodeContents(element);
            clonedRange.setStart(sel.range.endContainer, sel.range.endOffset);

            return clonedRange.extractContents();
        }
    },

    // arrays
    removeFromArrayByValue: function(arr, val) {
        val = (Array.isArray(val)) ? val : [val];
        var index;
        for (var i = 0; i < val.length; i++) {
            index = arr.indexOf(val[i]);
            if (index > -1) arr.splice(index, 1);
        }
        return arr;
    },
    sumOfArray: function(arr) {
        return arr.reduce(function(a, b) {
            return parseInt(a) + parseInt(b);
        }, 0);
    },

    // sanitize
    sanitize: function(html) {
        var $div = this.dom('<div>');
        $div.html(html);
        $div.find('[src]').each(function(node) {
            var str = node.getAttribute('src');
            if (str.search(/^data:/i) !== -1) node.setAttribute('src', '');
            if (str.search(/^javascript:/i) !== -1) node.setAttribute('src', '');
        });

        $div.find('a').each(function(node) {
            var str = node.getAttribute('href');
            if (str && str.search(/^javascript:/i) !== -1) {
                node.setAttribute('href', '');
            }
        });

        $div.find('svg, img').each(function(node) {
            node.removeAttribute('onload');
        });

        html = $div.html();
        $div.remove();

        return html;
    },
    escapeHtml: function(html) {
        return String(html).replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    // data
    extendData: function(data, obj) {
        for (var key in obj) {
            if (key === 'elements') {
                var $elms = this.dom(obj[key]);
                $elms.each(function(node) {
                    var $node = this.dom(node);
                    if (node.tagName === 'FORM') {
                        var serializedData = $node.serialize(true);
                        for (var z in serializedData) {
                            data = this._setData(data, z, serializedData[z]);
                        }
                    }
                    else {
                        var name = ($node.attr('name')) ? $node.attr('name') : $node.attr('id');
                        data = this._setData(data, name, $node.val());
                    }
                }.bind(this));
            }
            else {
                data = this._setData(data, key, obj[key]);
            }
        }

        return data;
    },

    // private
    _isElement: function(node) {
        return (node && node.nodeType && node.nodeType === 1);
    },
    _isBlockTag: function(tag, extend) {
        return (this._extendTags(this.opts.tags.block, extend).indexOf(tag.toLowerCase()) !== -1);
    },
    _isInlineTag: function(tag, extend) {
        return (this._extendTags(this.opts.tags.inline, extend).indexOf(tag.toLowerCase()) !== -1);
    },
    _isTag: function(tag) {
        return (tag !== undefined && tag);
    },
    _extendTags: function(tags, extend) {
        tags = tags.concat(tags);

        if (extend) {
            for (var i = 0 ; i < extend.length; i++) {
                tags.push(extend[i]);
            }
        }

        return tags;
    },
    _setData: function(data, name, value) {
        if (data instanceof FormData) data.append(name, value);
        else data[name] = value;

        return data;
    },
    _isCodemirror: function(options) {
        var opts;
        if (!options || !options.hasOwnProperty('codemirror')) {
            options = this.opts;
        }

        if (typeof options === 'object' && options.hasOwnProperty('codemirror') && options.codemirror) {
            opts = (typeof options.codemirror === 'object') ? options.codemirror : {};
        }

        return opts;

    }
});
ArticleEditor.add('class', 'block.cell', {
    mixins: ['block'],
    type: 'cell',
    buttons: {
        'format': {
            title: '## buttons.format ##',
            popup: {
                name: 'format',
                list: true,
                inline: {
                    type: 'list',
                    observer: 'inline.observe',
                    builder: 'inline.buildPopup'
                },
                link: {
                    type: 'list',
                    observer: 'link.observe',
                    builder: 'link.buildPopup'
                },
                align: {
                    type: 'group',
                    observer: 'block.observe',
                    builder: 'block.buildPopup',
                    title: '## buttons.align ##'
                }
            }
        },
        'table': {
            title: '## buttons.table ##',
            popup: {
                name: 'table',
                list: true,
                cell: {
                    type: 'group',
                    builder: 'table.buildPopup',
                    title: '## buttons.cell ##'
                },
                row: {
                    type: 'group',
                    builder: 'table.buildPopup',
                    title: '## buttons.row ##'
                }
            }
        },
        'config': {
            title: '## buttons.config ##',
            command: 'table.buildConfig'
        }
    },
    getWidth: function() {
        var value = this.$block.attr('width');

        return (value) ? value : '';
    },
    getNowrap: function() {
        var value = this.$block.css('white-space');

        return (value === 'nowrap');
    },
    setWidth: function(value) {
        this._eachCell(function($cell) {
            if (value === '') {
                $cell.removeAttr('width');
            }
            else {
                $cell.attr('width', value);
            }
        });
    },
    setNowrap: function(value) {
        this._eachCell(function($cell) {
            value = (value) ? 'nowrap' : '';
            $cell.css('white-space', value);
        });
    },

    // input
    handleEnter: function(e, event, sel, input) {
        // block selected
        if (this.isSelectedAll()) {
            return input.makeEmpty(this);
        }
        // remove selected
        else if (sel.range && !sel.collapsed) {
            return input.deleteContents(sel.range);
        }
        // all cases
        else {
            return input.insertBreakline();
        }
    },
    handleArrow: function(e, event, sel, input) {

        var caret = this.app.create('caret');
        var $parent = this.getParent('table');
        var isParentStart = caret.is('start', $parent);
        var isParentEnd = caret.is('end', $parent);

        if ((isParentStart && event.is('up-left')) || (isParentEnd && event.is('down-right'))) {
            return this.app.block.set($parent);
        }
        else if (!isParentStart && this.isStart() && event.is('up-left')) {
            var prev = this.app.block.prev();
            if (prev) {
                return this.app.block.set(prev.$block);
            }
            else {
                var $parentRow = this.$block.parent();
                var $prevRow = $parentRow.prevElement();
                if ($prevRow.length !== 0) {
                    var $cell = $prevRow.children('td, th').last();
                    return this.app.block.set($cell, 'end');
                }
            }
        }
        else if (!isParentEnd && this.isEnd() && event.is('down-right')) {
            var next = this.app.block.next();
            if (next) {
                return this.app.block.set(next.$block);
            }
            else {
                var $parentRow = this.$block.parent();
                var $nextRow = $parentRow.nextElement();
                if ($nextRow.length !== 0) {
                    var $cell = $nextRow.children('td, th').first();
                    return this.app.block.set($cell, 'start');
                }
            }
        }
    },

    // private
    _eachCell: function(func) {
        var index = 0;
        var content = this.app.create('content');
        var $table = this.$block.closest('table');
        var $row = this.$block.closest('tr');
        $row.find('td, th').each(function(node, i) {
			if (node === this.$block.get()) index = i;
		}.bind(this));

		$table.find('tr').each(function(node) {
			var $node = this.dom(node);
			var cell = $node.find('td, th').get(index);
			var $cell = this.dom(cell);

            func($cell);
            content.cacheBlocksStyle($cell);

		}.bind(this))
    },
    _parse: function(element) {
        var $block;
        if (typeof element === 'undefined') {
            $block = this.dom('<td>');
        }
        else {
            $block = this.dom(element);
        }

        return $block;
    }
});
ArticleEditor.add('class', 'block.code', {
    mixins: ['block'],
    type: 'code',
    buttons: {},

    // private
    _parse: function(element) {
        var $block;
        if (typeof element === 'undefined') {
            $block = this.dom(this.opts.code.template);
        }
        else {
            $block = this.dom(element);
        }

        return $block;
    }
});
ArticleEditor.add('class', 'block.column', {
    mixins: ['block'],
    type: 'column',
    buttons: {
        'format': {
            title: '## buttons.format ##',
            popup: {
                name: 'format',
                list: true,
                align: {
                    type: 'group',
                    observer: 'block.observe',
                    builder: 'block.buildPopup',
                    title: '## buttons.align ##'
                }
            }
        }
    },

    // input
    handleArrow: function(e, event, sel, input) {
        var $parent = this.getParent('[data-arx-type=grid]');
        this.app.block.set($parent);
        return true;
    },

    // private
    _parse: function(element) {
        return this.dom(element);
    }
});
ArticleEditor.add('class', 'block.embed', {
    mixins: ['block'],
    type: 'embed',
    buttons: {
        'format': {
            title: '## buttons.format ##',
            popup: {
                name: 'format',
                list: true,
                align: {
                    type: 'group',
                    builder: 'block.buildPopup',
                    observer: 'block.observe',
                    title: '## buttons.align ##'
                }
            }
        }
    },

    // private
    _parse: function(element) {
        return this.dom(element);
    }
});
ArticleEditor.add('class', 'block.figcaption', {
    mixins: ['block'],
    type: 'figcaption',
    buttons: {
        'format': {
            title: '## buttons.format ##',
            popup: {
                name: 'format',
                list: true,
                inline: {
                    type: 'list',
                    observer: 'inline.observe',
                    builder: 'inline.buildPopup'
                },
                link: {
                    type: 'list',
                    observer: 'link.observe',
                    builder: 'link.buildPopup'
                },
                align: {
                    type: 'group',
                    observer: 'block.observe',
                    builder: 'block.buildPopup',
                    title: '## buttons.align ##'
                }
            }
        }
    },

    // input
    handleEnter: function(e, event, sel, input) {

        // caret start or end
        if (this.isStart() || this.isEnd()) {
            return true;
        }
        // caret inside & collapsed or ctrl/shift + enter
        else if (sel.collapsed || (e.shiftKey || e.ctrlKey)) {
            return input.insertBreakline();
        }
        // block selected
        else if (this.isSelectedAll()) {
            return input.makeEmpty(this);
        }
        // remove selected
        if (sel.range) {
            return input.deleteContents(sel.range);
        }

        return true;
    },
    handleArrow: function(e, event, sel, input) {

        if ((event.is('up-left') && this.isStart()) || (event.is('down-right') && this.isEnd())) {
            var $parent = this.getParent('figure');
            this.app.block.set($parent);
            return true;
        }
    },

    // private
    _parse: function(element) {
        var $block;
        if (typeof element === 'undefined') {
            $block = this.dom('<figcaption>');
        }
        else {
            $block = this.dom(element);
        }

        return $block;
    }
});
ArticleEditor.add('class', 'block.grid', {
    mixins: ['block'],
    type: 'grid',
    buttons: {
        'format': {
            title: '## buttons.format ##',
            popup: {
                name: 'format',
                list: true,
                valign: {
                    type: 'group',
                    observer: 'block.observe',
                    builder: 'block.buildPopup',
                    title: '## buttons.valign ##'
                },
                removegrid: {
                    title: '## buttons.transform-to-text ##',
                    command: 'grid.transform'
                }
            }
        }
    },

    // private
    _parse: function(element) {
        var $block = this.dom(element);

        if (this.opts.grid && this.opts.grid.overlay) {
            $block.addClass('arx-grid-overlay');
        }

        return $block;
    }
});
ArticleEditor.add('class', 'block.heading', {
    mixins: ['block'],
    type: 'heading',
    buttons: {
        'format': {
            title: '## buttons.format ##',
            popup: {
                name: 'format',
                list: true,
                inline: {
                    type: 'list',
                    observer: 'inline.observe',
                    builder: 'inline.buildPopup'
                },
                link: {
                    type: 'list',
                    observer: 'link.observe',
                    builder: 'link.buildPopup'
                },
                block: {
                    type: 'list',
                    observer: 'block.observe',
                    builder: 'block.buildPopup'
                },
                align: {
                    type: 'group',
                    builder: 'block.buildPopup',
                    observer: 'block.observe',
                    title: '## buttons.align ##'
                }
            }
        }
    },
    getName: function() {
        var name = '';
        var tag = this.getTag();
        var titles = this.opts.format;

        if (typeof titles[tag] !== 'undefined') {
            name = titles[tag].title.replace(/(<([^>]+)>)/gi, '');
            name = this.lang.parse(name);
        }
        else {
            titles = this.lang.get('headings');
            name = titles[tag]
        }

        return name;
    },

    // private
    _parse: function(element) {
        var $block;
        if (typeof element === 'undefined') {
            $block = this.dom('<h1>');
        }
        else {
            $block = this.dom(element);
        }

        return $block;
    }
});
ArticleEditor.add('class', 'block.image', {
    mixins: ['block'],
    type: 'image',
    buttons: {
        'format': {
            title: '## buttons.format ##',
            popup: {
                name: 'format',
                list: true,
                align: {
                    type: 'group',
                    builder: 'block.buildPopup',
                    observer: 'block.observe',
                    title: '## buttons.align ##'
                },
                outset: {
                    type: 'group',
                    builder: 'block.buildPopup',
                    observer: 'block.observe',
                    title: '## buttons.outset ##'
                }
            }
        },
        'config': {
            title: '## buttons.config ##',
            command: 'image.buildConfig'
        }
    },
    getAlt: function() {
        var alt = this.getImage().attr('alt');

        return (alt) ? alt : '';
    },
    getLink: function() {
        var data = false;
        var $link = this._getLink();
        if ($link) {
            data = {
                url: $link.attr('href'),
                target: $link.attr('target'),
            };
        }

        return data;
    },
    setAlt: function(value) {
        this.getImage().attr('alt', value);
    },
    setLink: function(data) {

        var $link = this._getLink();
        if (!$link) {
            var $img = this.getImage();
            $link = this.dom('<a>');
            $img.wrap($link);
        }

        $link.attr('href', data.url);

        if (data.target === false) {
            $link.removeAttr('target');
        }
        else {
            $link.attr('target', (data.target === true) ? '_blank' : data.target);
        }
    },
    setImage: function(data) {
        var $img = this.getImage();
        $img.attr('src', data.url);
        if (data.hasOwnProperty('id')) {
            $img.attr('data-image', data.id);
        }
    },
    removeLink: function() {
        var $link = this._getLink();
        if ($link) {
            $link.unwrap();
        }
    },
    getImage: function() {
        return this.$block.find('img');
    },

    // private
    _getLink: function() {
        var $link = this.getImage().parent();
        if ($link.get().tagName !== 'A') {
            $link = false;
        }

        return $link;
    },
    _parse: function(element) {
        return this.dom(element);
    }
});
ArticleEditor.add('class', 'block.layer', {
    mixins: ['block'],
    type: 'layer',
    buttons: {},

    // private
    _parse: function(element) {
        var $block;
        if (typeof element === 'undefined') {
            var content = this.app.create('content');
            var template = content.parse(this.opts.layer.template);
            $block = this.dom(template);
            $block.addClass('arx-empty-layer');
        }
        else {
            $block = this.dom(element);
        }

        return $block;
    }
});
ArticleEditor.add('class', 'block.line', {
    mixins: ['block'],
    type: 'line',
    buttons: {},

    // private
    _parse: function(element) {
        var $block;
        if (typeof element === 'undefined') {
            $block = this.dom('<hr>');
        }
        else {
            $block = this.dom(element);
        }

        return $block;
    }
});
ArticleEditor.add('class', 'block.list', {
    mixins: ['block'],
    type: 'list',
    buttons: {
        'format': {
            title: '## buttons.format ##',
            popup: {
                name: 'format',
                list: true,
                inline: {
                    type: 'list',
                    builder: 'inline.buildPopup'
                },
                link: {
                    type: 'list',
                    observer: 'link.observe',
                    builder: 'link.buildPopup'
                },
                block: {
                    type: 'list',
                    observer: 'block.observe',
                    builder: 'block.buildPopup'
                },
                align: {
                    type: 'group',
                    builder: 'block.buildPopup',
                    observer: 'block.observe',
                    title: '## buttons.align ##'
                }
            }
        },
        'indent': {
            title: '&gt; ## list.indent ##',
            command: 'list.indent'
        },
        'outdent': {
            title: '&lt; ## list.outdent ##',
            command: 'list.outdent'
        }
    },
    isEmpty: function() {
        var $items = this.$block.children('li');
        var utils = this.app.create('utils');
        return ($items.length === 1 && utils.isEmptyHtml($items.eq(0).html()));
    },
    empty: function() {
        var $item = this.dom('<li>');
        this.$block.html('').append($item);
        return $item;
    },
    createItem: function($current, position, focus) {
        position = position || 'after';

        var $newItem = this.dom('<li></li>');
        $current[position]($newItem);

        if (focus !== false) {
            var caret = this.app.create('caret');
            caret.set('start', $newItem);
        }

        return $newItem;
    },
    splitItem: function($item) {
        var caret = this.app.create('caret');
        var utils = this.app.create('utils');
        var $newblock = utils.splitNode($item);
        var $clonedblock = $newblock.clone();
        $clonedblock.find('ol, ul').remove();
        if (utils.isEmptyHtml($clonedblock.html())) {
            $newblock.prepend('&nbsp;');
        }

        caret.set('start', $newblock);
        return true;
    },

    // input
    handleEnter: function(e, event, sel, input) {

        // current item
        var caret = this.app.create('caret');
        var selection = this.app.create('selection');
        var $current = this.dom(selection.getBlock());
        var $prevItem = $current.prev();
        var isCurrentStart = caret.is('start', $current);
        var isCurrentEnd = caret.is('end', $current);

        // ctrl/shift + enter
        if (e.shiftKey || e.ctrlKey) {
            return input.insertBreakline();
        }
        // block selected
        else if (this.isSelectedAll()) {
            return input.makeEmpty(this);
        }
        // caret end list & item
        else if (this.isEnd() || isCurrentEnd) {
            var utils = this.app.create('utils');
            var $newItem = this.createItem($current);

            if (this.isEnd()) {
                var $prev = $newItem.prev();
                var $parent = $newItem.parents('ul, ol', this.$block).last();
                var isEmpty = (utils.isEmptyHtml($newItem.html()) && utils.isEmptyHtml($prev.html()));

                // check exit
                if ($prev.length !== 0 && isEmpty) {
                    if ($parent.length === 0) {
                        $newItem.remove();
                        $prev.remove();
                        var instance = this.app.block.create();
                        this.app.block.add(instance);
                        return true;
                    }
                    else {
                        var $parentItem = $newItem.parents('li', this.$block).first();
                        $newItem.remove();
                        $prev.remove();
                        return this.createItem($parentItem);
                    }
                }
            }

            return true;
        }
        // caret start list
        else if (this.isStart() || isCurrentStart) {
            return this.createItem($current, 'before', false);
        }
        // caret inside & collapsed
        else if (sel.collapsed) {
            return this.splitItem($current);
        }
        // remove selected & uncollapsed
        else if (sel.range && !sel.collapsed) {
            return input.deleteContentsAndCollapse(sel.range);
        }

        return true;
    },
    handleDelete: function(e, event, sel, input) {
        var types = ['paragraph', 'heading', 'text'];
        var next = this.app.block.next();
        var prev = this.app.block.prev();
        var caret = this.app.create('caret');
        var utils = this.app.create('utils');
        var selection = this.app.create('selection');
        var $currentItem = this.dom(selection.getBlock());

        // block selected
        if (this.isSelectedAll()) {
            return input.makeEmpty(this);
        }

        // remove empty item
        if (!this.isStart() && !this.isEnd() && event.is('backspace') && utils.isEmptyHtml($currentItem.html())) {
            var $prevItem = $currentItem.prev();
            caret.set('end', $prevItem);
            $currentItem.remove();
            return true;
        }

        // prev editable
        if (prev && types.indexOf(prev.getType()) !== -1 && this.isStart() && event.is('backspace')) {
            caret.set('end', prev.$block);
            var $item = this.$block.find('li').first();
            $item.find('ul, ol, li').unwrap();
            var html = $item.html();
            prev.$block.append(html);
            $item.remove();
            this.app.block.set(prev.$block);
            return true;
        }

        // next editable
        if (next && types.indexOf(next.getType()) !== -1 && this.isEnd() && event.is('delete')) {
            var html = next.$block.html();
            var $item = this.$block.find('li').last();
            $item.append(html);
            next.remove(false);
            return true;
        }
    },

    // private
    _parse: function(element) {
        var $block;
        if (typeof element === 'undefined') {
            $block = this.dom('<ul>');
            $block.append('<li></li>');
        }
        else {
            $block = this.dom(element);
        }

        return $block;
    }
});
ArticleEditor.add('class', 'block.noneditable', {
    mixins: ['block'],
    type: 'noneditable',
    buttons: {},

    // private
    _parse: function(element) {
        var $block;
        if (typeof element === 'undefined') {
            $block = this.dom('<div>');
            $block.addClass(this.opts.noneditable.classname);
        }
        else {
            $block = this.dom(element);
        }

        return $block;
    }
});
ArticleEditor.add('class', 'block.paragraph', {
    mixins: ['block'],
    type: 'paragraph',
    buttons: {
        'format': {
            title: '## buttons.format ##',
            popup: {
                name: 'format',
                list: true,
                inline: {
                    type: 'list',
                    observer: 'inline.observe',
                    builder: 'inline.buildPopup'
                },
                link: {
                    type: 'list',
                    observer: 'link.observe',
                    builder: 'link.buildPopup'
                },
                block: {
                    type: 'list',
                    observer: 'block.observe',
                    builder: 'block.buildPopup'
                },
                align: {
                    type: 'group',
                    builder: 'block.buildPopup',
                    observer: 'block.observe',
                    title: '## buttons.align ##'
                }
            }
        }
    },

    // private
    _parse: function(element) {
        var $block;
        if (typeof element === 'undefined') {
            $block = this.dom('<p>');
        }
        else {
            $block = this.dom(element);
        }

        return $block;
    }
});
ArticleEditor.add('class', 'block.quote', {
    mixins: ['block'],
    type: 'quote',
    buttons: {},

    // private
    _parse: function(element) {
        var $block;
        if (typeof element === 'undefined') {
            var content = this.app.create('content');
            var template = content.parse(this.opts.quote.template);
            $block = this.dom(template);
        }
        else {
            $block = this.dom(element);
        }

        return $block;
    }
});
ArticleEditor.add('class', 'block.quoteitem', {
    mixins: ['block'],
    type: 'quoteitem',
    buttons: {
        'format': {
            title: '## buttons.format ##',
            popup: {
                name: 'format',
                list: true,
                inline: {
                    type: 'list',
                    observer: 'inline.observe',
                    builder: 'inline.buildPopup'
                },
                link: {
                    type: 'list',
                    observer: 'link.observe',
                    builder: 'link.buildPopup'
                },
                align: {
                    type: 'group',
                    builder: 'block.buildPopup',
                    observer: 'block.observe',
                    title: '## buttons.align ##'
                }
            }
        }
    },

    // input
    handleArrow: function(e, event, sel, input) {

        var $parent = this.getParent('[data-arx-type=quote]');

        if (this.isStart() && event.is('up-left')) {
            var prev = this.app.block.prev();
            var $target = (prev) ? prev.$block : $parent;

            return this.app.block.set($target);
        }
        else if (this.isEnd() && event.is('down-right')) {
            var next = this.app.block.next();
            var $target = (next) ? next.$block : $parent;

            return this.app.block.set($target);
        }
    },

    // private
    _parse: function(element) {
        var $block;
        if (typeof element === 'undefined') {
            $block = this.dom('<p>');
        }
        else {
            $block = this.dom(element);
        }

        return $block;
    }
});
ArticleEditor.add('class', 'block.row', {
    mixins: ['block'],
    type: 'row',
    buttons: {
        'table': {
            title: '## buttons.table ##',
            popup: {
                name: 'table',
                list: true,
                row: {
                    type: 'group',
                    builder: 'table.buildPopup',
                    title: '## buttons.row ##'
                }
            }
        },
    },

    // input
    handleEnter: function(e, event, sel, input) {
        return true;
    },
    handleArrow: function(e, event, sel, input) {
        var $parent = this.getParent('table');
        this.app.block.set($parent);
        return true;
    },

    // private
    _parse: function(element) {
        return this.dom(element);
    }
});
ArticleEditor.add('class', 'block.snippet', {
    mixins: ['block'],
    type: 'snippet',
    buttons: {},

    // private
    _parse: function(element) {
        return this.dom(element);
    }
});
ArticleEditor.add('class', 'block.table', {
    mixins: ['block'],
    type: 'table',
    buttons: {
        'table': {
            title: '## buttons.table ##',
            popup: {
                name: 'table',
                list: true,
                head: {
                    type: 'group',
                    builder: 'table.buildPopup',
                    title: '## buttons.head ##'
                }
            }
        },
    },

    // private
    _parse: function(element) {
        var $block;
        if (typeof element === 'undefined') {
            $block = this.dom('<table>');
        }
        else {
            $block = this.dom(element);
        }

        return $block;
    }
});
ArticleEditor.add('class', 'block.text', {
    mixins: ['block'],
    type: 'text',
    buttons: {
        'format': {
            title: '## buttons.format ##',
            popup: {
                name: 'format',
                list: true,
                inline: {
                    type: 'list',
                    observer: 'inline.observe',
                    builder: 'inline.buildPopup'
                },
                link: {
                    type: 'list',
                    observer: 'link.observe',
                    builder: 'link.buildPopup'
                },
                block: {
                    type: 'list',
                    observer: 'block.observe',
                    builder: 'block.buildPopup'
                },
                align: {
                    type: 'group',
                    observer: 'block.observe',
                    builder: 'block.buildPopup',
                    title: '## buttons.align ##'
                }
            }
        }
    },

    // private
    _parse: function(element) {
        var $block;
        if (typeof element === 'undefined') {
            $block = this.dom('<div>');
            $block.addClass(this.opts.plaintext.classname);
        }
        else {
            $block = this.dom(element);
        }

        return $block;
    }
});

    window.ArticleEditor = ArticleEditor;

    // Data attribute load
    window.addEventListener('load', function() {
        ArticleEditor('[data-article-editor]');
    });

    // Export for webpack
    if (typeof module === 'object' && module.exports) {
        module.exports = ArticleEditor;
        module.exports.ArticleEditor = ArticleEditor;
    }
}());