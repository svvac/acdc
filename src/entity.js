'use strict';

let _entityCount = 0;

class Entity {
    constructor (config) {
        this.config = config || {};

        this.config.id = this.config.id || 'entity' + (++_entityCount);

        this.instances = {};

        var self = this;

        this.Instance = function (id, source) {
            Instance.call(this);

            this.$sourceObject = source;
            this.$id = id;
            this.$entity = self;

            this.$entity.config.attributes.forEach(function (attr) {
                this[attr] = attr in source ? source[attr] : null;
            }, this);
        };

        this.Instance.prototype = Object.create(Instance.prototype);
    }

    from (source, save) {
        save = save === undefined ? true : !!save;

        let id = this.config.id + ':' + source.id;
        let instance = new this.Instance(id, source);

        if (save) {
            this.instances[id] = instance;
        }

        return instance;
    }

    toString () {
        return '[Entity:' + this.config.id + ']';
    }
}

function Instance () {
    this.$entity = null;
    this.$id = null;
    this.$sourceObject = {};
}

Instance.prototype.$equals = function (other) {
    //console.log('EQUALS', this, other);

    if (typeof other === 'string') {
        return other === this.$id;
    } else if (typeof other === 'object' && other instanceof Instance) {
        return other === this
            || other.$entity === this.$entity && other.$id === this.$id;
    } else {
        return false;
    }
};

Instance.prototype.toString = function () {
    let id = this.$id;

    let s = new String('<' + this.$id + '>');

    Object.defineProperty(s, 'bold', {
        get: function () {
            let idx = id.indexOf(':') + 1,
                t = id.substr(0, idx),
                i = id.substring(idx);
            return '<' + t + i.cyan + '>';
        }
    });

    return s;
};

Entity.Instance = Instance;

Entity.DEFAULT_CONFIG = {

}


module.exports = Entity;