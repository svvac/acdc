'use strict';

class Entity {
    constructor (config) {
        this.config = config;

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

    from (source, engine) {
        return new this.Instance(this.config.id + ':' + source.id,
                                 source);
        
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
    return this.$entity.config.id + 'EntityInstance: ' + this.$id;
};

Instance.prototype.toSource = function () {
    return '<' + this.toString() + '>';
};

Entity.Instance = Instance;

Entity.DEFAULT_CONFIG = {

}


module.exports = Entity