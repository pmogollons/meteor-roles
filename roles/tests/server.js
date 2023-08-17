let users = {};
const roles = ['admin','editor','user']
const GROUPS = {
  FB: 'facebook.com',
  IG: 'instagram.com',
}

function addUser (name) {
  return Accounts.createUser({'username': name})
}

function reset () {
  Meteor.users.remove({})

  users = {
    'eve': addUser('eve'),
    'bob': addUser('bob'),
    'joe': addUser('joe')
  }
}

function _innerTest(test, userParam, username, expectedRoles, group, expectError) {
  // test that user has only the roles expected and no others
  _.each(roles, function (role) {
    const expected = _.contains(expectedRoles, role);
    const msg = username + ' expected to have \'' + role + '\' permission but does not';
    const nmsg = username + ' had the following un-expected permission: ' + role;

    if (expected) {
      test.isTrue(Roles.userIsInRole(userParam, role, group), msg)
    } else {
      test.isFalse(Roles.userIsInRole(userParam, role, group), nmsg)
    }
  })
}

function testUser(test, username, expectedRoles, group) {
  const userId = users[username];
  const userObj = Meteor.users.findOne({_id: userId});

  // check using user ids (makes db calls)
  _innerTest(test, userId, username, expectedRoles, group)

  // check using passed-in user object
  _innerTest(test, userObj, username, expectedRoles, group)
}

Tinytest.add(
  'roles - cant check if user is in role',
  function (test) {
    reset()

    const expectedErrorMsg = 'Roles error: Invalid parameter \'group\' expected \'string\' type.';

    try {
      Roles.userIsInRole(users.eve, ['admin', 'user'])
      throw new Error("expected exception but didn't get one")
    } catch (ex) {
      test.isTrue(ex.message === expectedErrorMsg, ex.message)
    }
  })

Tinytest.add(
  'roles - can check if user is in role by group',
  function (test) {
    reset()

    Meteor.users.update(
      {"_id":users.eve},
      {$addToSet: { 'roles.group1': { $each: ['admin', 'user'] } } })
    Meteor.users.update(
      {"_id":users.eve},
      {$addToSet: { 'roles.group2': { $each: ['editor'] } } })

    testUser(test, 'eve', ['admin', 'user'], 'group1')
    testUser(test, 'eve', ['editor'], 'group2')
  })

Tinytest.add(
  'roles - can check if non-existant user is in role',
  function (test) {
    reset()

    test.isFalse(Roles.userIsInRole('1', 'admin', GROUPS.FB))
  })

Tinytest.add(
  'roles - can check if null user is in role',
  function (test) {
    const user = null
    reset()

    test.isFalse(Roles.userIsInRole(user, 'admin', GROUPS.FB))
  })

Tinytest.add(
  'roles - can check user against several roles at once',
  function (test) {
    reset()

    Roles.addUsersToRoles(users.eve, ['admin', 'user'], GROUPS.FB)
    const user = Meteor.users.findOne({_id:users.eve})

    test.isTrue(Roles.userIsInRole(user, ['editor','admin'], GROUPS.FB))
  })

Tinytest.add(
  'roles - cant add non-existent user to role',
  function (test) {
    reset()

    Roles.addUsersToRoles(['1'], ['admin'], GROUPS.FB)
    test.equal(Meteor.users.findOne({_id:'1'}, GROUPS.FB), undefined)
  })

Tinytest.add(
  'roles - can add individual users to roles by group',
  function (test) {
    reset()

    Roles.addUsersToRoles(users.eve, ['admin', 'user'], 'group1')

    testUser(test, 'eve', ['admin', 'user'], 'group1')
    testUser(test, 'bob', [], 'group1')
    testUser(test, 'joe', [], 'group1')

    testUser(test, 'eve', [], 'group2')
    testUser(test, 'bob', [], 'group2')
    testUser(test, 'joe', [], 'group2')

    Roles.addUsersToRoles(users.joe, ['editor', 'user'], 'group1')
    Roles.addUsersToRoles(users.bob, ['editor', 'user'], 'group2')

    testUser(test, 'eve', ['admin', 'user'], 'group1')
    testUser(test, 'bob', [], 'group1')
    testUser(test, 'joe', ['editor', 'user'], 'group1')

    testUser(test, 'eve', [], 'group2')
    testUser(test, 'bob', ['editor', 'user'], 'group2')
    testUser(test, 'joe', [], 'group2')
  })

