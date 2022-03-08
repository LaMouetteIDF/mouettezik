import { Client } from './worker';

describe('Client', () => {
  it('should be defined', () => {
    expect(new Client()).toBeDefined();
  });
});
