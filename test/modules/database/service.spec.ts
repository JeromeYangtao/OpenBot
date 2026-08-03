import { DatabaseService } from '../../../src/modules/database/service';

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(() => {
    service = new DatabaseService(':memory:');
  });

  afterEach(() => {
    service.onApplicationShutdown();
  });

  it('creates and queries SQLite tables', () => {
    service.connection.exec(`
      CREATE TABLE accounts (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      )
    `);
    service.connection
      .prepare('INSERT INTO accounts (name) VALUES (?)')
      .run('Gate');

    expect(
      service.connection.prepare('SELECT id, name FROM accounts').get(),
    ).toEqual({ id: 1, name: 'Gate' });
  });

  it('enables foreign key constraints', () => {
    expect(service.connection.prepare('PRAGMA foreign_keys').get()).toEqual({
      foreign_keys: 1,
    });
  });
});