Tinytest.add(
  'roles - can add user to roles via user object',
  function (test) {
    reset()

    const eve = Meteor.users.findOne({_id: users.eve});
    const bob = Meteor.users.findOne({_id: users.bob})

    Roles.addUsersToRoles(eve, ['admin', 'user'], GROUPS.FB)

    testUser(test, 'eve', ['admin', 'user'], GROUPS.FB)
    testUser(test, 'bob', [], GROUPS.FB)
    testUser(test, 'joe', [], GROUPS.FB)

    Roles.addUsersToRoles(bob, ['editor'], GROUPS.FB)

    testUser(test, 'eve', ['admin', 'user'], GROUPS.FB)
    testUser(test, 'bob', ['editor'], GROUPS.FB)
    testUser(test, 'joe', [], GROUPS.FB)
  })

Tinytest.add(
  'roles - can add user to roles multiple times by group',
  function (test) {
    reset()

    Roles.addUsersToRoles(users.eve, ['admin', 'user'], 'group1')
    Roles.addUsersToRoles(users.eve, ['admin', 'user'], 'group1')

    testUser(test, 'eve', ['admin', 'user'], 'group1')
    testUser(test, 'bob', [], 'group1')
    testUser(test, 'joe', [], 'group1')

    Roles.addUsersToRoles(users.bob, ['admin'], 'group1')
    Roles.addUsersToRoles(users.bob, ['editor'], 'group1')

    testUser(test, 'eve', ['admin', 'user'], 'group1')
    testUser(test, 'bob', ['admin', 'editor'], 'group1')
    testUser(test, 'joe', [], 'group1')
  })

Tinytest.add(
  'roles - cant add users to roles without group',
  function (test) {
    reset()

    const expectedErrorMsg = 'Roles error: Invalid parameter \'group\' expected \'string\' type.';

    try {
      Roles.addUsersToRoles([users.eve, users.bob], ['admin', 'user'])
      throw new Error("expected exception but didn't get one")
    } catch (ex) {
      test.isTrue(ex.message === expectedErrorMsg, ex.message)
    }
  })

Tinytest.add(
  'roles - can add multiple users to roles by group',
  function (test) {
    reset()

    Roles.addUsersToRoles([users.eve, users.bob], ['admin', 'user'], 'group1')

    testUser(test, 'eve', ['admin', 'user'], 'group1')
    testUser(test, 'bob', ['admin', 'user'], 'group1')
    testUser(test, 'joe', [], 'group1')

    testUser(test, 'eve', [], 'group2')
    testUser(test, 'bob', [], 'group2')
    testUser(test, 'joe', [], 'group2')

    Roles.addUsersToRoles([users.bob, users.joe], ['editor', 'user'], 'group1')
    Roles.addUsersToRoles([users.bob, users.joe], ['editor', 'user'], 'group2')

    testUser(test, 'eve', ['admin', 'user'], 'group1')
    testUser(test, 'bob', ['admin', 'editor', 'user'], 'group1')
    testUser(test, 'joe', ['editor', 'user'], 'group1')

    testUser(test, 'eve', [], 'group2')
    testUser(test, 'bob', ['editor', 'user'], 'group2')
    testUser(test, 'joe', ['editor', 'user'], 'group2')
  })

