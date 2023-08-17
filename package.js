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
    'ecmascript',
    'accounts-base',
  ], both);

  api.export('Roles');

  api.addFiles('roles/roles_common.js', both);
});

Package.onTest(function (api) {
  api.versionsFrom(['1.9', '2.5.6']);

  const both = ['client', 'server'];

  api.use([
    'ecmascript',
    'alanning:roles',
    'accounts-password',
    'underscore',
    'tinytest'
  ], both);

  api.addFiles('roles/tests/client.js', 'client');
  api.addFiles('roles/tests/server.js', 'server');
});
