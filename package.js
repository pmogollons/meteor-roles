Package.describe({
  summary: "Authorization package for Meteor",
  version: "1.0.0",
  git: "https://github.com/pmogollons/meteor-roles.git",
  name: "pmogollons:roles",
});

Package.onUse(function (api) {
  api.versionsFrom("3.0");

  api.use([
    "typescript",
    "zodern:types@1.0.13",
    "accounts-base",
  ]);

  api.mainModule("roles/roles_common.ts", "client");
  api.mainModule("roles/roles_common.ts", "server");
});

Package.onTest(function (api) {
  api.versionsFrom("3.0");

  api.use([
    "ecmascript",
    "pmogollons:roles",
    "accounts-password",
    "underscore",
    "tinytest",
  ]);

  api.addFiles("roles/tests/client.js", "client");
  api.addFiles("roles/tests/server.js", "server");
});
