'use strict';
const colors = require('colors');
const Ressource = require('./ressource'),
      Action = require('./action'),
      Subject = require('./subject'),
      Policy = require('./policy'),
      utils = require('./utils');

class Engine {
    constructor (config) {
        this.config = config;

        this.ressources = {};
        this.subjects = {};
        this.actions = {};

        // Once upon a time there was a wild land
        this.rootPolicy = new Policy({ id: 'root', target: true });
        this.rootPolicy.combine('OnlyOneMatch');

        // And there came a race of giants led by their king, Zero
        let Root = this.register('root', new Subject({ attributes: [ 'id' ]}));
        this.root = Root.from({ id: 0 });

        // And they took the ground as if it was their own and claimed:
        // “nothing shall be denied to us”
        this.rule({
            id: 'builtin:root is almighty',
            target: { subject: Root },
            method: 'allow',
            condition: true,
        });
    }

    policy (pol) {
        return this.rootPolicy.policy(pol);
    }

    rule (rul) {
        return this.rootPolicy.rule(rul);
    }

    can (subject, action, ressource, context, debug) {
        if (debug) {
            console.log(
                'CAN'.bold,
                subject.toString().bold,
                action.toString().yellow,
                ressource.toString().bold,
                'when',
                JSON.stringify(context),
                '?');
        }

        let ret = this.rootPolicy.resolve({
            subject,
            action,
            ressource,
            context,
        }, debug === true ? '| '.black : false);

        if (debug) {
            console.log('=>', utils.logVerdict(ret));
        }

        return ret;
    }

    cans (subjects, actions, ressources, contexts, debug) {
        if (!Array.isArray(subjects)) subjects = [ subjects ];
        if (!Array.isArray(actions)) actions = [ actions ];
        if (!Array.isArray(ressources)) ressources = [ ressources ];
        if (!Array.isArray(contexts)) contexts = [ contexts ];

        let results = [];

        for (let s = 0; s < subjects  .length; s++) {
        for (let a = 0; a < actions   .length; a++) {
        for (let r = 0; r < ressources.length; r++) {
        for (let c = 0; c < contexts  .length; c++) {
            results.push({
                case: {
                    subject:    subjects[s],
                    ressource:  ressources[r],
                    action:     actions[a],
                    context:    contexts[c],
                },
                verdict: this.can(subjects[s], actions[a], ressources[r], contexts[c], debug),
            });
        }}}}

        return results;
    }

    table(subjects, actions, ressources, contexts, debug) {
        if (!Array.isArray(subjects)) subjects = [ subjects ];
        if (!Array.isArray(actions)) actions = [ actions ];
        if (!Array.isArray(ressources)) ressources = [ ressources ];
        if (!Array.isArray(contexts)) contexts = [ contexts ];

        let lens = {
            subject: subjects.reduce(function (len, o) {
                return Math.max(len, o.toString().length); }, 7),
            action: actions.reduce(function (len, o) {
                return Math.max(len, o.toString().length); }, 6),
            ressource: ressources.reduce(function (len, o) {
                return Math.max(len, o.toString().length); }, 9),
            context: contexts.reduce(function (len, o) {
                return Math.max(len, JSON.stringify(o).length); }, 7),
        };

        var rcolor = /\u001b\[\d+m/gm;
        function viewedLength(str) {
            return String(str).replace(rcolor, '').length;
        }

        function pad (len, str) {
            let strlen = viewedLength(str);

            if (strlen >= len) return str;
            else return str + ' '.repeat(len - strlen);
        }

        let lines = this.cans(subjects, actions, ressources, contexts, debug);

        console.log(
            pad(lens.subject, 'SUBJECT'.bold),
            ' ',
            pad(lens.action, 'ACTION'.bold),
            ' ',
            pad(lens.ressource, 'RESSOURCE'.bold),
            ' ',
            pad(lens.context, 'CONTEXT'.bold),
            ' ',
            pad(7, 'VERDICT'.bold)
        );

        for (let i = 0; i < lines.length; i++) {
            console.log(
                pad(lens.subject,   lines[i].case.subject  .toString().bold),
                ' ',
                pad(lens.action,    lines[i].case.action   .toString().yellow),
                ' ',
                pad(lens.ressource, lines[i].case.ressource.toString().bold),
                ' ',
                pad(lens.context,   JSON.stringify(lines[i].case.context)),
                ' ',
                pad(7,              utils.logVerdict(lines[i].verdict))
            );
        }
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