Tinytest.add(
  'roles - cant remove individual users from roles without group',
  function (test) {
    reset()

    const expectedErrorMsg = 'Roles error: Invalid parameter \'group\' expected \'string\' type.';

    try {
      Roles.addUsersToRoles([users.eve, users.bob], ['editor', 'user'])
      throw new Error("expected exception but didn't get one")
    } catch (ex) {
      test.isTrue(ex.message === expectedErrorMsg, ex.message)
    }
  })
Tinytest.add(
  'roles - can remove user from roles multiple times',
  function (test) {
    reset()

    // remove user role - one user
    Roles.addUsersToRoles([users.eve, users.bob], ['editor', 'user'], 'group1')
    testUser(test, 'eve', ['editor', 'user'], 'group1')
    testUser(test, 'bob', ['editor', 'user'], 'group1')
    Roles.removeUsersFromRoles(users.eve, ['user'], 'group1')
    testUser(test, 'eve', ['editor'], 'group1')
    testUser(test, 'bob', ['editor', 'user'], 'group1')

    // try remove again
    Roles.removeUsersFromRoles(users.eve, ['user'], 'group1')
    testUser(test, 'eve', ['editor'], 'group1')
  })

Tinytest.add(
  'roles - can remove users from roles via user object',
  function (test) {
    reset()

    const eve = Meteor.users.findOne({_id: users.eve});
    const bob = Meteor.users.findOne({_id: users.bob});

    // remove user role - one user
    Roles.addUsersToRoles([eve, bob], ['editor', 'user'], 'group1')
    testUser(test, 'eve', ['editor', 'user'], 'group1')
    testUser(test, 'bob', ['editor', 'user'], 'group1')
    Roles.removeUsersFromRoles(eve, ['user'], 'group1')
    testUser(test, 'eve', ['editor'], 'group1')
    testUser(test, 'bob', ['editor', 'user'], 'group1')
  })


Tinytest.add(
  'roles - can remove individual users from roles by group',
  function (test) {
    reset()

    // remove user role - one user
    Roles.addUsersToRoles([users.eve, users.bob], ['editor', 'user'], 'group1')
    Roles.addUsersToRoles([users.joe, users.bob], ['admin'], 'group2')
    testUser(test, 'eve', ['editor', 'user'], 'group1')
    testUser(test, 'bob', ['editor', 'user'], 'group1')
    testUser(test, 'joe', [], 'group1')
    testUser(test, 'eve', [], 'group2')
    testUser(test, 'bob', ['admin'], 'group2')
    testUser(test, 'joe', ['admin'], 'group2')

    Roles.removeUsersFromRoles(users.eve, ['user'], 'group1')
    testUser(test, 'eve', ['editor'], 'group1')
    testUser(test, 'bob', ['editor', 'user'], 'group1')
    testUser(test, 'joe', [], 'group1')
    testUser(test, 'eve', [], 'group2')
    testUser(test, 'bob', ['admin'], 'group2')
    testUser(test, 'joe', ['admin'], 'group2')
  })

Tinytest.add(
  'roles - cant remove multiple users from roles',
  function (test) {
    reset()

    const expectedErrorMsg = 'Roles error: Invalid parameter \'group\' expected \'string\' type.';

    try {
      Roles.removeUsersFromRoles([users.bob, users.joe], ['admin'])
      throw new Error("expected exception but didn't get one")
    } catch (ex) {
      test.isTrue(ex.message === expectedErrorMsg, ex.message)
    }
  })

