'use strict';

let ACDC = require('../index');

let engine = new ACDC.Engine({});

let User = new ACDC.Subject({ attributes: [ 'id', 'login', 'clearance' ] });
let Document = new ACDC.Ressource({ attributes: [ 'id', 'title', 'author', 'sensitivity', 'draft' ] });

let read = new ACDC.Action({});
let update = new ACDC.Action({});
let create = new ACDC.Action({});
let del = new ACDC.Action({});

engine.register('user', User);
engine.register('document', Document);
engine.register('READ', read);
engine.register('UPDATE', update);
engine.register('CREATE', create);
engine.register('DELETE', del);

let userPolicy = engine.policy({
    id: 'user',
    combinator: 'OnlyOneMatch',
    target: { subject: User }
});

let userDocPolicy = userPolicy.policy({
    id: 'user.document',
    combinator: 'AllowOverrides',
    target: { ressource: Document }
});

let userOwnDocPolicy = userDocPolicy.policy({
    id: 'user.document.own',
    combinator: 'AllowOverrides',
    target: { 'ressource.author': 'subject' }
});

userDocPolicy
    // Deny by default
    .rule({
        target: true,
        method: 'deny',
        condition: true,
    })
    .rule({
        target: { action: read },
        method: 'allow',
        condition: {
            'ressource.sensitivity': { '$lte': 'subject.clearance' },
            'ressource.draft': false,
        }
    })
;

userOwnDocPolicy
    // Deny by default
    .rule({
        target: true,
        method: 'deny',
        condition: true,
    })
    .rule({
        target: { action: read },
        method: 'allow',
        condition: true,
    })
    .rule({
        target: { action: [ update, del ] },
        method: 'allow',
        condition: {
            'ressource.draft': true
        }
    })
    .rule({
        target: { action: create },
        method: 'allow',
        condition: true,
    })
;

let user1 = User.from({
    id: 1,
    login: 'aze',
    clearance: 50,
});

let user2 = User.from({
    id: 2,
    login: 'qsd',
    clearance: 100,
});

let docs = [
    Document.from({ id: 0, title: 'Doc 0', author: user1, sensitivity: 10, draft: false }),
    Document.from({ id: 1, title: 'Doc 1', author: user1, sensitivity: 100, draft: false }),
    Document.from({ id: 2, title: 'Doc 2', author: user2, sensitivity: 200, draft: false }),
    Document.from({ id: 3, title: 'Draft doc 3', author: user1, sensitivity: 10, draft: true }),
    Document.from({ id: 4, title: 'Draft doc 4', author: user1, sensitivity: 100, draft: true }),
    Document.from({ id: 5, title: 'Draft doc 5', author: user2, sensitivity: 200, draft: true }),
    'Not a document'
];

engine.table(
    [ engine.root, user1, user2 ],
    [ read, update, create, del ],
    docs,
    {}
);

engine.can(engine.root, read, docs[0], {}, true);