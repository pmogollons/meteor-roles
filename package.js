Package.describe({
  summary: "Authorization package for Meteor",
  version: "1.4.0",
  git: "https://github.com/Meteor-Community-Packages/meteor-roles.git",
  name: "alanning:roles"
});

Package.onUse(function (api) {
  api.versionsFrom(['1.9', '2.5.6']);

  const both = ['client', 'server'];

  api.use([
    'underscore',
    'ecmascript',
    'accounts-base',
    'tracker',
    'mongo',
    'check'
  ], both);

  api.export('Roles');

  api.addFiles('roles/roles_server.js', 'server');
  api.addFiles('roles/roles_common.js', both);
});

Package.onTest(function (api) {
  api.versionsFrom("1.9");

  const both = ['client', 'server'];

  // `accounts-password` is included so `Meteor.users` exists

  api.use(['alanning:roles',
           'accounts-password@1.7.1 || 2.0.0',
           'underscore',
           'tinytest'], both);

  api.addFiles('roles/tests/client.js', 'client');
  api.addFiles('roles/tests/server.js', 'server');
});
