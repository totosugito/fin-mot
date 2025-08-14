import {
  EnumUserRole, EnumDataStatus, EnumEventStatus, EnumDeviceType, EnumDataType,
  PgEnumUserRole, PgEnumDataStatus, PgEnumDeviceType, PgEnumEventStatus, PgEnumDataType} from './enum-db.ts';
import {users, accounts, sessions, verifications} from './auth.ts';

// GROUP SCHEMA
export const schema = {
  PgEnumUserRole, PgEnumDataStatus, PgEnumDeviceType, PgEnumEventStatus,
  users, usersAccounts: accounts, usersSessions: sessions, usersVerifications: verifications,
};

export {
  EnumUserRole, EnumDataStatus, EnumEventStatus, EnumDeviceType, EnumDataType,
  PgEnumUserRole, PgEnumDataStatus, PgEnumDeviceType, PgEnumEventStatus, PgEnumDataType,
  users, accounts, sessions, verifications,
}