Tinytest.add(
  'roles - can remove multiple users from roles by group',
  function (test) {
    reset()

    // remove user role - one user
    Roles.addUsersToRoles([users.eve, users.bob], ['editor', 'user'], 'group1')
    Roles.addUsersToRoles([users.joe, users.bob], ['admin'], 'group2')
    testUser(test, 'eve', ['editor', 'user'], 'group1')
    testUser(test, 'bob', ['editor', 'user'], 'group1')
    testUser(test, 'joe', [], 'group1')
    testUser(test, 'eve', [], 'group2')
    testUser(test, 'bob', ['admin'], 'group2')
    testUser(test, 'joe', ['admin'], 'group2')

    Roles.removeUsersFromRoles([users.eve, users.bob], ['user'], 'group1')
    testUser(test, 'eve', ['editor'], 'group1')
    testUser(test, 'bob', ['editor'], 'group1')
    testUser(test, 'joe', [], 'group1')
    testUser(test, 'eve', [], 'group2')
    testUser(test, 'bob', ['admin'], 'group2')
    testUser(test, 'joe', ['admin'], 'group2')

    Roles.removeUsersFromRoles([users.joe, users.bob], ['admin'], 'group2')
    testUser(test, 'eve', [], 'group2')
    testUser(test, 'bob', [], 'group2')
    testUser(test, 'joe', [], 'group2')
  })

Tinytest.add(
  'roles - cant set user roles',
  function (test) {
    reset()

    const bob = Meteor.users.findOne({_id: users.bob});

    const expectedErrorMsg = 'Roles error: Invalid parameter \'group\' expected \'string\' type.';

    try {
      Roles.setUserRoles([users.eve, bob], ['editor', 'user'])
      throw new Error("expected exception but didn't get one")
    } catch (ex) {
      test.isTrue(ex.message === expectedErrorMsg, ex.message)
    }
  })

Tinytest.add(
  'roles - can set user roles by group',
  function (test) {
    reset()

    const eve = Meteor.users.findOne({_id: users.eve});
    const bob = Meteor.users.findOne({_id: users.bob});
    const joe = Meteor.users.findOne({_id: users.joe});

    Roles.setUserRoles([users.eve, users.bob], ['editor', 'user'], 'group1')
    Roles.setUserRoles([users.bob, users.joe], ['admin'], 'group2')
    testUser(test, 'eve', ['editor', 'user'], 'group1')
    testUser(test, 'bob', ['editor', 'user'], 'group1')
    testUser(test, 'joe', [], 'group1')
    testUser(test, 'eve', [], 'group2')
    testUser(test, 'bob', ['admin'], 'group2')
    testUser(test, 'joe', ['admin'], 'group2')

    // use addUsersToRoles add some roles
    Roles.addUsersToRoles([users.eve, users.bob], ['admin'], 'group1')
    Roles.addUsersToRoles([users.bob, users.joe], ['editor'], 'group2')
    testUser(test, 'eve', ['admin', 'editor', 'user'], 'group1')
    testUser(test, 'bob', ['admin', 'editor', 'user'], 'group1')
    testUser(test, 'joe', [], 'group1')
    testUser(test, 'eve', [], 'group2')
    testUser(test, 'bob', ['admin','editor'], 'group2')
    testUser(test, 'joe', ['admin','editor'], 'group2')

    Roles.setUserRoles([eve, bob], ['user'], 'group1')
    Roles.setUserRoles([eve, joe], ['editor'], 'group2')
    testUser(test, 'eve', ['user'], 'group1')
    testUser(test, 'bob', ['user'], 'group1')
    testUser(test, 'joe', [], 'group1')
    testUser(test, 'eve', ['editor'], 'group2')
    testUser(test, 'bob', ['admin','editor'], 'group2')
    testUser(test, 'joe', ['editor'], 'group2')

    Roles.setUserRoles(bob, 'editor', 'group1')
    testUser(test, 'eve', ['user'], 'group1')
    testUser(test, 'bob', ['editor'], 'group1')
    testUser(test, 'joe', [], 'group1')
    testUser(test, 'eve', ['editor'], 'group2')
    testUser(test, 'bob', ['admin','editor'], 'group2')
    testUser(test, 'joe', ['editor'], 'group2')

    Roles.setUserRoles([bob, users.joe], [], 'group1')
    testUser(test, 'eve', ['user'], 'group1')
    testUser(test, 'bob', [], 'group1')
    testUser(test, 'joe', [], 'group1')
    testUser(test, 'eve', ['editor'], 'group2')
    testUser(test, 'bob', ['admin','editor'], 'group2')
    testUser(test, 'joe', ['editor'], 'group2')
  })

