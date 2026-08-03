import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    const resolvedPath = this.resolveDatabasePath(databasePath);

    if (resolvedPath !== ':memory:') {
      mkdirSync(dirname(resolvedPath), { recursive: true });
    }

    this.database = new DatabaseSync(resolvedPath);
    this.database.exec('PRAGMA foreign_keys = ON');

    if (resolvedPath !== ':memory:') {
      this.database.exec('PRAGMA journal_mode = WAL');
    }
  }

  get connection(): DatabaseSync {
    return this.database;
  }

  onApplicationShutdown(): void {
    this.database.close();
  }

  private resolveDatabasePath(databasePath: string): string {
    if (databasePath === ':memory:') {
      return databasePath;
    }

    return isAbsolute(databasePath)
      ? databasePath
      : resolve(process.cwd(), databasePath);
  }
}
