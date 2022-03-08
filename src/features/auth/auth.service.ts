import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { WorkerEntity } from '@/infra/entities/worker.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Routes } from 'discord-api-types/v10';
import { RequestMethod } from '@discordjs/rest/dist/lib/RequestManager';
import { REST } from '@discordjs/rest';
import { UserOAuth2 } from '@/infra/entities/userOAuth2.entity';
import { AuthInfos } from '@/features/auth/auth.types';

const clientId = '';
const clientSecret = '';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserOAuth2)
    private readonly userOAuth2Repository: Repository<UserOAuth2>,
    @InjectRepository(WorkerEntity)
    private readonly workersRepository: Repository<WorkerEntity>,
  ) {}

  async login(code: string) {
    const redirectURI = 'http://localhost:3000/api/auth';
    const {
      expires_in: expiresIn,
      token_type: tokenType,
      access_token: accessToken,
      refresh_token: refreshToken,
    } = await this._getUserAccessToken(
      code,
      clientId,
      clientSecret,
      redirectURI,
    );

    const userAccess = this.userOAuth2Repository.create({
      accessToken,
      expiresIn,
      refreshToken,
      tokenType,
    });

    await this._injectCurrentAuthorization(userAccess);

    await this.userOAuth2Repository.save(userAccess);
  }

  private async _getUserAccessToken(
    code: string,
    client_id: string,
    client_secret: string,
    redirect_uri: string,
  ) {
    return (await new REST().request({
      method: RequestMethod.Post,
      fullRoute: Routes.oauth2TokenExchange(),
      auth: false,
      passThroughBody: true,
      body: new URLSearchParams({
        client_id,
        client_secret,
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        scope: 'identify',
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })) as Promise<{
      access_token: string;
      expires_in: number;
      refresh_token: string;
      scope: string;
      token_type: 'Bot' | 'Bearer';
    }>;
  }

  private async _getOauth2CurrentAuthorization(token: string) {
    return (await new REST()
      .setToken(token)
      .get(Routes.oauth2CurrentAuthorization(), {
        authPrefix: 'Bearer',
      })) as Promise<AuthInfos>;
  }

  private async _injectCurrentAuthorization(userOAuth2: UserOAuth2) {
    const authInfo = await this._getOauth2CurrentAuthorization(
      userOAuth2.accessToken,
    );

    userOAuth2.userId = authInfo.user.id;
    userOAuth2.scope = authInfo.scopes;
  }
}