Tinytest.add(
  'roles - can\'t get roles for non-existant user',
  function (test) {
    reset()
    test.equal(Roles.getRolesForUser('1', 'group1'), [])
  })

Tinytest.add(
  'roles - cant get all roles for user',
  function (test) {
    reset()

    const userId = users.eve;
    const expectedErrorMsg = 'Roles error: Invalid parameter \'group\' expected \'string\' type.';

    try {
      Roles.getRolesForUser(userId);
      throw new Error("expected exception but didn't get one")
    } catch (ex) {
      test.isTrue(ex.message === expectedErrorMsg, ex.message)
    }
  })

Tinytest.add(
  'roles - can get all roles for user by group',
  function (test) {
    reset()

    const userId = users.eve;
    let userObj;

    // by userId
    test.equal(Roles.getRolesForUser(userId, 'group1'), [])

    // by user object
    userObj = Meteor.users.findOne({_id: userId})
    test.equal(Roles.getRolesForUser(userObj, 'group1'), [])


    // add roles
    Roles.addUsersToRoles(userId, ['admin', 'user'], 'group1')

    // by userId
    test.equal(Roles.getRolesForUser(userId, 'group1'), ['admin', 'user'])

    // by user object
    userObj = Meteor.users.findOne({_id: userId})
    test.equal(Roles.getRolesForUser(userObj, 'group1'), ['admin', 'user'])
  })

Tinytest.add(
  'roles - can get all roles for user by group with periods in name',
  function (test) {
    reset()

    Roles.addUsersToRoles(users.joe, ['admin'], 'example.k12.va.us')

    test.equal(Roles.getRolesForUser(users.joe, 'example.k12.va.us'), ['admin'])
  })


Tinytest.add(
  'roles - getRolesForUser should not return null entries if user has no roles for group',
  function (test) {
    reset()

    const userId = users.eve;
    let userObj;

    // by userId
    test.equal(Roles.getRolesForUser(userId, 'group1'), [])

    // by user object
    userObj = Meteor.users.findOne({_id: userId})
    test.equal(Roles.getRolesForUser(userObj, 'group1'), [])


    Roles.addUsersToRoles([users.eve], ['editor'], 'group1')

    // by userId
    test.equal(Roles.getRolesForUser(userId, 'group1'), ['editor'])

    // by user object
    userObj = Meteor.users.findOne({_id: userId})
    test.equal(Roles.getRolesForUser(userObj, 'group1'), ['editor'])
  })

Tinytest.add(
  'roles - can get all groups for user',
  function (test) {
    reset()

    const userId = users.eve;
    let userObj;

    Roles.addUsersToRoles([users.eve], ['editor'], 'group1')
    Roles.addUsersToRoles([users.eve], ['admin', 'user'], 'group2')

    // by userId
    test.equal(Roles.getGroupsForUser(userId), ['group1', 'group2'])

    // by user object
    userObj = Meteor.users.findOne({_id: userId})
    test.equal(Roles.getGroupsForUser(userObj), ['group1', 'group2'])
  })

Tinytest.add(
  'roles - can get all groups for user by role',
  function (test) {
    reset()

    const userId = users.eve;
    let userObj

    Roles.addUsersToRoles([users.eve], ['editor'], 'group1')
    Roles.addUsersToRoles([users.eve], ['editor', 'user'], 'group2')

    // by userId
    test.equal(Roles.getGroupsForUser(userId, 'user'), ['group2'])
    test.equal(Roles.getGroupsForUser(userId, 'editor'), ['group1', 'group2'])
    test.equal(Roles.getGroupsForUser(userId, 'admin'), [])

    // by user object
    userObj = Meteor.users.findOne({_id: userId})
    test.equal(Roles.getGroupsForUser(userObj, 'user'), ['group2'])
    test.equal(Roles.getGroupsForUser(userObj, 'editor'), ['group1', 'group2'])
    test.equal(Roles.getGroupsForUser(userObj, 'admin'), [])
  })

