export class PlayerGuild {
  constructor(
    private readonly _guildId: string,
    private readonly availableWorkers: string[],
  ) {}
}
