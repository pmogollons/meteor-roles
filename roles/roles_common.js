/* global Roles, _ */
import { Meteor } from 'meteor/meteor';


/**
 * Provides functions related to user authorization. Compatible with built-in Meteor accounts packages.
 *
 * @module Roles
 */

/**
 * Authorization package compatible with built-in Meteor accounts system.
 *
 * Stores user's current roles in a 'roles' field on the user object.
 *
 * @class Roles
 * @constructor
 */
if ('undefined' === typeof Roles) {
  Roles = {};
}

const mixingGroupAndNonGroupErrorMsg = 'Roles error: Can\'t mix grouped and non-grouped roles for same user';

Object.assign(Roles, {
  /**
   * Constant used to reference the special 'global' group that
   * can be used to apply blanket permissions across all groups.
   *
   * @example
   *     Roles.userIsInRole(user, 'admin', 'group') // => true
   *     Roles.userIsInRole(user, 'support-staff', 'group') // => true
   *     Roles.userIsInRole(user, 'admin', 'group') // => false
   *
   * @type String
   * @static
   * @final
   */

  checkGroup(group) {
    if (!group || 'string' !== typeof group) {
      throw new Error ('Roles error: Invalid parameter \'group\' expected \'string\' type.');
    }

    group = group.trim();

    if ('$' === group[0]) {
      throw new Error ('Roles error: groups can not start with \'$\'');
    }

    if (!group.length) {
      throw new Error ('Roles error: groups can not be empty');
    }

    group = group.replace(/\./g, '_');

    return group;
  },

  ensureUserIds(users) {
    return users.reduce((memo, user) => {
      let _id;

      if ('string' === typeof user) {
        memo.push(user);
      } else if ('object' === typeof user) {
        _id = user._id;

        if ('string' === typeof _id) {
          memo.push(_id);
        }
      }

      return memo;
    }, []);
  },

  /**
   * Add users to roles.
   *
   * @example
   *     Roles.addUsersToRoles(userId, 'admin', 'group')
   *     Roles.addUsersToRoles(userId, ['view-secrets'], 'example.com')
   *     Roles.addUsersToRoles([user1, user2], ['user','editor'], 'group')
   *     Roles.addUsersToRoles([user1, user2], ['glorious-admin', 'perform-action'], 'example.org')
   *
   * @method addUsersToRoles
   * @param {Array|String} users User id(s) or object(s) with an _id field
   * @param {Array|String} roles Name(s) of roles/permissions to add users to
   * @param {String} [group]Group name to add the role to. Roles will be
   *                         specific to that group.
   *                         Group names can not start with '$'.
   *                         Periods in names '.' are automatically converted
   *                         to underscores.
   */
  addUsersToRoles: function (users, roles, group) {
    group = group = this.checkGroup(group);

    // use Template pattern to update user roles
    Roles._updateUserRoles(users, roles, group, Roles._update_$addToSet_fn);
  },

  /**
   * Set a users roles/permissions.
   *
   * @example
   *     Roles.setUserRoles(userId, 'admin', 'group')
   *     Roles.setUserRoles(userId, ['view-secrets'], 'example.com')
   *     Roles.setUserRoles([user1, user2], ['user','editor'], 'group')
   *     Roles.setUserRoles([user1, user2], ['glorious-admin', 'perform-action'], 'example.org')
   *
   * @method setUserRoles
   * @param {Array|String} users User id(s) or object(s) with an _id field
   * @param {Array|String} roles Name(s) of roles/permissions to add users to
   * @param {String} group Group name to add the role to. Roles will be
   *                         specific to that group.
   *                         Group names can not start with '$'.
   *                         Periods in names '.' are automatically converted
   *                         to underscores.
   */
  setUserRoles: function (users, roles, group) {
    group = this.checkGroup(group);

    // use Template pattern to update user roles
    Roles._updateUserRoles(users, roles, group, Roles._update_$set_fn);
  },

  /**
   * Remove users from roles
   *
   * @example
   *     Roles.removeUsersFromRoles(users.bob, 'admin', 'group')
   *     Roles.removeUsersFromRoles([users.bob, users.joe], ['editor'], 'group')
   *     Roles.removeUsersFromRoles([users.bob, users.joe], ['editor', 'user'], 'group')
   *     Roles.removeUsersFromRoles(users.eve, ['user'], 'group1')
   *
   * @method removeUsersFromRoles
   * @param {Array|String} users User id(s) or object(s) with an _id field
   * @param {Array|String} roles Name(s) of roles to remove users from
   * @param {String} group Group name. Only that group will have roles removed.
   */
  removeUsersFromRoles: function (users, roles, group) {
    group = this.checkGroup(group);

    if (!users) {
      throw new Error ('Missing \'users\' param');
    }

    if (!roles) {
      throw new Error ('Missing \'roles\' param');
    }

    if (!Array.isArray(roles)) {
      roles = [roles];
    }

    let query;

    // Is more performant to not use $in for single user _id
    if (Array.isArray(users)) {
      const userIds = this.ensureUserIds(users);

      query = { _id: { $in: userIds } }
    } else {
      query = { _id: users?._id || users };
    }

    try {
      Meteor.users.update(query, {
        $pullAll: {
          [`roles.${group}`]: roles
        }
      }, { multi: true });
    } catch (ex) {
      if (ex.name === 'MongoError' && isMongoMixError(ex.errmsg || ex.err)) {
        throw new Error(mixingGroupAndNonGroupErrorMsg);
      }

      throw ex;
    }
  },

  /**
   * Check if user has specified permissions/roles
   *
   * @example
   *     Roles.userIsInRole(user,   ['admin','editor'], 'group1')
   *     Roles.userIsInRole(userId, ['admin','editor'], 'group1')
   *
   * @method userIsInRole
   * @param {String|Object} user User Id or actual user object
   * @param {String|Array} roles Name of role/permission or Array of
   *                            roles/permissions to check against. If is an array,
   *                            will return true if user is in _any_ role.
   * @param {String} group Name of group. Limits check to just that group.
   * @return {Boolean} true if user is in _any_ of the target roles.
   */
  userIsInRole: function (user, roles, group) {
    group = this.checkGroup(group);

    let id;
    let found = false;

    if (!user) {
      return false;
    }

    if ('object' === typeof user) {
      const userRoles = user.roles;

      if (userRoles && 'object' === typeof userRoles) {
        let rolesArray = roles;

        if (!Array.isArray(rolesArray)) {
          rolesArray = [rolesArray];
        }

        if (Array.isArray(userRoles[group])) {
          found = rolesArray.some((role) => userRoles[group].includes(role));
        }

        return found;
      }

      // Maybe the user doesn't have the roles field, get data from DB
      id = user._id;
    } else if ('string' === typeof user) {
      id = user;
    }

    if (!id) {
      return false;
    }

    found = Meteor.users.findOne({
      _id: id,
      // Is more performant to not use $in for single role
      [`roles.${group}`]: Array.isArray(roles) ? { $in: roles } : roles
    }, {
      fields: { _id: 1 },
      readPreference: 'secondaryPreferred'
    });

    return !!found;
  },

  /**
   * Retrieve users roles
   *
   * @method getRolesForUser
   * @param {String|Object} user User Id or actual user object
   * @param {String} group Name of group to restrict roles to.
   * @return {Array} Array of user's roles, unsorted.
   */
  getRolesForUser: function (user, group) {
    group = this.checkGroup(group);

    if (!user) {
      return [];
    }

    if ('string' === typeof user) {
      user = Meteor.users.findOne({ _id: user?._id || user }, {
        fields: { [`roles.${group}`]: 1 },
        readPreference: 'secondaryPreferred'
      });
    } else if ('object' !== typeof user) {
      // User should be an object or string
      return [];
    }

    if (!user || !user.roles) {
      return [];
    }

    return user.roles[group] || [];
  },

  /**
   * Retrieve all users who are in target role.
   *
   * NOTE: This is an expensive query; it performs a full collection scan
   * on the users collection since there is no index set on the 'roles' field.
   * This is by design as most queries will specify an _id so the _id index is
   * used automatically.
   *
   * @method getUsersInRole
   * @param {Array|String} role Name of role/permission.  If array, users
   *                            returned will have at least one of the roles
   *                            specified but need not have _all_ roles.
   * @param {String} group Name of group to restrict roles to.
   * @param {Object} [options] Optional options which are passed directly
   *                           through to `Meteor.users.find(query, options)`
   * @return {Cursor} cursor of users in role
   */
  getUsersInRole: function (role, group, options) {
    group = this.checkGroup(group);

    // Is more performant to not use $in for single role
    return Meteor.users.find({
      [`roles.${group}`]: Array.isArray(role) ? { $in: role } : role
    }, {
      readPreference: 'secondaryPreferred',
      ...options
    });
  },

  /**
   * Retrieve users groups, if any
   *
   * @method getGroupsForUser
   * @param {String|Object} user User Id or actual user object
   * @param {String} [role] Optional name of roles to restrict groups to.
   *
   * @return {Array} Array of user's groups, unsorted.
   */
  getGroupsForUser: function (user, role) {
    if (!user) {
      return [];
    }

    if (role) {
      if ('string' !== typeof role) {
        return [];
      }

      if ('$' === role[0]) {
        return [];
      }
    }

    if ('string' === typeof user) {
      user = Meteor.users.findOne({ _id: user }, {
        fields: { roles: 1 },
        readPreference: 'secondaryPreferred'
      });
    } else if ('object' !== typeof user) {
      // invalid user object
      return [];
    }

    // User has no roles or is not using groups
    if (!user || !user.roles || Array.isArray(user.roles)) {
      return [];
    }

    const groups = Object.keys(user.roles);

    if (role) {
      const groupsWithRole = [];

      groups.forEach((group) => {
        if (user.roles[group]?.includes(role)) {
          groupsWithRole.push(group);
        }
      });

      return groupsWithRole;
    }

    return groups;
  },


  /**
   * Private function 'template' that uses $set to construct an update object
   * for MongoDB.  Passed to _updateUserRoles
   *
   * @method _update_$set_fn
   * @protected
   * @param {Array} roles
   * @param {String} group
   * @return {Object} update object for use in MongoDB update command
   */
  _update_$set_fn: function (roles, group) {
    return {
      $set: {
        [`roles.${group}`]: roles
      }
    };
  },

  /**
   * Private function 'template' that uses $addToSet to construct an update
   * object for MongoDB.  Passed to _updateUserRoles
   *
   * @method _update_$addToSet_fn
   * @protected
   * @param {Array} roles
   * @param {String} group
   * @return {Object} update object for use in MongoDB update command
   */
  _update_$addToSet_fn: function (roles, group) {
    return {
      $addToSet: {
        [`roles.${group}`]: { $each: roles }
      }
    };
  },


  /**
   * Internal function that uses the Template pattern to adds or sets roles
   * for users.
   *
   * @method _updateUserRoles
   * @protected
   * @param {Array|String} users user id(s) or object(s) with an _id field
   * @param {Array|String} roles name(s) of roles/permissions to add users to
   * @param {String} group Group name. Roles will be specific to that group.
   *                         Group names can not start with '$'.
   *                         Periods in names '.' are automatically converted
   *                         to underscores.
   * @param {Function} updateFactory Func which returns an update object that
   *                         will be passed to Mongo.
   *   @param {Array} roles
   *   @param {String} [group]
   */
  _updateUserRoles: function (users, roles, group, updateFactory) {
    group = this.checkGroup(group);

    if (!roles) {
      throw new Error ('Missing \'roles\' param');
    }

    if (!Array.isArray(roles)) {
      roles = [roles];
    }

    // remove invalid roles
    roles = roles.reduce((memo, role) => {
      if (role
        && 'string' === typeof role
        && role.trim().length > 0) {
        memo.push(role.trim());
      }

      return memo;
    }, []);

    // empty roles array is ok, since it might be a $set operation to clear roles
    // if (roles.length === 0) return

    let query;

    // Is more performant to not use $in for single user _id
    if (Array.isArray(users)) {
      const userIds = this.ensureUserIds(users);

      query = { _id: { $in: userIds } }
    } else {
      query = { _id: users?._id || users };
    }

    const updateQuery = updateFactory(roles, group);

    try {
      Meteor.users.update(query, updateQuery, { multi: true });
    } catch (ex) {
      if (ex.name === 'MongoError' && isMongoMixError(ex.errmsg || ex.err)) {
        throw new Error (mixingGroupAndNonGroupErrorMsg);
      }

      throw ex;
    }
  }
});


function isMongoMixError(errorMsg) {
  const expectedMessages = [
    'Cannot apply $addToSet modifier to non-array',
    'Cannot apply $addToSet to a non-array field',
    'Cannot apply $addToSet to non-array field',
    'Can only apply $pullAll to an array',
    'Cannot apply $pull/$pullAll modifier to non-array',
    'Cannot apply $pull to a non-array value',
    'can\'t append to array using string field name',
    'to traverse the element',
    'Cannot create field'
  ];

  return expectedMessages.some((snippet) => {
    return strContains(errorMsg, snippet);
  });
}

function strContains(haystack, needle) {
  return -1 !== haystack.indexOf(needle);
}
