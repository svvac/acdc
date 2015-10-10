'use strict';

let ACDC = require('../index');

let engine = new ACDC.Engine({});

let User = new ACDC.Subject({ attributes: [ 'id', 'login' ] });
let Document = new ACDC.Ressource({ attributes: [ 'id', 'title', 'author' ] });
let read = new ACDC.Action({});
let update = new ACDC.Action({});

engine.register('user', User);
engine.register('document', Document);
engine.register('READ', read);
engine.register('UPDATE', update);

engine
    .rule({
        target: {
            ressource: Document,
            subject: User,
            action: read,
        },
        method: 'allow',
        condition: true,
    })
    .rule({
        target: {
            ressource: Document,
            subject: User,
            action: update,
        },
        method: 'allow',
        condition: {
            'ressource.author': 'subject',
        },
    })
;

let user1 = User.from({
    id: 1,
    login: 'aze',
});

let user2 = User.from({
    id: 2,
    login: 'qsd',
});

let docs = [
    Document.from({ id: 0, title: 'Doc 0', author: user1 }),
    Document.from({ id: 1, title: 'Doc 1', author: user1 }),
    Document.from({ id: 2, title: 'Doc 1', author: user2 }),
];

engine.table(
    [ engine.root, user1, user2 ],
    [ read, update ],
    docs,
    {},
    true
);