Tinytest.add(
  'roles - getGroupsForUser returns [] when not using groups',
  function (test) {
    reset()

    const userId = users.eve;
    let userObj;

    // by userId
    test.equal(Roles.getGroupsForUser(userId), [])
    test.equal(Roles.getGroupsForUser(userId, 'editor'), [])

    // by user object
    userObj = Meteor.users.findOne({_id: userId})
    test.equal(Roles.getGroupsForUser(userObj), [])
    test.equal(Roles.getGroupsForUser(userObj, 'editor'), [])
  })


Tinytest.add(
  'roles - cant get all users in role',
  function (test) {
    reset()

    const expectedErrorMsg = 'Roles error: Invalid parameter \'group\' expected \'string\' type.';

    try {
      Roles.getUsersInRole('admin')
      throw new Error("expected exception but didn't get one")
    } catch (ex) {
      test.isTrue(ex.message === expectedErrorMsg, ex.message)
    }
  })

Tinytest.add(
  'roles - can get all users in role by group',
  function (test) {
    reset()
    Roles.addUsersToRoles([users.eve, users.joe], ['admin', 'user'], 'group1')
    Roles.addUsersToRoles([users.bob, users.joe], ['admin'], 'group2')

    const expected = [users.eve, users.joe];
    const actual = _.pluck(Roles.getUsersInRole('admin','group1').fetch(), '_id');

    // order may be different so check difference instead of equality
    // difference uses first array as base so have to check both ways
    test.equal(_.difference(actual, expected), [])
    test.equal(_.difference(expected, actual), [])
  })

Tinytest.add(
  'roles - can get all users in role by group and passes through mongo query arguments',
  function (test) {
    reset()
    Roles.addUsersToRoles([users.eve, users.joe], ['admin', 'user'], 'group1')
    Roles.addUsersToRoles([users.bob, users.joe], ['admin'], 'group2')

    const results = Roles.getUsersInRole('admin','group1', { fields: { username: 0 }, limit: 1 }).fetch();

    test.equal(1, results.length);
    test.isTrue(results[0].hasOwnProperty('_id'));
    test.isFalse(results[0].hasOwnProperty('username'));
  })

Tinytest.add(
  "roles - can use '.' in group name",
  function (test) {
    reset()

    Roles.addUsersToRoles(users.joe, ['admin'], 'example.com')
    testUser(test, 'joe', ['admin'], 'example.com')
  })

Tinytest.add(
  "roles - can use multiple periods in group name",
  function (test) {
    reset()

    Roles.addUsersToRoles(users.joe, ['admin'], 'example.k12.va.us')
    testUser(test, 'joe', ['admin'], 'example.k12.va.us')
  })

Tinytest.add(
  'roles - invalid group name throws descriptive error',
  function (test) {
    const expectedErrorMsg = "Roles error: groups can not start with '$'"

    reset()
    try {
      Roles.addUsersToRoles(users.joe, ['admin'], '$group1')
      throw new Error("expected exception but didn't get one")
    }
    catch (ex) {
      test.isTrue(ex.message == expectedErrorMsg, ex.message)
    }

    reset()
    // should not throw error
    Roles.addUsersToRoles(users.bob, ['editor', 'user'], 'g$roup1')
  })

Tinytest.add(
  'roles - dot in role name in getGroupsForUser',
  function (test) {
    reset();

    Roles.addUsersToRoles(users.eve, 'users.view', 'b')
    test.equal(Roles.getGroupsForUser(users.eve, 'users.view'), ['b'])
  });


function printException (ex) {
  const tmp = {}

  for (let key in ex) {
    if (key !== 'stack') {
      tmp[key] = ex[key]
    }
  }

  console.log(JSON.stringify(tmp));
}
