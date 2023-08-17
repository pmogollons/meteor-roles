// Definitions by: Robbie Van Gorkom <https://github.com/vangorra>
//                 Matthew Zartman <https://github.com/mattmm3d>
//                 Jan Dvorak <https://github.com/storytellercz>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// Minimum TypeScript Version: 4.1

import { Mongo } from 'meteor/mongo'

/**
 * Provides functions related to user authorization. Compatible with built-in Meteor accounts packages.
 *
 * @module Roles
 */
declare namespace Roles {
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
   * @param {String} group Group name to add the role to. Roles will be
   *                         specific to that group.
   *                         Group names can not start with '$'.
   *                         Periods in names '.' are automatically converted
   *                         to underscores.
   */
  function addUsersToRoles(
    users: string | string[] | Meteor.User | Meteor.User[],
    roles: string | string[],
    group: string
  ): void

  /**
   * Retrieve users groups, if any
   *
   * @method getGroupsForUser
   * @param {String|Object} user User Id or actual user object
   * @param {String} [role] Optional name of roles to restrict groups to.
   *
   * @return {Array} Array of user's groups, unsorted.
   */
  function getGroupsForUser(
    user: string | Meteor.User,
    role?: string
  ): string[]

  /**
   * Retrieve users roles
   *
   * @method getRolesForUser
   * @param {String|Object} user User Id or actual user object
   * @param {String} group Name of group to restrict roles to.
   * @return {Array} Array of user's roles, unsorted.
   */
  function getRolesForUser(
    user: string | Meteor.User,
    group: string
  ): string[]

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
  function getUsersInRole(
    role: string | string[],
    group: string,
    options?: QueryOptions,
  ): Mongo.Cursor<Meteor.User>

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
  function removeUsersFromRoles(
    users: string | string[] | Meteor.User | Meteor.User[],
    roles: string | string[] | any[],
    group: string,
  ): void

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
  function setUserRoles(
    users: string | string[] | Meteor.User | Meteor.User[],
    roles: string | string[],
    group: string,
  ): void

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
  function userIsInRole(
    user: string | string[] | Meteor.User | Meteor.User[],
    roles: string | string[],
    group: string,
  ): boolean

  interface Role {
    _id: string
    name: string
  }

  interface QueryOptions {
    sort?: Mongo.SortSpecifier | undefined
    skip?: number | undefined
    limit?: number | undefined
    fields?: Mongo.FieldSpecifier | undefined
    projection?: Mongo.FieldSpecifier | undefined
    reactive?: boolean | undefined
    transform?: Function | undefined
  }

} // module
