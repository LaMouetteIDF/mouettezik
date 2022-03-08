import SnowflakeId from 'snowflake-id';

const snowflake = new SnowflakeId({
  mid: 42,
  offset: (2022 - 1970) * 31536000 * 1000,
});

export function generateSnowFlakeId(): string {
  return snowflake.generate();
}
