'use strict';

var Ressource = require('./ressource'),
    Action = require('./action'),
    Subject = require('./subject'),
    Policy = require('./policy')
;

class Engine {
    constructor (config) {
        this.config = config;

        this.ressources = {};
        this.subjects = {};
        this.actions = {};

        this.rootPolicy = new Policy({});

        this.rootPolicy.combine('firstMatch');
    }

    policy (config) {
        return this.rootPolicy.policy(config);
    }

    can (subject, action, ressource, context) {
        if (typeof action === 'object' && !(action instanceof Action)) {
            let obj = {};
            Object.keys(action).forEach(function (act) {
                obj[act] = this.can(subject, action[act], ressource, context);
            }, this);

            return obj;
        }

        return this.rootPolicy.resolve({
            subject,
            action,
            ressource,
            context,
        });
    }

    addRessource (id, ressource) {
        ressource.config.id = id;
        this.ressources[id] = ressource;
    }

    addSubject (id, subject) {
        subject.config.id = id;
        this.subjects[id] = subject;
    }

    addAction (id, action) {
        action.config.id = id;
        this.actions[id] = action;
    }

    register (id, object) {
        if (typeof object !== 'object') {

        } else if (object instanceof Ressource) {
            this.addRessource(id, object);
        } else if (object instanceof Action) {
            this.addAction(id, object);
        } else if (object instanceof Subject) {
            this.addSubject(id, object);
        } else {
            Object.keys(object).forEach(function (prop) {
                this.add(prop, object[prop]);
            }, this);
        }

        return object;
    }
}

Engine.DEFAULT_CONFIG = {

}

module.exports = Engine