import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';


/**
 * Roles collection documents consist only of an id and a role name.
 *   ex: { _id: "123", name: "admin" }
 */
if (!Meteor.roles) {
  Meteor.roles = new Mongo.Collection('roles');

  // Create default indexes for roles collection
  Meteor.roles.createIndex('name', { unique: 1 });
}


/**
 * Publish logged-in user's roles so client-side checks can work.
 *
 * Use a named publish function so clients can check `ready()` state.
 */
Meteor.publish('_roles', function () {
  const loggedInUserId = this.userId;
  const fields = { roles: 1 };

  if (!loggedInUserId) {
    this.ready();
    return;
  }

  return Meteor.users.find(
    { _id: loggedInUserId },
    { fields: fields }
  );
});
